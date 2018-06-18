import React, { Component } from 'react'
import PropTypes from 'prop-types'

import DownloadResults from './DownloadResults.js'
import { formatNumber } from './util.js'

import './css/SearchSummary.css'

class SearchSummary extends Component {
  static propTypes = {
    totalResults: PropTypes.number,
    allResults: PropTypes.array,
    loading: PropTypes.bool,
    onDownloadClick: PropTypes.func,
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
    const { totalResults, allResults, loading } = this.props
    return (
      <div className="search-summary">
        <div>
          <div className="pagination-total">
            {totalResults ? formatNumber(totalResults) : 0} matches
          </div>
          <DownloadResults
            results={allResults}
            loading={loading}
            onClick={this.handleDownloadClick}
          />
        </div>
      </div>
    )
  }
}

export default SearchSummary
