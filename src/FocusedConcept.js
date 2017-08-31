import React, { Component } from 'react'

import './Concept.css'

class FocusedConcept extends Component {
  render() {
    const { sctid, display, top, left, width, height } = this.props
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
        <div className='display'>
          {display}
        </div>
        <div className='sctid'>
          {sctid}
        </div>
      </div>
    )
  }
}

export default FocusedConcept
