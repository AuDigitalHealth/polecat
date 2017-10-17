import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import { codingToSnomedCode, codingToSnomedDisplay } from './fhir/medication.js'

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
    top: PropTypes.number,
    left: PropTypes.number,
    width: PropTypes.number,
    height: PropTypes.number,
  }
  static defaultProps = {
    top: 0,
    left: 0,
    width: 150,
    height: 75,
  }

  render() {
    const { coding, type, top, left, width, height } = this.props
    const sctid = codingToSnomedCode(coding)
    const display = codingToSnomedDisplay(coding)
    return (
      <div
        className='concept'
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
        {type ? (
          <div className={`type type-${type}`.toLowerCase()}>{type}</div>
        ) : null}
      </div>
    )
  }
}

export default Concept
