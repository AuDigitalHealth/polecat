import React, { Component } from 'react'
import PropTypes from 'prop-types'

import Icon from './Icon.js'
import DownloadResults from './DownloadResults.js'
import { formatNumber } from './util.js'

import './css/SearchSummary.css'

class SearchSummary extends Component {
  static propTypes = {
    totalResults: PropTypes.number,
    allResults: PropTypes.array,
    nextLink: PropTypes.string,
    previousLink: PropTypes.string,
    loading: PropTypes.bool,
    onNextClick: PropTypes.func,
    onPreviousClick: PropTypes.func,
    onDownloadClick: PropTypes.func,
  }

  constructor(props) {
    super(props)
    this.handleNextClick = this.handleNextClick.bind(this)
    this.handlePreviousClick = this.handlePreviousClick.bind(this)
    this.handleDownloadClick = this.handleDownloadClick.bind(this)
  }

  handleNextClick() {
    const { onNextClick } = this.props
    if (onNextClick) onNextClick()
  }

  handlePreviousClick() {
    const { onPreviousClick } = this.props
    if (onPreviousClick) onPreviousClick()
  }

  handleDownloadClick() {
    const { onDownloadClick } = this.props
    if (onDownloadClick) onDownloadClick()
  }

  render() {
    const {
      totalResults,
      allResults,
      nextLink,
      previousLink,
      loading,
    } = this.props
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
        <div>
          <Icon
            className={
              previousLink
                ? 'pagination-previous'
                : 'pagination-previous disabled'
            }
            type="previous"
            hoverType={previousLink ? 'previous-active' : null}
            width={21}
            height={21}
            alt="Previous page of results"
            title="Previous page"
            onClick={previousLink ? this.handlePreviousClick : null}
          />
          <Icon
            className={
              nextLink ? 'pagination-next' : 'pagination-next disabled'
            }
            type="next"
            hoverType={nextLink ? 'next-active' : null}
            width={21}
            height={21}
            alt="Next page of results"
            title="Next page"
            onClick={nextLink ? this.handleNextClick : null}
          />
        </div>
      </div>
    )
  }
}

export default SearchSummary
