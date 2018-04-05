import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'

import TextField from './TextField.js'
import SearchForm from './SearchForm.js'
import Loading from './Loading.js'
import Expand from './Expand.js'
import SearchSummary from './SearchSummary.js'
import FullSearchResults from './FullSearchResults.js'
import { nextLinkFromBundle, previousLinkFromBundle } from './fhir/bundle.js'

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
    onError: PropTypes.func,
  }

  constructor(props) {
    super(props)
    this.handleQueryUpdate = this.handleQueryUpdate.bind(this)
    this.handleToggleAdvanced = this.handleToggleAdvanced.bind(this)
    this.handleNextClick = this.handleNextClick.bind(this)
    this.handlePreviousClick = this.handlePreviousClick.bind(this)
    this.handleDownloadClick = this.handleDownloadClick.bind(this)
    this.handleSelectResult = this.handleSelectResult.bind(this)
    this.handleError = this.handleError.bind(this)
  }

  handleQueryUpdate(query) {
    const { onQueryUpdate } = this.props
    if (onQueryUpdate) onQueryUpdate(query)
  }

  handleToggleAdvanced() {
    const { onToggleAdvanced } = this.props
    if (onToggleAdvanced) onToggleAdvanced(false)
  }

  handleNextClick() {
    const { onNextClick } = this.props
    if (onNextClick) onNextClick()
  }

  handlePreviousClick() {
    const { onPreviousClick } = this.props
    if (onPreviousClick) onPreviousClick()
  }

  handleDownloadClick() {
    const { onDownloadClick } = this.props
    if (onDownloadClick) onDownloadClick()
  }

  handleSelectResult(result) {
    const { onSelectResult } = this.props
    if (onSelectResult) onSelectResult(result)
  }

  handleError(error) {
    const { onError } = this.props
    if (onError) onError(error)
  }

  render() {
    const {
      routedQuery,
      currentQuery,
      bundle,
      results,
      allResults,
      loading,
    } = this.props
    // If the query has been updated within state, use that over props.
    const query =
      currentQuery === null || currentQuery === undefined
        ? routedQuery
        : currentQuery
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
            <SearchSummary
              totalResults={bundle.total}
              allResults={allResults}
              nextLink={nextLinkFromBundle(bundle)}
              previousLink={previousLinkFromBundle(bundle)}
              loading={loading}
              onNextClick={this.handleNextClick}
              onPreviousClick={this.handlePreviousClick}
              onDownloadClick={this.handleDownloadClick}
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

export default withRouter(AdvancedSearch)
