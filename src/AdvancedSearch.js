import React, { Component } from 'react'
import PropTypes from 'prop-types'

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
    fhirServer: PropTypes.string,
    routedQuery: PropTypes.string,
    currentQuery: PropTypes.string,
    results: PropTypes.array,
    bundle: PropTypes.shape({ total: PropTypes.number }),
    loading: PropTypes.bool,
    onQueryUpdate: PropTypes.func,
    onToggleAdvanced: PropTypes.func,
    onNextClick: PropTypes.func,
    onPreviousClick: PropTypes.func,
    onSelectResult: PropTypes.func,
  }

  constructor(props) {
    super(props)
    this.handleQueryUpdate = this.handleQueryUpdate.bind(this)
    this.handleToggleAdvanced = this.handleToggleAdvanced.bind(this)
    this.handleNextClick = this.handleNextClick.bind(this)
    this.handlePreviousClick = this.handlePreviousClick.bind(this)
    this.handleSelectResult = this.handleSelectResult.bind(this)
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

  handleSelectResult() {
    const { onSelectResult } = this.props
    this.setState(() => ({ quickSearchOpen: false }))
    if (onSelectResult) onSelectResult()
  }

  render() {
    const {
      routedQuery,
      currentQuery,
      bundle,
      results,
      loading,
      fhirServer,
    } = this.props
    // If the query has been updated within state, use that over props.
    const query =
      currentQuery === null || currentQuery === undefined
        ? routedQuery
        : currentQuery
    return (
      <div className='search-advanced'>
        <div className='search-advanced-form'>
          <TextField
            value={query}
            placeholder='Search'
            className='search-input'
            disabled
            onChange={this.handleQueryUpdate}
          />
          <SearchForm
            fhirServer={fhirServer}
            query={query}
            onSearchUpdate={this.handleQueryUpdate}
          />
          <Loading loading={loading}>
            <Expand
              active
              className='search-toggle-advanced'
              onToggle={this.handleToggleAdvanced}
            />
          </Loading>
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

export default AdvancedSearch
