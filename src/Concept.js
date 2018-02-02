import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import CopyToClipboard from './CopyToClipboard.js'
import ConceptType from './ConceptType.js'
import {
  codingToSnomedCode,
  codingToSnomedDisplay,
  codingToArtgId,
  urlForArtgId,
} from './fhir/medication.js'

import './css/Concept.css'

class Concept extends Component {
  static propTypes = {
    coding: PropTypes.arrayOf(
      PropTypes.shape({
        system: PropTypes.string,
        code: PropTypes.string,
        display: PropTypes.string,
      }),
    ).isRequired,
    type: PropTypes.oneOf([
      'CTPP',
      'TPP',
      'TPUU',
      'TP',
      'MPP',
      'MPUU',
      'MP',
      'substance',
    ]).isRequired,
    status: PropTypes.oneOf(['active', 'inactive', 'entered-in-error']),
    focused: PropTypes.bool,
    top: PropTypes.number,
    left: PropTypes.number,
    width: PropTypes.number,
    height: PropTypes.number,
  }
  static defaultProps = {
    focused: false,
    top: 0,
    left: 0,
    width: 150,
    height: 75,
  }

  render() {
    const { coding, type, status, focused } = this.props
    const sctid = codingToSnomedCode(coding)
    const display = codingToSnomedDisplay(coding)
    const artgId = codingToArtgId(coding)
    return (
      <div
        className={focused ? 'concept concept-focused' : 'concept'}
        style={this.renderConceptStyle()}
      >
        <div className="sctid">
          {type !== 'TP' && !focused ? (
            <Link to={`/Medication/${sctid}`}>{sctid}</Link>
          ) : (
            sctid
          )}
          <CopyToClipboard copyText={sctid} title="Copy SCTID to clipboard" />
        </div>
        <div className="display" title={display}>
          {display}
          <CopyToClipboard
            copyText={display}
            title="Copy preferred term to clipboard"
          />
        </div>
        {artgId ? (
          <div className="artgid">
            ARTG ID{' '}
            <a
              href={urlForArtgId(artgId)}
              title={`ARTG ID ${artgId} on the TGA website`}
              target="_blank"
            >
              {artgId}
            </a>
          </div>
        ) : null}
        <ConceptType type={type} status={status} />
      </div>
    )
  }

  renderConceptStyle() {
    const { top, left, width, height, status } = this.props,
      style = {
        position: 'absolute',
        top: top + 'px',
        left: left + 'px',
        width: width + 'px',
        height: height + 'px',
      }
    return !status || status === 'active'
      ? style
      : { ...style, borderStyle: 'dashed' }
  }
}

export default Concept
