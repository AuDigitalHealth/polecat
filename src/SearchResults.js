import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

class SearchResults extends Component {
  static propTypes = {
    query: PropTypes.string,
    results: PropTypes.arrayOf(
      PropTypes.shape({
        code: PropTypes.string,
        display: PropTypes.string,
        type: PropTypes.oneOf([
          'CTPP',
          'TPP',
          'TPUU',
          'TP',
          'MPP',
          'MPUU',
          'MP',
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
    return results.map((result, i) =>
      <li key={i} className='search-result'>
        <span className={`type type-${result.type}`.toLowerCase()}>
          {result.type}
        </span>
        <span className='display'>
          <Link
            to={`/Medication/${result.code}`}
            onClick={() => this.handleSelectResult(result)}
          >
            {result.display}
          </Link>
        </span>
      </li>
    )
  }

  render() {
    const { query, results } = this.props
    console.log('SearchResults render', { query, results })
    return (
      <div className='search-results'>
        {results && results.length === 0
          ? <div className='no-results'>
              No results matching "{query}".
          </div>
          : results
            ? <ol>
              {this.renderResults(results)}
            </ol>
            : null}
      </div>
    )
  }
}

export default SearchResults
