import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import { codingToSnomedCode, codingToSnomedDisplay } from './fhir/medication.js'

import './css/FullSearchResults.css'

class FullSearchResults extends Component {
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
    onSelectResult: PropTypes.func,
  }
  static defaultProps = { results: [] }

  handleSelectResult(result) {
    const { onSelectResult } = this.props
    if (onSelectResult) onSelectResult(result)
  }

  renderResults(results) {
    if (!results) return
    return results.map((result, i) => (
      <li key={i} className='search-result'>
        <span className='sctid'>{codingToSnomedCode(result.coding)}</span>
        <span className='display'>{this.renderLinkToResult(result)}</span>
        <span className={`type type-${result.type}`.toLowerCase()}>
          {result.type}
        </span>
      </li>
    ))
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

  render() {
    const { query, results } = this.props
    return (
      <div className='full-search-results'>
        {results && results.length === 0 ? (
          <div className='no-results'>No results matching "{query}".</div>
        ) : results ? (
          <ol>{this.renderResults(results)}</ol>
        ) : null}
      </div>
    )
  }
}

export default FullSearchResults
