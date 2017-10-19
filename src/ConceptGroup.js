import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import Concept from './Concept.js'
import { codingToSnomedCode, codingToSnomedDisplay } from './fhir/medication.js'

import './css/ConceptGroup.css'

class ConceptGroup extends Component {
  static propTypes = {
    concepts: PropTypes.arrayOf(
      PropTypes.shape({
        coding: Concept.propTypes.coding,
        type: Concept.propTypes.coding,
      })
    ),
    // Total number of concepts that is available to view if the full result set
    // is requested by the user.
    total: PropTypes.number,
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
    const { concepts, total, top, left, width, height } = this.props
    const concept = concepts[0]
    const sctid = codingToSnomedCode(concept.coding)
    const display = codingToSnomedDisplay(concept.coding)
    const type = concept.type
    return (
      <div
        className='concept-group'
        style={{
          position: 'absolute',
          top: top + 'px',
          left: left + 'px',
          width: width + 30 + 'px',
          height: height + 20 + 'px',
        }}
      >
        <div
          className='concept concept-stacked-1'
          style={{
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
        <div
          className='concept concept-stacked-2'
          style={{
            width: width + 'px',
            height: height + 'px',
          }}
        />
        <div
          className='concept concept-stacked-3'
          style={{
            width: width + 'px',
            height: height + 'px',
          }}
        />
        <div className='concept-group-total'>{total}</div>
      </div>
    )
  }
}

export default ConceptGroup
