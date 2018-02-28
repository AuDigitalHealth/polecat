import React, { Component } from 'react'
import PropTypes from 'prop-types'

import Icon from './Icon.js'

import './css/Toggle.css'

class Toggle extends Component {
  static propTypes = {
    value: PropTypes.bool,
    onClick: PropTypes.func,
  }
  static defaultProps = { value: true }

  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }

  handleClick(event) {
    const { onClick } = this.props
    if (onClick) onClick(event)
  }

  render() {
    const { value } = this.props
    return (
      <div
        className={value ? 'toggle active' : 'toggle'}
        onClick={this.handleClick}
      >
        <Icon
          className="toggle-tick"
          type="tick-white"
          width={15}
          height={15}
        />
        <Icon
          className="toggle-cross"
          type="cross-white"
          width={13}
          height={13}
        />
        <div className="toggle-slider" />
      </div>
    )
  }
}

export default Toggle
