import React, { Component } from 'react'
import PropTypes from 'prop-types'
import isEqual from 'lodash.isequal'

import TextField from './TextField.js'
import Loading from './Loading.js'
import Expand from './Expand.js'
import QuickSearchResults from './QuickSearchResults.js'
import { searchPathFromQuery } from './Router.js'
import { codingToSnomedCode } from './fhir/medication.js'

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
    this.state = { results: this.updateResults(props), quickSearchOpen: false }
    this.handleQueryUpdate = this.handleQueryUpdate.bind(this)
    this.handleFocus = this.handleFocus.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleToggleAdvanced = this.handleToggleAdvanced.bind(this)
    this.handleSelectResult = this.handleSelectResult.bind(this)
  }

  updateResults(props) {
    let { results } = props
    results = this.addLinksToResults(results)
    return this.addMoreLinkToResults(results, props)
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

  addMoreLinkToResults(results, { bundle, currentQuery, routedQuery }) {
    const query = currentQuery || routedQuery
    if (!results || !bundle || !bundle.total) return results
    if (bundle.total > results.length) {
      return results.concat([
        {
          type: 'more',
          link: searchPathFromQuery(query),
          total: bundle.total,
        },
      ])
    } else return results
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
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const { selectedResult } = this.state
      let newSelection
      if (selectedResult === undefined) newSelection = 0
      else {
        newSelection =
          event.key === 'ArrowDown'
            ? Math.min(selectedResult + 1, 19)
            : Math.max(selectedResult - 1, 0)
      }
      this.setState(() => ({ selectedResult: newSelection }))
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
    const updateProps = [ 'routedQuery', 'currentQuery', 'results' ]
    const { quickSearchShouldClose, onQuickSearchClosed } = nextProps
    if (nextProps.quickSearchShouldClose) {
      this.setState({ quickSearchOpen: false })
    } else if (updateProps.some(p => !isEqual(this.props[p], nextProps[p]))) {
      this.setState({
        results: this.updateResults(nextProps),
        quickSearchOpen: true,
      })
    }
    if (quickSearchShouldClose && onQuickSearchClosed) onQuickSearchClosed()
  }

  render() {
    const { routedQuery, currentQuery, focusUponMount, loading } = this.props
    const { results, quickSearchOpen } = this.state
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
            onSelectResult={this.handleSelectResult}
          />
        ) : null}
      </div>
    )
  }
}

export default BasicSearch
