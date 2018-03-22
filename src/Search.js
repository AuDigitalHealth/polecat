import React, { Component } from 'react'
import PropTypes from 'prop-types'
import http, { CancelToken } from 'axios'
import throttle from 'lodash.throttle'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import pick from 'lodash.pick'
import isEqual from 'lodash.isequal'

import BasicSearch from './BasicSearch.js'
import AdvancedSearch from './AdvancedSearch.js'
import { searchPathFromQuery } from './Router.js'
import { opOutcomeFromJsonResponse } from './fhir/core.js'
import { sniffFormat } from './fhir/restApi'
import { getSubjectConcept, amtConceptTypeFor } from './fhir/medication.js'
import { nextLinkFromBundle, previousLinkFromBundle } from './fhir/bundle.js'
import { pathForQuery } from './fhir/search.js'
import { codingToSnomedCode } from './fhir/medication.js'

import './css/Search.css'

export class Search extends Component {
  static propTypes = {
    fhirServer: PropTypes.string.isRequired,
    query: PropTypes.string,
    minRequestFrequency: PropTypes.number,
    focusUponMount: PropTypes.bool,
    quickSearchShouldClose: PropTypes.bool,
    loading: PropTypes.bool,
    history: PropTypes.any.isRequired,
    onError: PropTypes.func,
    onLoadingChange: PropTypes.func,
  }
  static defaultProps = {
    minRequestFrequency: 350,
    loading: false,
  }

  constructor(props) {
    super(props)
    this.state = { advanced: false, quickSearchShouldClose: false }
    this.handleQueryUpdate = this.handleQueryUpdate.bind(this)
    this.updateResults = this.updateResults.bind(this)
    this.throttledUpdateResults = throttle(
      this.updateResults.bind(this),
      props.minRequestFrequency,
    )
    this.getSearchResultsFromUrl = this.getSearchResultsFromUrl.bind(this)
    this.handleSelectResult = this.handleSelectResult.bind(this)
    this.setLoadingStatus = this.setLoadingStatus.bind(this)
    this.handleToggleAdvanced = this.handleToggleAdvanced.bind(this)
    this.handleNextClick = this.handleNextClick.bind(this)
    this.handlePreviousClick = this.handlePreviousClick.bind(this)
    this.handleDownloadClick = this.handleDownloadClick.bind(this)
    this.handleQuickSearchClosed = this.handleQuickSearchClosed.bind(this)
    this.handleError = this.handleError.bind(this)
  }

  // Gets the search results using either a search query string or a search URL,
  // then updates the state with the results.
  updateResults({ fhirServer, query, url }) {
    const updateFn = this.getUpdateFn({ fhirServer, query, url })
    this.setLoadingStatus(true)
    updateFn()
      .then(bundle => this.parseSearchResults(bundle))
      .then(parsed =>
        this.setState(() => ({
          bundle: parsed.bundle,
          results: this.addLinksToResults(parsed.results),
          query,
        })),
      )
      .then(() => this.setLoadingStatus(false))
      .catch(error => this.handleError(error))
      .then(() => this.setLoadingStatus(false))
  }

  updateAllResults({ fhirServer, query, url }) {
    this.setLoadingStatus(true)
    this.getAllResults({ fhirServer, query, url })
      .then(results =>
        this.setState(() => ({
          allResults: results,
        })),
      )
      .then(() => this.setLoadingStatus(false))
      .catch(error => {
        this.handleError(error)
        this.setLoadingStatus(false)
      })
  }

  getAllResults({ fhirServer, query, url, acc = [] }) {
    return new Promise(resolve => {
      const updateFn = this.getUpdateFn({ fhirServer, query, url })
      updateFn()
        .then(bundle => this.parseSearchResults(bundle))
        .then(parsed => {
          const nextLink = parsed.bundle.link.find(l => l.relation === 'next')
          if (nextLink) {
            this.getAllResults({
              fhirServer,
              url: nextLink.url,
              acc: acc.concat(parsed.results),
            }).then(nextBundle => resolve(nextBundle))
          } else resolve(acc.concat(parsed.results))
        })
    })
  }

  getUpdateFn({ fhirServer, query, url }) {
    const search = this,
      updateFn =
        fhirServer && query
          ? async function() {
              return search.getSearchResultsFromQuery(fhirServer, query)
            }
          : async function() {
              return search.getSearchResultsFromUrl(url)
            }
    if (!((fhirServer && query) || url))
      throw new Error('Must supply fhirServer and query, or url.')
    return updateFn
  }

  async getSearchResultsFromQuery(fhirServer, query) {
    const path = pathForQuery(query)
    if (!path) return null
    return this.getSearchResultsFromUrl(fhirServer + path)
  }

  async getSearchResultsFromUrl(url) {
    let response, newCancelRequest
    try {
      const cancelToken = new CancelToken(function executor(c) {
        newCancelRequest = c
      })
      this.setState(() => ({ cancelRequest: newCancelRequest }))
      response = await http.get(url, {
        headers: { Accept: 'application/fhir+json' },
        cancelToken,
        timeout: 10000,
      })
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

  addLinksToResults(results) {
    if (!results) return results
    return results.map(result => {
      const snomedCode = codingToSnomedCode(result.coding)
      if (snomedCode) {
        const link =
          result.type === 'substance'
            ? `/Substance/${snomedCode}`
            : `/Medication/${snomedCode}`
        return { ...result, link }
      } else return result
    })
  }

  setLoadingStatus(loading) {
    const { onLoadingChange } = this.props
    if (onLoadingChange) onLoadingChange(loading)
  }

  handleQueryUpdate(query) {
    const { fhirServer } = this.props,
      { cancelRequest } = this.state,
      queryDiffers = query !== this.state.query
    // Cancel any outstanding search requests, we will update to match the
    // results to this search now or when the throttle period renews.
    if (cancelRequest) cancelRequest()
    this.setState(
      () => ({ query }),
      () => {
        if (query && queryDiffers) {
          const { advanced } = this.state
          this.throttledUpdateResults({ fhirServer, query })
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

  handleDownloadClick() {
    const { fhirServer } = this.props,
      query = this.state.query || this.props.query
    this.updateAllResults({ fhirServer, query })
  }

  handleLinkNavigation(url) {
    this.updateResults({ url })
  }

  handleUnsuccessfulResponse(response) {
    sniffFormat(response.headers['content-type'])
    const opOutcome = opOutcomeFromJsonResponse(response)
    throw opOutcome
      ? opOutcome
      : new Error(response.statusText || response.status)
  }

  handleSelectResult(result) {
    const { history } = this.props
    this.setState(() => ({ advanced: false, quickSearchShouldClose: true }))
    if (result && result.link) history.push(result.link)
  }

  handleToggleAdvanced() {
    const { advanced } = this.state
    this.setState(() => ({ advanced: !advanced }))
  }

  handleQuickSearchClosed() {
    this.setState(() => ({ quickSearchShouldClose: false }))
  }

  handleError(error) {
    const { onError } = this.props
    // Only notify upstream components about the error if it is not a request
    // cancellation.
    if (onError && !http.isCancel(error)) onError(error)
  }

  componentWillMount() {
    const { fhirServer, query } = this.props
    if (query) {
      this.setState(() => ({ advanced: true }))
      this.updateResults({ fhirServer, query })
    }
  }

  componentWillUnmount() {
    const { cancelRequest } = this.state
    if (cancelRequest) cancelRequest()
  }

  componentWillReceiveProps(nextProps) {
    const { fhirServer, query, quickSearchShouldClose } = nextProps
    const { advanced, cancelRequest } = this.state
    if (this.props.fhirServer === fhirServer && this.props.query === query) {
      return
    }
    if (query) {
      this.setState(() => ({ advanced: true }))
      // Cancel any outstanding search requests, we will update to match the
      // results to this search now or when the throttle period renews.
      if (cancelRequest) cancelRequest()
      // Skip the search request if the query is the same as the previous one
      // stored in state.
      if (query !== this.state.query) this.updateResults({ fhirServer, query })
    } else if (advanced === true) {
      this.setState(() => ({ advanced: false }))
    }
    if (quickSearchShouldClose) this.setState({ quickSearchShouldClose: true })
  }

  shouldComponentUpdate(nextProps, nextState) {
    const triggerProps = ['query', 'focusUponMount', 'loading'],
      triggerState = [
        'query',
        'advanced',
        'results',
        'allResults',
        'bundle',
        'quickSearchShouldClose',
      ]
    return (
      !isEqual(pick(nextProps, triggerProps), pick(this.props, triggerProps)) ||
      !isEqual(pick(nextState, triggerState), pick(this.state, triggerState))
    )
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
    const { query: queryFromProps, focusUponMount, loading } = this.props
    const {
      query: queryFromState,
      advanced,
      results,
      allResults,
      bundle,
      quickSearchShouldClose,
    } = this.state
    return advanced ? (
      <AdvancedSearch
        routedQuery={queryFromProps}
        currentQuery={queryFromState}
        results={results}
        allResults={allResults}
        bundle={bundle}
        loading={loading}
        onQueryUpdate={this.handleQueryUpdate}
        onToggleAdvanced={this.handleToggleAdvanced}
        onNextClick={this.handleNextClick}
        onPreviousClick={this.handlePreviousClick}
        onDownloadClick={this.handleDownloadClick}
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

// Bring `fhirServer` and `history` into props.
export default connect(({ fhirServer }) => ({ fhirServer }))(withRouter(Search))
