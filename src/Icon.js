import React, { Component } from 'react'
import PropTypes from 'prop-types'

import list from './img/list.svg'
import listActive from './img/list-active.svg'
import graph from './img/graph.svg'
import graphActive from './img/graph-active.svg'
import clipboard from './img/clipboard.svg'
import clipboardActive from './img/clipboard-active.svg'
import tick from './img/tick.svg'

const icons = {
  list,
  listActive,
  graph,
  graphActive,
  clipboard,
  clipboardActive,
  tick,
}

class Icon extends Component {
  static propTypes = {
    type: PropTypes.oneOf(Object.keys(icons)),
    hoverType: PropTypes.oneOf(Object.keys(icons)),
    width: PropTypes.number,
    height: PropTypes.number,
    alt: PropTypes.string,
    title: PropTypes.string,
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

  handleMouseLeave() {
    this.setState(() => ({ mouse: 'none' }))
  }

  handleClick(event) {
    if (this.props.onClick) {
      this.props.onClick(event)
    }
  }

  render() {
    const { type, hoverType, width, height, alt, title } = this.props
    const { mouse } = this.state
    return (
      <img
        className='icon'
        src={icons[hoverType && mouse === 'hover' ? hoverType : type]}
        width={width}
        height={height}
        alt={alt}
        title={title}
        onMouseOver={this.handleMouseOver}
        onMouseLeave={this.handleMouseLeave}
        onClick={this.handleClick}
      />
    )
  }
}

export default Icon
