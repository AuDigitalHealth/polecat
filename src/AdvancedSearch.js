import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import { Set, OrderedSet } from 'immutable'

import TextField from './TextField.js'
import SearchForm from './SearchForm.js'
import Loading from './Loading.js'
import Expand from './Expand.js'
import SearchSummary from './SearchSummary.js'
import FullSearchResults from './FullSearchResults.js'
import { paramsFromQuery } from './fhir/search.js'

import './css/AdvancedSearch.css'

class AdvancedSearch extends Component {
  static propTypes = {
    routedQuery: PropTypes.string,
    currentQuery: PropTypes.string,
    results: PropTypes.array,
    allResults: PropTypes.array,
    bundle: PropTypes.shape({ total: PropTypes.number }),
    loading: PropTypes.bool,
    history: PropTypes.any.isRequired,
    onQueryUpdate: PropTypes.func,
    onToggleAdvanced: PropTypes.func,
    onNextClick: PropTypes.func,
    onPreviousClick: PropTypes.func,
    onDownloadClick: PropTypes.func,
    onSelectResult: PropTypes.func,
    onRequireMoreResults: PropTypes.func,
    onError: PropTypes.func,
  }

  constructor(props) {
    super(props)
    this.handleQueryUpdate = this.handleQueryUpdate.bind(this)
    this.handleToggleAdvanced = this.handleToggleAdvanced.bind(this)
    this.handleDownloadClick = this.handleDownloadClick.bind(this)
    this.handleRequireMoreResults = this.handleRequireMoreResults.bind(this)
    this.handleShowGM = this.handleShowGM.bind(this)
    this.handleHideGM = this.handleHideGM.bind(this)
    this.handleError = this.handleError.bind(this)
    this.state = {
      shownGMs: new OrderedSet(),
      hiddenGMs: new OrderedSet(),
    }
  }

  // Checks whether the supplied search query constrains results to a single
  // concept type, and that the type is CTPP, TPP or TPUU. If it does, the
  // concept type is returned - otherwise the function returns null.
  queryReturnsSingleConceptType(query) {
    if (!query) return undefined
    const { medParams } = paramsFromQuery(query),
      foundTypeParam = medParams.find(p => p[0] === 'type'),
      type = foundTypeParam ? foundTypeParam[1] : null
    if (
      type &&
      type.split(',').length === 1 &&
      ['CTPP', 'TPP', 'TPUU'].includes(type)
    ) {
      return type
    } else {
      return null
    }
  }

  // Checks whether the supplied search query constrains results to a single
  // concept type, and that the type is CTPP, TPP or TPUU. If it does, a Set
  // containing the applicable generalised medicine types is returned -
  // otherwise the function returns an empty Set.
  applicableGMsForQuery(query) {
    return this.applicableGMsForType(this.queryReturnsSingleConceptType(query))
  }

  // Returns a Set containing the applicable generalised medicines for the
  // specified concept type. Returns an empty Set if there is no match.
  applicableGMsForType(type) {
    if (!type) return new Set()
    const applicableGMs = {
      CTPP: ['TPP', 'MPP'],
      TPP: ['MPP'],
      TPUU: ['MPUU', 'MP'],
    }[type]
    return applicableGMs ? new Set(applicableGMs) : new Set()
  }

  // Custom comparator function for making sure that the set of generalized
  // medicines is always passed down in a predictable order (specific to general).
  static compareGMTypes(type1, type2) {
    const ordering = {
      TPP: 1,
      MPP: 2,
      MPUU: 3,
      MP: 4,
    }
    return ordering[type1] - ordering[type2]
  }

  // Make sure that the shown and hidden generalized medicines are only
  // applicable ones, when the query changes.
  updateShownHiddenGMs(query) {
    const applicableGMs = this.applicableGMsForQuery(query),
      { shownGMs: prevShownGMs } = this.state,
      // Shown generalised medicines are preserved if they are present within
      // the new set of applicable types.
      shownGMs = prevShownGMs
        .intersect(applicableGMs)
        .sort(AdvancedSearch.compareGMTypes),
      // Hidden generalised medicines consist of all the applicable types,
      // minus any that are shown.
      hiddenGMs = applicableGMs
        .subtract(shownGMs)
        .sort(AdvancedSearch.compareGMTypes)
    this.setState(() => ({ shownGMs, hiddenGMs }))
  }

  handleQueryUpdate(query) {
    const { onQueryUpdate } = this.props
    if (onQueryUpdate) onQueryUpdate(query)
  }

  handleToggleAdvanced() {
    const { onToggleAdvanced } = this.props
    if (onToggleAdvanced) onToggleAdvanced(false)
  }

  handleDownloadClick() {
    const { onDownloadClick } = this.props
    if (onDownloadClick) onDownloadClick()
  }

  handleRequireMoreResults({ stopIndex }) {
    const { onRequireMoreResults } = this.props
    if (onRequireMoreResults) return onRequireMoreResults({ stopIndex })
  }

  handleShowGM(type) {
    const { shownGMs, hiddenGMs } = this.state
    if (!hiddenGMs.has(type)) {
      throw new Error(
        `Attempt to show a generalised medicine type (${type}) that is not currently hidden.`,
      )
    }
    this.setState(() => ({
      shownGMs: shownGMs.add(type).sort(AdvancedSearch.compareGMTypes),
      hiddenGMs: hiddenGMs.delete(type).sort(AdvancedSearch.compareGMTypes),
    }))
  }

  handleHideGM(type) {
    const { shownGMs, hiddenGMs } = this.state
    if (!shownGMs.has(type)) {
      throw new Error(
        `Attempt to hide a generalised medicine type (${type}) that is not currently shown.`,
      )
    }
    this.setState(() => ({
      shownGMs: shownGMs.delete(type).sort(AdvancedSearch.compareGMTypes),
      hiddenGMs: hiddenGMs.add(type).sort(AdvancedSearch.compareGMTypes),
    }))
  }

  handleError(error) {
    const { onError } = this.props
    if (onError) onError(error)
  }

  componentDidMount() {
    this.updateShownHiddenGMs(this.props.currentQuery)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.currentQuery !== nextProps.currentQuery)
      this.updateShownHiddenGMs(nextProps.currentQuery)
  }

  render() {
    const {
        routedQuery,
        currentQuery,
        bundle,
        results,
        allResults,
        loading,
      } = this.props,
      { shownGMs, hiddenGMs } = this.state,
      // If the query has been updated within state, use that over props.
      query =
        currentQuery === null || currentQuery === undefined
          ? routedQuery
          : currentQuery,
      allResultsAreOfType = this.queryReturnsSingleConceptType(currentQuery)
    return (
      <div className="search-advanced">
        <div className="search-advanced-form">
          <TextField
            value={query}
            placeholder="Search"
            className="search-input"
            disabled
            onChange={this.handleQueryUpdate}
          />
          <SearchForm
            query={query}
            onSearchUpdate={this.handleQueryUpdate}
            onError={this.handleError}
          />
          <Loading loading={loading}>
            <Expand
              active
              className="search-toggle-advanced"
              onToggle={this.handleToggleAdvanced}
            />
          </Loading>
        </div>
        {results ? (
          <div className="search-advanced-results">
            {results.length > 0 ? (
              <SearchSummary
                totalResults={bundle.total}
                allResults={allResults}
                allResultsAreOfType={allResultsAreOfType}
                shownGMs={shownGMs.toArray()}
                hiddenGMs={hiddenGMs.toArray()}
                loading={loading}
                onDownloadClick={this.handleDownloadClick}
                onShowGM={this.handleShowGM}
                onHideGM={this.handleHideGM}
              />
            ) : null}
            <FullSearchResults
              query={query}
              totalResults={bundle.total}
              results={results}
              allResultsAreOfType={allResultsAreOfType}
              shownGMs={shownGMs.toArray()}
              onRequireMoreResults={this.handleRequireMoreResults}
            />
          </div>
        ) : null}
      </div>
    )
  }
}

export default withRouter(AdvancedSearch)
