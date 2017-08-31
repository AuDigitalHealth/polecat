import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import './Concept.css'

class Concept extends Component {
  render() {
    const { sctid, display, type, top, left, width, height } = this.props
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
        <div className='display'>
          {display}
        </div>
        <div className='sctid'>
          <Link to={`/Medication/${sctid}`}>
            {sctid}
          </Link>
        </div>
        <div className={`type type-${type}`.toLowerCase()}>
          {type}
        </div>
      </div>
    )
  }
}

export default Concept
