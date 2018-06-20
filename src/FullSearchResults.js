import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { InfiniteLoader } from 'react-virtualized/dist/commonjs/InfiniteLoader'
import { List } from 'react-virtualized/dist/commonjs/List'
import { AutoSizer } from 'react-virtualized/dist/commonjs/AutoSizer'
import { Scrollbars } from 'react-custom-scrollbars'
import { Link } from 'react-router-dom'

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
    allResultsAreOfType: PropTypes.oneOf(['CTPP', 'TPP', 'TPUU']),
    shownGMs: PropTypes.array,
    onRequireMoreResults: PropTypes.func,
  }
  static defaultProps = { shownGMs: [] }

  constructor(props) {
    super(props)
    this.renderResult = this.renderResult.bind(this)
    this.loadMoreRows = this.loadMoreRows.bind(this)
    this.handleListScroll = this.handleListScroll.bind(this)
    this.handleScrollbarScroll = this.handleScrollbarScroll.bind(this)
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

  handleListScroll({ scrollTop }) {
    if (scrollTop === 0) this.setState(() => ({ scrollTop: undefined }))
  }

  // Integration between react-custom-scrollbars and react-virtualized, as per
  // https://github.com/bvaughn/react-virtualized/issues/692#issuecomment-391227898.
  handleScrollbarScroll(event) {
    this.list.Grid._onScroll(event)
  }

  componentDidMount() {
    if (this.list) this.list.Grid._scrollingContainer = this.scroll.view
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
    const { query, results, totalResults } = this.props
    if (query && results && results.length === 0) {
      return (
        <div className="no-results">
          No results matching &quot;{query}&quot;.
        </div>
      )
    } else if (results && results.length === 0) {
      return <div className="no-results">No results.</div>
    } else if (results && results.length > 0 && totalResults) {
      return <ol>{this.renderResults()}</ol>
    } else {
      return null
    }
  }

  renderResults() {
    const { results, totalResults, shownGMs } = this.props,
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
              <Scrollbars
                ref={node => (this.scroll = node)}
                onScroll={this.handleScrollbarScroll}
                style={{ height, width }}
              >
                <List
                  ref={node => {
                    this.list = node
                    registerChild(node)
                  }}
                  rowCount={totalResults}
                  rowHeight={35}
                  rowRenderer={renderResult}
                  width={width}
                  height={height}
                  scrollTop={scrollTop}
                  overscanRowCount={50}
                  style={{ overflowX: 'visible', overflowY: 'visible' }}
                  results={results}
                  shownGMs={shownGMs}
                  onRowsRendered={onRowsRendered}
                  onScroll={this.handleListScroll}
                  onScrollbarPresenceChange={this.handleScrollbarPresenceChange}
                />
              </Scrollbars>
            )}
          </InfiniteLoader>
        )}
      </AutoSizer>
    )
  }

  renderResult({ key, index, style }) {
    const { results, allResultsAreOfType } = this.props,
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
      <li key={key} className="search-result" style={style}>
        <Link to={result.link} className="subject-concept">
          <span className="sctid">{codingToSnomedCode(result.coding)}</span>
          <span
            className="display"
            title={codingToSnomedDisplay(result.coding)}
          >
            {codingToSnomedDisplay(result.coding)}
          </span>
          {allResultsAreOfType ? null : (
            <ConceptType type={result.type} status={result.status} />
          )}
        </Link>
        {this.renderGMsForResult(result)}
      </li>
    )
  }

  renderGMsForResult(result) {
    const { shownGMs } = this.props
    return shownGMs.map(gm => {
      const foundGM = result.generalizedMedicines.find(m => m.type === gm)
      return foundGM ? (
        <Link
          to={result.link}
          key={gm}
          className="generalized-medicine"
          title={codingToSnomedDisplay(foundGM.coding)}
        >
          {codingToSnomedDisplay(foundGM.coding)}
        </Link>
      ) : null
    })
  }
}

export default FullSearchResults
