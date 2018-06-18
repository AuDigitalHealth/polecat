import React, { Component } from 'react'
import PropTypes from 'prop-types'

import DownloadResults from './DownloadResults.js'
import ConceptType from './ConceptType.js'
import { formatNumber } from './util.js'

import './css/SearchSummary.css'

class SearchSummary extends Component {
  static propTypes = {
    totalResults: PropTypes.number,
    allResults: PropTypes.array,
    loading: PropTypes.bool,
    allResultsAreOfType: PropTypes.oneOf(['CTPP', 'TPP', 'TPUU']),
    shownGMs: PropTypes.array,
    hiddenGMs: PropTypes.array,
    onDownloadClick: PropTypes.func,
    onShowGM: PropTypes.func,
    onHideGM: PropTypes.func,
  }
  static defaultProps = {
    shownGMs: [],
    hiddenGMs: [],
  }

  constructor(props) {
    super(props)
    this.handleDownloadClick = this.handleDownloadClick.bind(this)
  }

  handleDownloadClick() {
    const { onDownloadClick } = this.props
    if (onDownloadClick) onDownloadClick()
  }

  render() {
    const {
      allResults,
      loading,
      hiddenGMs,
      shownGMs,
      onShowGM,
      onHideGM,
    } = this.props
    return (
      <div className="search-summary with-generalized-medicines">
        <div className="summary">
          <div className="pagination-download">
            {this.renderPaginationTotal()}
          </div>
          <DownloadResults
            results={allResults}
            shownGMs={shownGMs}
            loading={loading}
            onClick={this.handleDownloadClick}
          />
          {hiddenGMs.map(gm => (
            <div key={gm} className="hidden-generalized-medicine">
              <div
                title={`Display the corresponding ${gm} for each search result`}
                onClick={() => onShowGM(gm)}
              >
                + <ConceptType type={gm} title={null} />
              </div>
            </div>
          ))}
        </div>
        {shownGMs.map(gm => (
          <div key={gm} className="shown-generalized-medicine">
            <ConceptType type={gm} title={null} />
            <span
              className="close"
              title={`Hide ${gm}s`}
              onClick={() => onHideGM(gm)}
            >
              &times;
            </span>
          </div>
        ))}
      </div>
    )
  }

  renderPaginationTotal() {
    const { totalResults, allResultsAreOfType } = this.props
    return allResultsAreOfType ? (
      <div className="pagination-total">
        {totalResults ? formatNumber(totalResults) : 0} &times;{' '}
        <ConceptType type={allResultsAreOfType} />
      </div>
    ) : (
      <div className="pagination-total">
        {totalResults ? formatNumber(totalResults) : 0} matches
      </div>
    )
  }
}

export default SearchSummary
