import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import { searchPathFromQuery } from './Router.js'
import { codingToSnomedCode, codingToSnomedDisplay } from './fhir/medication.js'
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
          })
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
        ]),
      })
    ),
    totalResults: PropTypes.number,
    renderLinks: PropTypes.bool,
    onSelectResult: PropTypes.func,
  }
  static defaultProps = {
    renderLinks: true,
  }

  handleSelectResult(result) {
    const { onSelectResult } = this.props
    if (onSelectResult) onSelectResult(result)
  }

  render() {
    return (
      <div className='quick-search-results'>
        {this.renderResultsOrNothing()}
      </div>
    )
  }

  renderResultsOrNothing() {
    const { query, results } = this.props
    if (query && results && results.length === 0) {
      return <div className='no-results'>No results matching "{query}".</div>
    } else if (results && results.length === 0) {
      return <div className='no-results'>No results.</div>
    } else if (results && results.length > 0) {
      return (
        <ol>
          {this.renderResults()}
          {this.renderMoreLink()}
        </ol>
      )
    } else {
      return null
    }
  }

  renderResults() {
    const { results, renderLinks } = this.props
    if (!results) return
    return results.map((result, i) => (
      <li key={i} className='search-result'>
        <span className={`type type-${result.type}`.toLowerCase()}>
          {result.type}
        </span>
        <span className='display'>
          {renderLinks
            ? this.renderLinkToResult(result)
            : this.renderUnlinkedResult(result)}
        </span>
      </li>
    ))
  }

  renderMoreLink() {
    const { results, totalResults, query } = this.props
    if (!results || !totalResults) return
    if (totalResults > results.length) {
      return (
        <li key='more' className='more-results'>
          <Link to={searchPathFromQuery(query)}>
            view all {formatNumber(totalResults)} matches &rarr;
          </Link>
        </li>
      )
    }
  }

  renderLinkToResult(result) {
    const to =
      result.type === 'substance'
        ? `/Substance/${codingToSnomedCode(result.coding)}`
        : `/Medication/${codingToSnomedCode(result.coding)}`
    return (
      <Link to={to} onClick={() => this.handleSelectResult(result)}>
        {codingToSnomedDisplay(result.coding)}
      </Link>
    )
  }

  renderUnlinkedResult(result) {
    return (
      <div onClick={() => this.handleSelectResult(result)}>
        {codingToSnomedDisplay(result.coding)}
      </div>
    )
  }
}

export default QuickSearchResults
