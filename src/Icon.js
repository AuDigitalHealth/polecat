import React, { Component } from 'react'
import PropTypes from 'prop-types'

import icons from './img/icons.svg'

import './css/Icon.css'

class Icon extends Component {
  static propTypes = {
    type: PropTypes.string.isRequired,
    hoverType: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    alt: PropTypes.string,
    title: PropTypes.string,
    className: PropTypes.string,
    onClick: PropTypes.func,
  }

  constructor(props) {
    super(props)
    this.state = {}
    this.handleMouseOver = this.handleMouseOver.bind(this)
    this.handleMouseLeave = this.handleMouseLeave.bind(this)
    this.handleClick = this.handleClick.bind(this)
  }

  handleMouseOver() {
    this.setState(() => ({ mouse: 'hover' }))
  }

  // This is necessary to prevent flickering of the active state as you move
  // over the icon in Edge.
  // See: https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/7787318/
  handleMouseLeave(event) {
    if (event.target.className === 'icon')
      this.setState(() => ({ mouse: 'none' }))
  }

  handleClick(event) {
    if (this.props.onClick) {
      this.props.onClick(event)
    }
  }

  render() {
    const { type, hoverType, width, height, alt, title, className } = this.props
    const { mouse } = this.state
    return (
      <div
        className={className ? `icon ${className}` : 'icon'}
        style={{ width, height }}
        onMouseOver={this.handleMouseOver}
        onMouseLeave={this.handleMouseLeave}
        onClick={this.handleClick}
      >
        <svg width={width} height={height} viewBox="0 0 100 100">
          <title>{title}</title>
          <desc>{alt}</desc>
          <use
            xlinkHref={`${icons}#${
              hoverType && mouse === 'hover' ? hoverType : type
            }`}
          />
        </svg>
      </div>
    )
  }
}

export default Icon
