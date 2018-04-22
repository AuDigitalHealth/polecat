import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { InfiniteLoader } from 'react-virtualized/dist/commonjs/InfiniteLoader'
import { List } from 'react-virtualized/dist/commonjs/List'
import { AutoSizer } from 'react-virtualized/dist/commonjs/AutoSizer'

import ConceptType from './ConceptType.js'
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
        ]),
      }),
    ),
    totalResults: PropTypes.number,
    onSelectResult: PropTypes.func,
    onRequireMoreResults: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props)
    this.renderResult = this.renderResult.bind(this)
    this.loadMoreRows = this.loadMoreRows.bind(this)
    this.handleScroll = this.handleScroll.bind(this)
    this.state = {}
  }

  loadMoreRows({ startIndex, stopIndex }) {
    const { onRequireMoreResults } = this.props
    this.loadMoreRowsStartIndex = startIndex
    this.loadMoreRowsStopIndex = stopIndex
    return new Promise((resolve, reject) => {
      if (onRequireMoreResults) {
        onRequireMoreResults({ stopIndex })
          .then(() => resolve())
          .catch(error => reject(error))
      } else resolve()
    })
  }

  handleSelectResult(result) {
    const { onSelectResult } = this.props
    if (onSelectResult) onSelectResult(result)
  }

  handleScroll({ scrollTop }) {
    if (scrollTop === 0) this.setState(() => ({ scrollTop: undefined }))
  }

  componentWillReceiveProps(nextProps) {
    const { query } = nextProps
    if (query !== this.props.query) this.setState(() => ({ scrollTop: 0 }))
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (
      nextProps !== this.props ||
      nextState !== this.state ||
      nextProps.results.length !== this.props.results.length
    ) {
      // Make another request to load more rows if we find ourselves way down
      // the page by the time the data comes back. See https://github.com/bvaughn/react-virtualized/blob/master/docs/InfiniteLoader.md#memoization-and-rowcount-changes.
      if (this.loadMoreRowsStopIndex > this.props.results.length + 100)
        this.loadMoreRows({
          startIndex: this.loadMoreRowsStartIndex,
          stopIndex: this.loadMoreRowsStopIndex,
        })
      return true
    } else return false
  }

  render() {
    return (
      <div className="full-search-results">{this.renderResultsOrNothing()}</div>
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
    const { results, totalResults } = this.props,
      renderResult = this.renderResult,
      { scrollTop } = this.state
    if (!results || results.length === 0) return
    return (
      <AutoSizer>
        {({ width, height }) => (
          <InfiniteLoader
            isRowLoaded={({ index }) => !!results[index]}
            loadMoreRows={this.loadMoreRows}
            rowCount={totalResults}
          >
            {({ onRowsRendered, registerChild }) => (
              <List
                ref={registerChild}
                rowCount={totalResults}
                rowHeight={35}
                rowRenderer={renderResult}
                width={width}
                height={height}
                scrollTop={scrollTop}
                overscanRowCount={50}
                results={results}
                onRowsRendered={onRowsRendered}
                onScroll={this.handleScroll}
              />
            )}
          </InfiniteLoader>
        )}
      </AutoSizer>
    )
  }

  renderResult({ key, index, style }) {
    const { results } = this.props,
      result = results[index]
    if (!result) {
      const displayLength = 189 + Math.round(Math.random() * 200)
      return (
        <li key={key} className="unloaded-search-result" style={style}>
          <span className="sctid" />
          <span className="display" style={{ width: displayLength }} />
        </li>
      )
    }
    return (
      <li
        key={key}
        className="search-result"
        style={style}
        onClick={() => this.handleSelectResult(result)}
      >
        <span className="sctid">{codingToSnomedCode(result.coding)}</span>
        <span className="display">{codingToSnomedDisplay(result.coding)}</span>
        <ConceptType type={result.type} status={result.status} />
      </li>
    )
  }
}

export default FullSearchResults
