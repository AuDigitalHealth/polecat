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
    shownGMs: PropTypes.array,
    loading: PropTypes.bool,
    onClick: PropTypes.func,
  }
  static defaultProps = {
    results: [],
    shownGMs: [],
  }

  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }

  downloadResults(results, shownGMs) {
    const header = ['SCTID', 'Preferred term', 'AMT concept type']
    // Add columns for the SCTID and preferred term of each generalized medicine.
    for (const shownGM of shownGMs) {
      header.push(`${shownGM} SCTID`)
      header.push(`${shownGM} preferred term`)
    }
    header.push('View in browser')
    let tsv = `${header.join('\t')}\n`
    for (const result of results) {
      const code = codingToSnomedCode(result.coding),
        display = codingToSnomedDisplay(result.coding),
        type = result.type,
        browserLink = `${this.getBrowserUrl()}/Medication/${code}`,
        row = [code, display, type]
      // Add SCTID and preferred term for each generalized medicine.
      for (const shownGM of shownGMs) {
        const foundGM = result.generalizedMedicines.find(
          m => m.type === shownGM,
        )
        if (foundGM) {
          row.push(codingToSnomedCode(foundGM.coding))
          row.push(codingToSnomedDisplay(foundGM.coding))
        }
      }
      row.push(browserLink)
      tsv += `${row.join('\t')}\n`
    }
    const blob = new Blob([tsv], { type: 'text/tab-separated-values' })
    FileSaver.saveAs(blob, 'results.tsv')
  }

  getBrowserUrl() {
    const { protocol, host } = window.location
    return `${protocol}//${host}`
  }

  handleClick(event) {
    const { onClick } = this.props
    if (onClick) onClick(event)
  }

  componentWillReceiveProps(nextProps) {
    const { results, shownGMs } = nextProps
    if (results && results !== this.props.results)
      this.downloadResults(results, shownGMs)
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
