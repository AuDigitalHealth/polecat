import React, { Component } from 'react'
import PropTypes from 'prop-types'

import './css/Expand.css'

class Expand extends Component {
  static propTypes = {
    active: PropTypes.bool,
    className: PropTypes.string,
    onToggle: PropTypes.func,
  }
  static defaultProps = {
    active: false,
    className: 'expand',
  }

  render() {
    const { className, active, onToggle } = this.props
    return (
      <div
        className={
          active ? `expand ${className} active` : `expand ${className}`
        }
        onClick={onToggle}
      >
        {'\u25BE'}
      </div>
    )
  }
}

export default Expand
