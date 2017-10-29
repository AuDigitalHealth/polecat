import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import Concept from './Concept.js'
import Icon from './Icon.js'

import './css/ConceptGroup.css'

class ConceptGroup extends Component {
  static propTypes = {
    concepts: PropTypes.arrayOf(
      PropTypes.shape({
        coding: Concept.propTypes.coding,
        type: Concept.propTypes.type,
      })
    ),
    // Total number of concepts that is available to view if the full result set
    // is requested by the user.
    total: PropTypes.number,
    top: PropTypes.number,
    left: PropTypes.number,
  }
  static defaultProps = {
    top: 0,
    left: 0,
    width: 100,
    height: 47,
  }

  render() {
    const { concepts, total, top, left } = this.props
    const concept = concepts[0]
    const type = concept.type
    return (
      <div
        className='concept-group'
        style={{
          top: top + 'px',
          left: left + 'px',
        }}
      >
        <div className='concept concept-stacked-1'>
          {type ? (
            <div className={`type type-${type}`.toLowerCase()}>{type}</div>
          ) : null}
          <Link to='/'>
            <Icon type='list' hoverType='listActive' width={20} />
          </Link>
        </div>
        <div className='concept concept-stacked-2' />
        <div className='concept concept-stacked-3' />
        <div className='concept-group-total'>{total}</div>
      </div>
    )
  }
}

export default ConceptGroup
