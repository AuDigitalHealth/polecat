import React, { Component } from 'react'
import PropTypes from 'prop-types'
import http from 'axios'
import throttle from 'lodash.throttle'
import { withRouter } from 'react-router-dom'

import TextField from './TextField.js'
import QuickSearchResults from './QuickSearchResults.js'
import FullSearchResults from './FullSearchResults.js'
import SearchForm from './SearchForm.js'
import SearchSummary from './SearchSummary.js'
import Expand from './Expand.js'
import { rootPath, searchPathFromQuery } from './Router.js'
import { opOutcomeFromJsonResponse } from './fhir/core.js'
import { sniffFormat } from './fhir/restApi'
import { getSubjectConcept, amtConceptTypeFor } from './fhir/medication.js'
import { nextLinkFromBundle, previousLinkFromBundle } from './fhir/bundle.js'
import { pathForQuery } from './fhir/search.js'

import './css/Search.css'

class Search extends Component {
  static propTypes = {
    fhirServer: PropTypes.string.isRequired,
    query: PropTypes.string,
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
    this.state = { advanced: false }
    this.handleQueryUpdate = this.handleQueryUpdate.bind(this)
    this.throttledQueryUpdate = throttle(
      this.throttledQueryUpdate.bind(this),
      this.props.minRequestFrequency
    )
    this.handleSelectResult = this.handleSelectResult.bind(this)
    this.setLoadingStatus = this.setLoadingStatus.bind(this)
    this.handleToggleAdvanced = this.handleToggleAdvanced.bind(this)
    this.handleNextClick = this.handleNextClick.bind(this)
    this.handlePreviousClick = this.handlePreviousClick.bind(this)
    this.handleError = this.handleError.bind(this)
  }

  throttledQueryUpdate(query, requestFunc) {
    const { fhirServer } = this.props
    this.setLoadingStatus(true)
    this.getSearchResultsFromQuery(fhirServer, query)
      .then(bundle => this.parseSearchResults(bundle))
      .then(parsed =>
        this.setState(() => ({
          bundle: parsed.bundle,
          results: parsed.results,
        }))
      )
      .then(() => this.setLoadingStatus(false))
      .catch(error => this.handleError(error))
  }

  urlUpdate(url) {
    this.setLoadingStatus(true)
    this.getSearchResultsFromUrl(url)
      .then(bundle => this.parseSearchResults(bundle))
      .then(parsed =>
        this.setState(() => ({
          bundle: parsed.bundle,
          results: parsed.results,
        }))
      )
      .then(() => this.setLoadingStatus(false))
      .catch(error => this.handleError(error))
  }

  async getSearchResultsFromQuery(fhirServer, query) {
    const path = pathForQuery(query)
    if (!path) return null
    return this.getSearchResultsFromUrl(fhirServer + path)
  }

  async getSearchResultsFromUrl(url) {
    let response
    try {
      response = await http.get(url, {
        headers: { Accept: 'application/fhir+json, application/json' },
      })
    } catch (error) {
      if (error.response) this.handleUnsuccessfulResponse(error.response)
      else throw error
    }
    sniffFormat(response.headers['content-type'])
    return response.data
  }

  async parseSearchResults(bundle) {
    if (!bundle || bundle.total === 0) return []
    return {
      bundle,
      results: bundle.entry
        .map(e => getSubjectConcept(e.resource))
        .map(result => ({ ...result, type: amtConceptTypeFor(result.type) })),
    }
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
        if (query) {
          const { advanced } = this.state
          this.throttledQueryUpdate(query)
          if (advanced) {
            const { history } = this.props
            history.push(searchPathFromQuery(query))
          }
        }
      }
    )
    if (!query) this.setState({ results: null })
  }

  handleNextClick() {
    const { bundle } = this.state
    const nextLink = nextLinkFromBundle(bundle)
    if (nextLink) this.handleLinkNavigation(nextLink)
  }

  handlePreviousClick() {
    const { bundle } = this.state
    const previousLink = previousLinkFromBundle(bundle)
    if (previousLink) this.handleLinkNavigation(previousLink)
  }

  handleLinkNavigation(url) {
    this.urlUpdate(url)
  }

  handleUnsuccessfulResponse(response) {
    try {
      sniffFormat(response.headers['content-type'])
      const opOutcome = opOutcomeFromJsonResponse(response)
      if (opOutcome) throw opOutcome
    } catch (error) {}
    throw new Error(response.statusText || response.status)
  }

  handleSelectResult() {
    this.handleQueryUpdate(null)
    this.setState(() => ({ advanced: false }))
  }

  handleToggleAdvanced() {
    const { query: queryFromProps, history } = this.props
    const { query: queryFromState, advanced } = this.state
    const query = queryFromState || queryFromProps
    this.setState(() => ({ advanced: !advanced }))
    if (!advanced && query) {
      history.push(searchPathFromQuery(query))
    }
  }

  handleError(error) {
    if (this.props.onError) {
      this.props.onError(error)
    }
  }

  componentWillMount() {
    const { fhirServer, query } = this.props
    if (query) {
      this.setLoadingStatus(true)
      this.getSearchResultsFromQuery(fhirServer, query)
        .then(bundle => this.parseSearchResults(bundle))
        .then(parsed =>
          this.setState(() => ({
            bundle: parsed.bundle,
            results: parsed.results,
            advanced: true,
          }))
        )
        .then(() => this.setLoadingStatus(false))
        .catch(error => this.handleError(error))
    }
  }

  componentWillReceiveProps(nextProps) {
    const { fhirServer, query } = nextProps
    const { advanced } = this.state
    if (this.props.fhirServer === fhirServer && this.props.query === query) {
      return
    }
    if (query) {
      this.setLoadingStatus(true)
      this.getSearchResultsFromQuery(fhirServer, query)
        .then(bundle => this.parseSearchResults(bundle))
        .then(parsed =>
          this.setState(() => ({
            bundle: parsed.bundle,
            results: parsed.results,
            advanced: true,
          }))
        )
        .then(() => this.setLoadingStatus(false))
        .catch(error => this.handleError(error))
    } else if (advanced === true) {
      this.setState(() => ({ advanced: false }))
    }
  }

  render() {
    const { advanced } = this.state
    return advanced ? this.renderAdvancedSearch() : this.renderBasicSearch()
  }

  renderBasicSearch() {
    const { query: queryFromProps, focusUponMount } = this.props
    const { query: queryFromState, results } = this.state
    // If the query has been updated within state, use that over props.
    const query = queryFromState || queryFromProps
    return (
      <div className='search search-basic'>
        <div className='search-basic-form'>
          <TextField
            value={query}
            placeholder='Search'
            className='search-input'
            onChange={this.handleQueryUpdate}
            focusUponMount={focusUponMount}
          />
          <Expand
            active={false}
            className='search-toggle-advanced'
            onToggle={this.handleToggleAdvanced}
          />
        </div>
        <QuickSearchResults
          query={query}
          results={results}
          onSelectResult={this.handleSelectResult}
        />
      </div>
    )
  }

  renderAdvancedSearch() {
    const { query: queryFromProps } = this.props
    const { query: queryFromState, bundle, results } = this.state
    // If the query has been updated within state, use that over props.
    const query = queryFromState || queryFromProps
    return (
      <div className='search search-advanced'>
        <div className='search-advanced-form'>
          <TextField
            value={query}
            placeholder='Search'
            className='search-input'
            disabled
            onChange={this.handleQueryUpdate}
          />
          <SearchForm query={query} onSearchUpdate={this.handleQueryUpdate} />
          <Expand
            active
            className='search-toggle-advanced'
            onToggle={this.handleToggleAdvanced}
          />
        </div>
        {results ? (
          <div className='search-advanced-results'>
            <SearchSummary
              totalResults={bundle.total}
              nextLink={nextLinkFromBundle(bundle)}
              previousLink={previousLinkFromBundle(bundle)}
              onNextClick={this.handleNextClick}
              onPreviousClick={this.handlePreviousClick}
            />
            <FullSearchResults
              query={query}
              results={results}
              onSelectResult={this.handleSelectResult}
            />
          </div>
        ) : null}
      </div>
    )
  }
}

export default withRouter(Search)
