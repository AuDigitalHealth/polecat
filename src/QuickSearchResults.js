import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { codingToSnomedDisplay } from './fhir/medication.js'
import { formatNumber } from './util.js'

import './css/QuickSearchResults.css'

class QuickSearchResults extends Component {
  static propTypes = {
    query: PropTypes.string,
    results: PropTypes.arrayOf(
      PropTypes.shape({
        coding: PropTypes.arrayOf(
          PropTypes.shape({
            system: PropTypes.string,
            code: PropTypes.string,
            display: PropTypes.string,
          }),
        ),
        display: PropTypes.string,
        type: PropTypes.oneOf([
          'CTPP',
          'TPP',
          'TPUU',
          'TP',
          'MPP',
          'MPUU',
          'MP',
          'substance',
          'more',
          'text',
        ]),
        query: PropTypes.string,
        link: PropTypes.string,
        selected: PropTypes.bool,
        total: PropTypes.number,
      }),
    ),
    onSelectResult: PropTypes.func,
  }

  handleSelectResult(result) {
    const { onSelectResult } = this.props
    if (onSelectResult) onSelectResult(result)
  }

  render() {
    return (
      <div className="quick-search-results">
        {this.renderResultsOrNothing()}
      </div>
    )
  }

  renderResultsOrNothing() {
    const { query, results } = this.props
    if (query && results && results.length === 0) {
      return (
        <div className="no-results">
          No results matching &quot;{query}&quot;.
        </div>
      )
    } else if (results && results.length === 0) {
      return <div className="no-results">No results.</div>
    } else if (results && results.length > 0) {
      return <ol>{this.renderResults()}</ol>
    } else {
      return null
    }
  }

  renderResults() {
    const { results } = this.props
    if (!results) return
    return results.map(
      (result, i) =>
        result.type === 'more'
          ? this.renderMoreLink(result, i)
          : result.type === 'text'
            ? this.renderTextLink(result, i)
            : this.renderResult(result, i),
    )
  }

  renderResult(result, i) {
    return (
      <li
        key={i}
        className={result.selected ? 'search-result selected' : 'search-result'}
      >
        <div className="target" onClick={() => this.handleSelectResult(result)}>
          <span className={`type type-${result.type}`.toLowerCase()}>
            {result.type}
          </span>
          <span className="display">
            {codingToSnomedDisplay(result.coding)}
          </span>
        </div>
      </li>
    )
  }

  renderTextLink(result, i) {
    return (
      <li key={i} className={result.selected ? 'text selected' : 'text'}>
        <div className="target" onClick={() => this.handleSelectResult(result)}>
          All concepts containing the text &quot;{result.query}&quot;
        </div>
      </li>
    )
  }

  renderMoreLink(result, i) {
    return (
      <li
        key={i}
        className={result.selected ? 'more-results selected' : 'more-results'}
      >
        <div className="target" onClick={() => this.handleSelectResult(result)}>
          view all {formatNumber(result.total)} matches &rarr;
        </div>
      </li>
    )
  }
}

export default QuickSearchResults
