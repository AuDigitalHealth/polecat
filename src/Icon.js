import React, { Component } from 'react'
import PropTypes from 'prop-types'

import icons from './img/icons.svg'

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

  handleMouseLeave(event) {
    this.setState(() => ({ mouse: 'none' }))
    event.preventDefault()
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
      <svg
        className={className ? `icon ${className}` : 'icon'}
        width={width}
        height={height}
        viewBox="0 0 100 100"
      >
        <title>{title}</title>
        <desc>{alt}</desc>
        <g
          onMouseOver={this.handleMouseOver}
          onMouseLeave={this.handleMouseLeave}
          onClick={this.handleClick}
        >
          <use
            xlinkHref={`${icons}#${
              hoverType && mouse === 'hover' ? hoverType : type
            }`}
          />
        </g>
      </svg>
    )
  }
}

export default Icon
