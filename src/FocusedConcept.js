import React, { Component } from 'react'

import './Concept.css'

class FocusedConcept extends Component {
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
        <div className='sctid'>
          {sctid}
        </div>
        <div className='display'>
          {display}
        </div>
        {type
          ? <div className={`type type-${type}`.toLowerCase()}>
            {type}
          </div>
          : null}
      </div>
    )
  }
}

export default FocusedConcept
