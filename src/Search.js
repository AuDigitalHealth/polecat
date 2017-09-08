import React, { Component } from 'react'
import PropTypes from 'prop-types'
import http from 'axios'
import throttle from 'lodash.throttle'

import TextField from './TextField.js'
import SearchResults from './SearchResults.js'
import { sniffFormat } from './fhir/restApi'
import { getSubjectConcept, amtConceptTypeFor } from './fhir/medication.js'

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
    this.handleQueryUpdate = throttle(
      this.handleQueryUpdate.bind(this),
      this.props.minRequestFrequency
    )
    this.handleSelectResult = this.handleSelectResult.bind(this)
  }

  async getSearchResults(fhirServer, query) {
    const response = await http.get(fhirServer + this.pathForQuery(query), {
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

  pathForQuery(query) {
    return `/Medication/?_text=${query}&_summary=true&_count=20`
  }

  handleQueryUpdate(query) {
    const { fhirServer } = this.props
    if (query) {
      this.setState(
        () => this.setState({ query }),
        () =>
          this.getSearchResults(fhirServer, query)
            .then(resource => this.parseSearchResults(resource))
            .then(results => this.setState(() => ({ results })))
            .catch(error => console.error(error))
      )
    } else {
      this.setState({ results: null })
    }
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
    console.log('Search render', { query, results })
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
