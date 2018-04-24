/* eslint-disable */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import currencyFormatter from 'currency-formatter'
import uniqBy from 'lodash.uniqby'

import CopyToClipboard from './CopyToClipboard.js'
import Icon from './Icon.js'
import Expand from './Expand.js'

import './css/PBSDetails.css'

class PBSDetails extends Component {
  static propTypes = {
    subsidy: PropTypes.arrayOf(
      PropTypes.shape({
        subsidyCode: PropTypes.shape({
          code: PropTypes.string,
          system: PropTypes.string,
        }),
        programCode: PropTypes.shape({
          code: PropTypes.string,
          display: PropTypes.string,
          system: PropTypes.string,
        }),
        restriction: PropTypes.shape({
          code: PropTypes.string,
          display: PropTypes.string,
          system: PropTypes.string,
        }),
        commonwealthExManufacturerPrice: PropTypes.number,
        manufacturerExManufacturerPrice: PropTypes.number,
        atcCode: PropTypes.shape({
          code: PropTypes.string,
          display: PropTypes.string,
          system: PropTypes.string,
        }),
      }),
    ),
  }

  constructor(props) {
    super(props)
    this.state = { expanded: false }
    this.toggleExpanded = this.toggleExpanded.bind(this)
  }

  pbsCodeLink(code) {
    return `https://www.pbs.gov.au/medicine/item/${code}`
  }

  pbsSearchLink(code) {
    return `/?q=pbs:${code}`
  }

  pbsProgramLink(programCode) {
    return `https://www.pbs.gov.au/pbs/search?base=drugtype:${programCode.toLowerCase()},&search-type=medicines`
  }

  atcCodeLink(code) {
    return `https://www.whocc.no/atc_ddd_index/?code=${code}`
  }

  // This is necessary only to work around https://bitbucket.org/dion_mcmurtrie/medserve/issues/15.
  dedupeSubsidy(subsidy) {
    return uniqBy(subsidy, s => s.subsidyCode.code)
  }

  toggleExpanded() {
    const { expanded } = this.state
    this.setState(() => ({ expanded: !expanded }))
  }

  render() {
    const { expanded } = this.state,
      subsidy = this.dedupeSubsidy(this.props.subsidy)
    return (
      <div className={expanded ? 'pbs-details' : 'pbs-details closed'}>
        <div className="pbs-details-header" onClick={this.toggleExpanded}>
          PBS items ({subsidy.length})<Expand active={expanded} />
        </div>
        {expanded ? subsidy.map((s, i) => this.renderSubsidy(s, i)) : null}
      </div>
    )
  }

  renderSubsidy(subsidy, key) {
    const {
      subsidyCode,
      programCode,
      restriction,
      commonwealthExManufacturerPrice,
      manufacturerExManufacturerPrice,
      atcCode,
    } = subsidy
    return (
      <div className="pbs-details-content" key={key}>
        {subsidyCode ? (
          <div className="row">
            <div className="field-name">PBS code</div>
            <div className="field-value">
              <a href={this.pbsCodeLink(subsidyCode.code)} target="_blank">
                {subsidyCode.code}
                <Icon type="external-link" width={11} height={11} />
              </a>
              <Link
                className="pbs-search"
                to={this.pbsSearchLink(subsidyCode.code)}
              >
                <Icon
                  type="list"
                  hoverType="list-active"
                  width={15}
                  height={15}
                  title="Search for all medications available under this code"
                  alt="Search for all medications available under this code"
                />
              </Link>
              <CopyToClipboard
                copyText={subsidyCode.code}
                title="Copy PBS code to clipboard"
              />
            </div>
          </div>
        ) : null}
        {programCode ? (
          <div className="row">
            <div className="field-name">Program</div>
            <div className="field-value">
              <a href={this.pbsProgramLink(programCode.code)} target="_blank">
                {programCode.display}
                <Icon type="external-link" width={11} height={11} />
              </a>
              <CopyToClipboard
                copyText={programCode.display}
                title="Copy program to clipboard"
              />
            </div>
          </div>
        ) : null}
        {restriction ? (
          <div className="row">
            <div className="field-name">Restriction</div>
            <div className="field-value">
              {restriction.display}
              <CopyToClipboard
                copyText={restriction.display}
                title="Copy restriction to clipboard"
              />
            </div>
          </div>
        ) : null}
        {commonwealthExManufacturerPrice ? (
          <div className="row">
            <div
              className="field-name"
              title="Commonwealth Ex Manufacturer Price"
            >
              Commonwealth Ex Manufacturer Price
            </div>
            <div className="field-value">
              {currencyFormatter.format(commonwealthExManufacturerPrice, {
                code: 'AUD',
              })}
              <CopyToClipboard
                copyText={commonwealthExManufacturerPrice.toFixed(2)}
                title="Copy Commonwealth Ex Manufacturer Price to clipboard"
              />
            </div>
          </div>
        ) : null}
        {manufacturerExManufacturerPrice ? (
          <div className="row">
            <div
              className="field-name"
              title="Manufacturer Ex Manufacturer Price"
            >
              Manufacturer Ex Manufacturer Price
            </div>
            <div className="field-value">
              {currencyFormatter.format(manufacturerExManufacturerPrice, {
                code: 'AUD',
              })}
              <CopyToClipboard
                copyText={manufacturerExManufacturerPrice.toFixed(2)}
                title="Copy Manufacturer Ex Manufacturer Price to clipboard"
              />
            </div>
          </div>
        ) : null}
        {atcCode ? (
          <div className="row">
            <div className="field-name">ATC code</div>
            <div className="field-value">
              <a href={this.atcCodeLink(atcCode.code)} target="_blank">
                {atcCode.code}
                <Icon type="external-link" width={11} height={11} />
              </a>
              <CopyToClipboard
                copyText={atcCode.code}
                title="Copy ATC code to clipboard"
              />
            </div>
          </div>
        ) : null}
      </div>
    )
  }
}

export default PBSDetails
