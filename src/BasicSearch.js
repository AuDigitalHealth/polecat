import React, { Component } from 'react'
import PropTypes from 'prop-types'
import isEqual from 'lodash.isequal'

import TextField from './TextField.js'
import Loading from './Loading.js'
import Expand from './Expand.js'
import QuickSearchResults from './QuickSearchResults.js'

import './css/BasicSearch.css'

class BasicSearch extends Component {
  static propTypes = {
    routedQuery: PropTypes.string,
    currentQuery: PropTypes.string,
    results: PropTypes.array,
    bundle: PropTypes.shape({ total: PropTypes.number }),
    focusUponMount: PropTypes.bool,
    loading: PropTypes.bool,
    quickSearchShouldClose: PropTypes.bool,
    onQueryUpdate: PropTypes.func,
    onToggleAdvanced: PropTypes.func,
    onSelectResult: PropTypes.func,
    onQuickSearchClosed: PropTypes.func,
  }

  constructor(props) {
    super(props)
    this.state = { quickSearchOpen: false }
    this.handleQueryUpdate = this.handleQueryUpdate.bind(this)
    this.handleFocus = this.handleFocus.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleToggleAdvanced = this.handleToggleAdvanced.bind(this)
    this.handleSelectResult = this.handleSelectResult.bind(this)
  }

  handleQueryUpdate(query) {
    const { onQueryUpdate } = this.props
    if (onQueryUpdate) onQueryUpdate(query)
  }

  handleFocus() {
    this.setState(() => ({ quickSearchOpen: true }))
  }

  handleBlur(event) {
    if (
      !event.relatedTarget ||
      event.relatedTarget.closest('.search-basic') === null
    ) {
      this.setState(() => ({ quickSearchOpen: false }))
    }
  }

  handleKeyDown(event) {
    // Close the quick search if Escape is pressed.
    if (event.key === 'Escape') {
      this.setState(() => ({ quickSearchOpen: false }))
    }
  }

  handleToggleAdvanced() {
    const { onToggleAdvanced } = this.props
    if (onToggleAdvanced) onToggleAdvanced(false)
  }

  handleSelectResult() {
    const { onSelectResult } = this.props
    this.setState(() => ({ quickSearchOpen: false }))
    if (onSelectResult) onSelectResult()
  }

  componentWillReceiveProps(nextProps) {
    const { results } = this.props
    const {
      results: nextResults,
      quickSearchShouldClose,
      onQuickSearchClosed,
    } = nextProps
    if (quickSearchShouldClose) this.setState({ quickSearchOpen: false })
    else if (!isEqual(results, nextResults)) {
      this.setState({ quickSearchOpen: true })
    }
    if (quickSearchShouldClose && onQuickSearchClosed) onQuickSearchClosed()
  }

  render() {
    const {
      routedQuery,
      currentQuery,
      results,
      bundle,
      focusUponMount,
      loading,
    } = this.props
    const { quickSearchOpen } = this.state
    // If the query has been updated within state, use that over props.
    const query = currentQuery || routedQuery
    return (
      <div className='search-basic'>
        <div className='search-basic-form'>
          <TextField
            value={query}
            placeholder='Search'
            className='search-input'
            onChange={this.handleQueryUpdate}
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}
            onKeyDown={this.handleKeyDown}
            focusUponMount={focusUponMount}
          />
          <Loading loading={loading}>
            <Expand
              active={false}
              className='search-toggle-advanced'
              onToggle={this.handleToggleAdvanced}
            />
          </Loading>
        </div>
        {quickSearchOpen ? (
          <QuickSearchResults
            query={query}
            results={results}
            totalResults={bundle ? bundle.total : null}
            onSelectResult={this.handleSelectResult}
          />
        ) : null}
      </div>
    )
  }
}

export default BasicSearch
