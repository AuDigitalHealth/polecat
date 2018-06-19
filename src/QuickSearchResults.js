import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import ConceptType from './ConceptType.js'
import { codingToSnomedDisplay } from './fhir/medication.js'
import { formatNumber } from './util.js'

import './css/QuickSearchResults.css'

class QuickSearchResults extends Component {
  static propTypes = {
    // TODO: Work out whether this prop is actually used or not. What is this in
    // relation to `results.query`?
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
      <Link
        to={result.link}
        key={i}
        className={result.selected ? 'search-result selected' : 'search-result'}
      >
        <div className="target">
          <ConceptType type={result.type} status={result.status} />
          <span className="display">
            {codingToSnomedDisplay(result.coding)}
          </span>
        </div>
      </Link>
    )
  }

  renderTextLink(result, i) {
    return (
      <Link
        to={result.link}
        key={i}
        className={result.selected ? 'text selected' : 'text'}
      >
        <div className="target">
          All concepts containing the text &quot;{result.query}&quot;
        </div>
      </Link>
    )
  }

  renderMoreLink(result, i) {
    return (
      <Link
        to={result.link}
        key={i}
        className={result.selected ? 'more-results selected' : 'more-results'}
      >
        <div className="target">
          view all {formatNumber(result.total)} matches &rarr;
        </div>
      </Link>
    )
  }
}

export default QuickSearchResults
