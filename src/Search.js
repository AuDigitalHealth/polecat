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
import { nextLinkFromBundle } from './fhir/bundle.js'
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
    this.state = {
      advanced: false,
      quickSearchShouldClose: false,
      outstandingRequests: [],
    }
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
    this.handleDownloadClick = this.handleDownloadClick.bind(this)
    this.handleQuickSearchClosed = this.handleQuickSearchClosed.bind(this)
    this.handleRequireMoreResults = this.handleRequireMoreResults.bind(this)
    this.handleError = this.handleError.bind(this)
  }

  // Gets the search results using either a search query string or a search URL,
  // then updates the state with the results.
  updateResults({ fhirServer, query, url, resultCount, update = true }) {
    const updateFn = this.getUpdateFn({ fhirServer, query, url, resultCount })
    this.setLoadingStatus(true)
    return new Promise((resolve, reject) => {
      updateFn()
        .then(bundle => this.parseSearchResults(bundle))
        .then(parsed => {
          if (update) {
            this.setState(() => ({
              bundle: parsed.bundle,
              results: this.addLinksToResults(parsed.results),
              query,
            }))
          }
          resolve(parsed)
          return parsed
        })
        .then(() => this.setLoadingStatus(false))
        .catch(error => {
          this.handleError(error)
          this.setLoadingStatus(false)
          reject(error)
        })
    })
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
    return new Promise((resolve, reject) => {
      const updateFn = this.getUpdateFn({ fhirServer, query, url })
      updateFn()
        .then(bundle => this.parseSearchResults(bundle))
        .then(parsed => {
          const nextLink = parsed.bundle.link.find(l => l.relation === 'next')
          // If there is a next link within the bundle, recurse into this
          // function and concatenate all the results together.
          return nextLink
            ? this.getAllResults({
                fhirServer,
                url: nextLink.url,
                acc: acc.concat(parsed.results),
              })
            : resolve(acc.concat(parsed.results))
        })
        .then(nextBundle => resolve(nextBundle))
        .catch(error => reject(error))
    })
  }

  getUpdateFn({ fhirServer, query, url, resultCount }) {
    const search = this,
      updateFn =
        fhirServer && query
          ? async function() {
              return search.getSearchResultsFromQuery(
                fhirServer,
                query,
                resultCount ? { resultCount } : undefined,
              )
            }
          : async function() {
              return search.getSearchResultsFromUrl(url)
            }
    if (!((fhirServer && query) || url))
      throw new Error('Must supply fhirServer and query, or url.')
    return updateFn
  }

  async getSearchResultsFromQuery(fhirServer, query, options) {
    const path = pathForQuery(query, options)
    if (!path) return null
    return this.getSearchResultsFromUrl(fhirServer + path)
  }

  async getSearchResultsFromUrl(url) {
    let response, newCancelRequest
    try {
      const cancelToken = new CancelToken(function executor(c) {
        newCancelRequest = c
      })
      this.registerPendingRequest(newCancelRequest)
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

  // Register a new search request, along with the function which can cancel it.
  registerPendingRequest(cancel) {
    this.setState(() => ({
      cancelPendingRequest: cancel,
    }))
  }

  // Cancel the previously registered pending request.
  cancelPendingRequest() {
    const { cancelPendingRequest } = this.state
    if (cancelPendingRequest) cancelPendingRequest()
  }

  // Recursive function which gets a specified number of pages of requests,
  // and concatenates them to the supplied set of results.
  getMoreResults(results, nextLink, requestsNeeded) {
    return new Promise((resolve, reject) => {
      const { outstandingRequests } = this.state,
        requestOutstanding = Object.keys(outstandingRequests).includes(nextLink)
      // If we detect a collision with an existing request, we call the whole
      // thing off.
      if (requestOutstanding) {
        resolve({})
        return
      }
      // If we have iterated down to our prescribed number of pages or we hit
      // the end of the results, we resolve the promise.
      if (requestsNeeded < 1 || !nextLink) {
        resolve({ results, moreResultsLink: nextLink })
        return
      }
      // Otherwise, we recurse deeper by kicking off another iteration with
      // the accumulated results and the new next link.
      this.updateResults({ url: nextLink, update: false })
        .then(parsed => {
          const nextLink = nextLinkFromBundle(parsed.bundle)
          // eslint-disable-next-line promise/no-nesting
          return this.getMoreResults(
            results.concat(parsed.results),
            nextLink,
            requestsNeeded - 1,
          ).then(({ results, moreResultsLink }) =>
            resolve({ results, moreResultsLink }),
          )
        })
        .catch(error => reject(error))
    })
  }

  handleQueryUpdate(query, { resultCount } = {}) {
    const { fhirServer } = this.props,
      queryDiffers = query !== this.state.query
    // Cancel any outstanding search request, we will update to match the
    // results to this search now or when the throttle period renews.
    this.cancelPendingRequest()
    this.setState(
      () => ({ query }),
      () => {
        if (query && queryDiffers) {
          const { advanced } = this.state
          this.throttledUpdateResults({ fhirServer, query, resultCount })
          if (advanced) {
            const { history } = this.props
            history.push(searchPathFromQuery(query, { resultCount }))
          }
        }
      },
    )
    if (!query) this.setState({ results: null })
  }

  handleDownloadClick() {
    const { fhirServer } = this.props,
      query = this.state.query || this.props.query
    this.updateAllResults({ fhirServer, query })
  }

  // Handler used by infinite scroll to request additional search results as the
  // user scrolls down the page.
  handleRequireMoreResults({ stopIndex }) {
    const {
        bundle,
        results: initialResults,
        moreResultsLink,
        getMoreResultsInProgress,
      } = this.state,
      // The search link to use is either the one from the first bundle, or the
      // one from the last request used to get more results.
      nextLink = moreResultsLink || nextLinkFromBundle(bundle),
      // Calculate number of additional pages of search results needed, based upon
      // the number of results we already have and the end of the request window.
      requestsNeeded = Math.floor((stopIndex - initialResults.length) / 100) + 1
    // Only allow one operation to get more results to execute at one time.
    if (getMoreResultsInProgress) return Promise.resolve(null)
    this.setState(() => ({ getMoreResultsInProgress: true }))
    // Get more results, then add them to the end of the current results and
    // update within state.
    return this.getMoreResults(initialResults, nextLink, requestsNeeded)
      .then(({ results, moreResultsLink }) => {
        this.setState(() => ({ getMoreResultsInProgress: false }))
        // If results were returned, update state with the new set of results,
        // and record the link that we are up to for next time we go to get more results.
        return results
          ? this.setState(() => ({
              results: this.addLinksToResults(results),
              moreResultsLink,
            }))
          : null
      })
      .catch(error => {
        this.setState(() => ({ getMoreResultsInProgress: false }))
        this.handleError(error)
      })
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
    this.cancelPendingRequest()
  }

  componentWillReceiveProps(nextProps) {
    const { fhirServer, query, quickSearchShouldClose } = nextProps
    const { advanced } = this.state
    if (this.props.fhirServer === fhirServer && this.props.query === query) {
      return
    }
    if (query) {
      this.setState(() => ({ advanced: true }))
      // Cancel any outstanding search requests, we will update to match the
      // results to this search now or when the throttle period renews.
      this.cancelPendingRequest()
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
        onRequireMoreResults={this.handleRequireMoreResults}
        onError={this.handleError}
      />
    ) : (
      <BasicSearch
        routedQuery={queryFromProps}
        currentQuery={queryFromState}
        results={results ? results.slice(0, 19) : null}
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
