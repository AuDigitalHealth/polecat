import React, { Component } from 'react'
import PropTypes from 'prop-types'
import FileSaver from 'file-saver'

import Icon from './Icon.js'
import { codingToSnomedCode, codingToSnomedDisplay } from './fhir/medication'

import './css/DownloadResults.css'

class DownloadResults extends Component {
  static propTypes = {
    results: PropTypes.arrayOf(
      PropTypes.shape({
        coding: PropTypes.arrayOf(
          PropTypes.shape({
            system: PropTypes.string,
            code: PropTypes.string,
            display: PropTypes.string,
          }),
        ),
        type: PropTypes.string.isRequired,
      }),
    ),
    loading: PropTypes.bool,
    onClick: PropTypes.func,
  }

  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }

  downloadResults(results) {
    let tsv = 'SCTID\tPreferred term\tAMT concept type\n'
    for (const result of results) {
      const code = codingToSnomedCode(result.coding),
        display = codingToSnomedDisplay(result.coding),
        type = result.type
      tsv += `${code}\t${display}\t${type}\n`
    }
    const blob = new Blob([tsv], { type: 'text/tab-separated-values' })
    FileSaver.saveAs(blob, 'results.tsv')
  }

  handleClick(event) {
    const { onClick } = this.props
    if (onClick) onClick(event)
  }

  componentWillReceiveProps(nextProps) {
    const { results } = nextProps
    if (results && results !== this.props.results) this.downloadResults(results)
  }

  render() {
    const { loading } = this.props

    return (
      <Icon
        className={loading ? 'download-results disabled' : 'download-results'}
        type="download"
        hoverType="download-active"
        width={21}
        height={21}
        alt="Download search results as TSV"
        title="Download search results as TSV"
        onClick={loading ? null : this.handleClick}
      />
    )
  }
}

export default DownloadResults
