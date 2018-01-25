import React, { Component } from 'react'
import PropTypes from 'prop-types'
import http, { CancelToken } from 'axios'
import throttle from 'lodash.throttle'
import { withRouter } from 'react-router-dom'

import BasicSearch from './BasicSearch.js'
import AdvancedSearch from './AdvancedSearch.js'
import { searchPathFromQuery } from './Router.js'
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
    onError: PropTypes.func,
    focusUponMount: PropTypes.bool,
    quickSearchShouldClose: PropTypes.bool,
    history: PropTypes.any.isRequired,
  }
  static defaultProps = {
    minRequestFrequency: 350,
  }

  constructor(props) {
    super(props)
    this.state = { advanced: false, quickSearchShouldClose: false }
    this.handleQueryUpdate = this.handleQueryUpdate.bind(this)
    this.throttledQueryUpdate = throttle(
      this.throttledQueryUpdate.bind(this),
      props.minRequestFrequency,
    )
    this.handleSelectResult = this.handleSelectResult.bind(this)
    this.setLoadingStatus = this.setLoadingStatus.bind(this)
    this.handleToggleAdvanced = this.handleToggleAdvanced.bind(this)
    this.handleNextClick = this.handleNextClick.bind(this)
    this.handlePreviousClick = this.handlePreviousClick.bind(this)
    this.handleQuickSearchClosed = this.handleQuickSearchClosed.bind(this)
    this.handleError = this.handleError.bind(this)
  }

  throttledQueryUpdate(query) {
    const { fhirServer } = this.props
    this.setLoadingStatus(true)
    this.getSearchResultsFromQuery(fhirServer, query)
      .then(bundle => this.parseSearchResults(bundle))
      .then(parsed =>
        this.setState(() => ({
          bundle: parsed.bundle,
          results: parsed.results,
          cancelRequest: null,
        })),
      )
      .then(() => this.setLoadingStatus(false))
      .catch(error => this.handleError(error))
      .then(() => this.setLoadingStatus(false))
  }

  urlUpdate(url) {
    this.setLoadingStatus(true)
    this.getSearchResultsFromUrl(url)
      .then(bundle => this.parseSearchResults(bundle))
      .then(parsed =>
        this.setState(() => ({
          bundle: parsed.bundle,
          results: parsed.results,
          cancelRequest: null,
        })),
      )
      .then(() => this.setLoadingStatus(false))
      .catch(error => this.handleError(error))
      .then(() => this.setLoadingStatus(false))
  }

  async getSearchResultsFromQuery(fhirServer, query) {
    const path = pathForQuery(query)
    if (!path) return null
    return this.getSearchResultsFromUrl(fhirServer + path)
  }

  async getSearchResultsFromUrl(url) {
    const { cancelRequest } = this.state
    let response, cancelToken
    try {
      if (cancelRequest) cancelRequest()
      response = await http.get(url, {
        headers: { Accept: 'application/fhir+json' },
        cancelToken: new CancelToken(function executor(c) {
          cancelToken = c
        }),
        timeout: 10000,
      })
      this.setState(() => ({ cancelRequest: cancelToken }))
    } catch (error) {
      if (error.response) this.handleUnsuccessfulResponse(error.response)
      else throw error
    }
    sniffFormat(response.headers['content-type'])
    return response.data
  }

  async parseSearchResults(bundle) {
    if (!bundle || bundle.total === 0) {
      return { bundle, results: [] }
    }
    return {
      bundle,
      results: bundle.entry
        .map(e => getSubjectConcept(e.resource))
        .map(result => ({ ...result, type: amtConceptTypeFor(result.type) })),
    }
  }

  setLoadingStatus(loading) {
    this.setState(() => ({ loading }))
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
      },
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
    sniffFormat(response.headers['content-type'])
    const opOutcome = opOutcomeFromJsonResponse(response)
    throw opOutcome
      ? opOutcome
      : new Error(response.statusText || response.status)
  }

  handleSelectResult() {
    this.setState(() => ({ advanced: false, quickSearchShouldClose: true }))
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

  handleQuickSearchClosed() {
    this.setState(() => ({ quickSearchShouldClose: false }))
  }

  handleError(error) {
    const { onError } = this.props
    if (onError) onError(error)
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
            cancelRequest: null,
          })),
        )
        .then(() => this.setLoadingStatus(false))
        .catch(error => this.handleError(error))
        .then(() => this.setLoadingStatus(false))
    }
  }

  componentWillUnmount() {
    const { cancelRequest } = this.state
    if (cancelRequest) cancelRequest()
  }

  componentWillReceiveProps(nextProps) {
    const { fhirServer, query, quickSearchShouldClose } = nextProps
    const { advanced } = this.state
    if (this.props.fhirServer === fhirServer && this.props.query === query) {
      return
    }
    if (query) {
      this.setState(() => ({ advanced: true }))
      this.setLoadingStatus(true)
      this.getSearchResultsFromQuery(fhirServer, query)
        .then(bundle => this.parseSearchResults(bundle))
        .then(parsed =>
          this.setState(() => ({
            bundle: parsed.bundle,
            results: parsed.results,
            cancelRequest: null,
            query,
          })),
        )
        .then(() => this.setLoadingStatus(false))
        .catch(error => this.handleError(error))
    } else if (advanced === true) {
      this.setState(() => ({ advanced: false }))
    }
    if (quickSearchShouldClose) this.setState({ quickSearchShouldClose: true })
  }

  render() {
    const { results } = this.state
    return (
      <div className={results ? 'search with-results' : 'search'}>
        {this.renderBasicOrAdvancedSearch()}
      </div>
    )
  }

  renderBasicOrAdvancedSearch() {
    const { query: queryFromProps, focusUponMount, fhirServer } = this.props
    const {
      query: queryFromState,
      advanced,
      results,
      bundle,
      loading,
      quickSearchShouldClose,
    } = this.state
    return advanced ? (
      <AdvancedSearch
        fhirServer={fhirServer}
        routedQuery={queryFromProps}
        currentQuery={queryFromState}
        results={results}
        bundle={bundle}
        loading={loading}
        onQueryUpdate={this.handleQueryUpdate}
        onToggleAdvanced={this.handleToggleAdvanced}
        onNextClick={this.handleNextClick}
        onPreviousClick={this.handlePreviousClick}
        onSelectResult={this.handleSelectResult}
        onError={this.handleError}
      />
    ) : (
      <BasicSearch
        routedQuery={queryFromProps}
        currentQuery={queryFromState}
        results={results}
        bundle={bundle}
        focusUponMount={focusUponMount}
        loading={loading}
        quickSearchShouldClose={quickSearchShouldClose}
        onQueryUpdate={this.handleQueryUpdate}
        onToggleAdvanced={this.handleToggleAdvanced}
        onSelectResult={this.handleSelectResult}
        onQuickSearchClosed={this.handleQuickSearchClosed}
      />
    )
  }
}

export default withRouter(Search)
