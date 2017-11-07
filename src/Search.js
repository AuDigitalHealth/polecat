import React, { Component } from 'react'
import PropTypes from 'prop-types'
import http from 'axios'
import throttle from 'lodash.throttle'

import TextField from './TextField.js'
import SearchResults from './SearchResults.js'
import { opOutcomeFromJsonResponse } from './fhir/core.js'
import { sniffFormat } from './fhir/restApi'
import { getSubjectConcept, amtConceptTypeFor } from './fhir/medication.js'
import { pathForQuery } from './fhir/search.js'

import './css/Search.css'

class Search extends Component {
  static propTypes = {
    fhirServer: PropTypes.string.isRequired,
    minRequestFrequency: PropTypes.number,
    onLoadingChange: PropTypes.func,
    onError: PropTypes.func,
    focusUponMount: PropTypes.bool,
  }
  static defaultProps = {
    minRequestFrequency: 350,
  }

  constructor(props) {
    super(props)
    this.state = { results: null, advanced: false }
    this.handleQueryUpdate = this.handleQueryUpdate.bind(this)
    this.throttledQueryUpdate = throttle(
      this.throttledQueryUpdate.bind(this),
      this.props.minRequestFrequency
    )
    this.handleSelectResult = this.handleSelectResult.bind(this)
    this.setLoadingStatus = this.setLoadingStatus.bind(this)
    this.handleToggleAdvanced = this.handleToggleAdvanced.bind(this)
    this.handleError = this.handleError.bind(this)
  }

  async getSearchResults(fhirServer, query) {
    let response
    try {
      const path = pathForQuery(query)
      if (!path) return null
      response = await http.get(fhirServer + path, {
        headers: { Accept: 'application/fhir+json, application/json' },
      })
    } catch (error) {
      if (error.response) this.handleUnsuccessfulResponse(error.response)
      else throw error
    }
    sniffFormat(response.headers['content-type'])
    return response.data
  }

  handleUnsuccessfulResponse(response) {
    try {
      sniffFormat(response.headers['content-type'])
      const opOutcome = opOutcomeFromJsonResponse(response)
      if (opOutcome) throw opOutcome
    } catch (error) {}
    throw new Error(response.statusText || response.status)
  }

  async parseSearchResults(resource) {
    if (!resource || resource.total === 0) return []
    return resource.entry
      .map(e => getSubjectConcept(e.resource))
      .map(result => ({ ...result, type: amtConceptTypeFor(result.type) }))
  }

  setLoadingStatus(loading) {
    if (this.props.onLoadingChange) {
      this.props.onLoadingChange(loading)
    }
  }

  handleQueryUpdate(query) {
    this.setState(
      () => ({ query }),
      () => {
        if (query) this.throttledQueryUpdate(query)
      }
    )
    if (!query) this.setState({ results: null })
  }

  throttledQueryUpdate(query) {
    const { fhirServer } = this.props
    this.setLoadingStatus(true)
    this.getSearchResults(fhirServer, query)
      .then(resource => this.parseSearchResults(resource))
      .then(results => this.setState(() => ({ results })))
      .then(() => this.setLoadingStatus(false))
      .catch(error => this.handleError(error))
  }

  handleSelectResult() {
    this.setState(() => ({ query: '' }), () => this.handleQueryUpdate(null))
  }

  handleToggleAdvanced() {
    this.setState(() => ({ advanced: !this.state.advanced }))
  }

  handleError(error) {
    if (this.props.onError) {
      this.props.onError(error)
    }
  }

  componentDidReceiveProps(nextProps) {
    const { fhirServer, query } = nextProps
    if (query) {
      this.getSearchResults(fhirServer, query)
        .then(results => this.setState(() => ({ results })))
        .catch(error => this.handleError(error))
    }
  }

  render() {
    const { focusUponMount } = this.props
    const { query, results } = this.state
    return (
      <div className='search'>
        <TextField
          value={query}
          placeholder='Search'
          className='search-input'
          onChange={this.handleQueryUpdate}
          focusUponMount={focusUponMount}
        />
        <SearchResults
          query={query}
          results={results}
          onSelectResult={this.handleSelectResult}
        />
        {/* <div
          className='search-toggle-advanced'
          onClick={this.handleToggleAdvanced}
        >
          {advanced ? '\u25B3' : '\u25BD'}
        </div> */}
      </div>
    )
  }
}

export default Search
