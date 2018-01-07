import React, { Component } from 'react'
import PropTypes from 'prop-types'

import Icon from './Icon.js'
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
      <Icon
        type={active ? 'expand-up' : 'expand-down'}
        className={
          active ? `expand ${className} active` : `expand ${className}`
        }
        width={14}
        onClick={onToggle}
      />
    )
  }
}

export default Expand
