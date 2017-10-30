import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

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
      })
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
    const { coding, type, focused, top, left, width, height } = this.props
    const sctid = codingToSnomedCode(coding)
    const display = codingToSnomedDisplay(coding)
    const artgId = codingToArtgId(coding)
    return (
      <div
        className={focused ? 'concept concept-focused' : 'concept'}
        style={{
          position: 'absolute',
          top: top + 'px',
          left: left + 'px',
          width: width + 'px',
          height: height + 'px',
        }}
      >
        <div className='sctid'>
          {type !== 'TP' ? (
            <Link to={`/Medication/${sctid}`}>{sctid}</Link>
          ) : (
            sctid
          )}
        </div>
        <div className='display'>{display}</div>
        {artgId ? (
          <div className='artgid'>
            ARTG ID{' '}
            <a
              href={urlForArtgId(artgId)}
              title={`ARTG ID ${artgId} on the TGA website`}
              target='_blank'
            >
              {artgId}
            </a>
          </div>
        ) : null}
        {type ? (
          <div className={`type type-${type}`.toLowerCase()}>{type}</div>
        ) : null}
      </div>
    )
  }
}

export default Concept
