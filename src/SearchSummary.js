import React, { Component } from 'react'
import PropTypes from 'prop-types'

import Icon from './Icon.js'
import { formatNumber } from './util.js'
import './css/SearchSummary.css'

class SearchSummary extends Component {
  static propTypes = {
    totalResults: PropTypes.number,
    nextLink: PropTypes.string,
    previousLink: PropTypes.string,
    onNextClick: PropTypes.func,
    onPreviousClick: PropTypes.func,
  }

  constructor(props) {
    super(props)
    this.handleNextClick = this.handleNextClick.bind(this)
    this.handlePreviousClick = this.handlePreviousClick.bind(this)
  }

  handleNextClick() {
    const { onNextClick } = this.props
    if (onNextClick) {
      onNextClick()
    }
  }

  handlePreviousClick() {
    const { onPreviousClick } = this.props
    if (onPreviousClick) {
      onPreviousClick()
    }
  }

  render() {
    const { totalResults, nextLink, previousLink } = this.props
    return (
      <div className="search-summary">
        <div className="pagination-total">
          {totalResults ? formatNumber(totalResults) : 0} matches
        </div>
        {previousLink ? (
          <Icon
            className="pagination-previous"
            type="previous"
            hoverType="previous-active"
            width={21}
            height={21}
            alt="Previous page of results"
            title="Previous page"
            onClick={this.handlePreviousClick}
          />
        ) : null}
        {nextLink ? (
          <Icon
            className="pagination-next"
            type="next"
            hoverType="next-active"
            width={21}
            height={21}
            alt="Next page of results"
            title="Next page"
            onClick={this.handleNextClick}
          />
        ) : null}
      </div>
    )
  }
}

export default SearchSummary
