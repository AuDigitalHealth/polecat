import React, { Component } from 'react'
import PropTypes from 'prop-types'
import http from 'axios'
import throttle from 'lodash.throttle'

import TextField from './TextField.js'
import SearchResults from './SearchResults.js'
import { sniffFormat } from './fhir/restApi'
import { getSubjectConcept, amtConceptTypeFor } from './fhir/medication.js'
import { pathForQuery } from './fhir/search.js'

class Search extends Component {
  static propTypes = {
    fhirServer: PropTypes.string.isRequired,
    minRequestFrequency: PropTypes.number,
  }
  static defaultProps = {
    minRequestFrequency: 350,
  }

  constructor(props) {
    super(props)
    this.state = { results: null }
    this.handleQueryUpdate = this.handleQueryUpdate.bind(this)
    this.throttledQueryUpdate = throttle(
      this.throttledQueryUpdate.bind(this),
      this.props.minRequestFrequency
    )
    this.handleSelectResult = this.handleSelectResult.bind(this)
  }

  async getSearchResults(fhirServer, query) {
    const response = await http.get(fhirServer + pathForQuery(query), {
      headers: { Accept: 'application/fhir+json, application/json' },
    })
    sniffFormat(response.headers['content-type'])
    return response.data
  }

  async parseSearchResults(resource) {
    if (resource.total === 0) return []
    return resource.entry
      .map(e => getSubjectConcept(e.resource))
      .map(result => ({ ...result, type: amtConceptTypeFor(result.type) }))
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
    this.getSearchResults(fhirServer, query)
      .then(resource => this.parseSearchResults(resource))
      .then(results => this.setState(() => ({ results })))
      .catch(error => console.error(error))
  }

  handleSelectResult() {
    this.setState(() => ({ query: '' }), () => this.handleQueryUpdate(null))
  }

  componentDidReceiveProps(nextProps) {
    const { fhirServer, query } = nextProps
    if (query) {
      this.getSearchResults(fhirServer, query)
        .then(results => this.setState(() => ({ results })))
        .catch(error => console.error(error))
    }
  }

  render() {
    const { query, results } = this.state
    return (
      <div className='search'>
        <TextField
          value={query}
          placeholder='Search'
          className='search-input'
          onChange={this.handleQueryUpdate}
        />
        <SearchResults
          query={query}
          results={results}
          onSelectResult={this.handleSelectResult}
        />
      </div>
    )
  }
}

export default Search
