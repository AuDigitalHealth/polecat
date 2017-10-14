import React, { Component } from 'react'

import Concept from './Concept.js'

import './css/Concept.css'

class FocusedConcept extends Component {
  static propTypes = Concept.propTypes
  static defaultProps = Concept.defaultProps

  render() {
    const { sctid, display, type, top, left, width, height } = this.props
    return (
      <div
        className='concept concept-focused'
        style={{
          position: 'absolute',
          top: top + 'px',
          left: left + 'px',
          width: width + 'px',
          height: height + 'px',
        }}
      >
        <div className='sctid'>{sctid}</div>
        <div className='display'>{display}</div>
        {type ? (
          <div className={`type type-${type}`.toLowerCase()}>{type}</div>
        ) : null}
      </div>
    )
  }
}

export default FocusedConcept
