import React, { Component } from 'react'
import PropTypes from 'prop-types'

import list from './img/list.svg'
import listActive from './img/list-active.svg'
import graph from './img/graph.svg'
import graphActive from './img/graph-active.svg'

const icons = { list, listActive, graph, graphActive }

class Icon extends Component {
  static propTypes = {
    type: PropTypes.oneOf(Object.keys(icons)),
    hoverType: PropTypes.oneOf(Object.keys(icons)),
    width: PropTypes.number,
    height: PropTypes.number,
    alt: PropTypes.string,
  }

  constructor(props) {
    super(props)
    this.state = {}
    this.handleMouseOver = this.handleMouseOver.bind(this)
    this.handleMouseLeave = this.handleMouseLeave.bind(this)
  }

  handleMouseOver() {
    this.setState(() => ({ mouse: 'hover' }))
  }

  handleMouseLeave() {
    this.setState(() => ({ mouse: 'none' }))
  }

  render() {
    const { type, hoverType, width, height, alt } = this.props
    const { mouse } = this.state
    return (
      <img
        className='icon'
        src={icons[mouse === 'hover' ? hoverType : type]}
        width={width}
        height={height}
        alt={alt}
        onMouseOver={this.handleMouseOver}
        onMouseLeave={this.handleMouseLeave}
      />
    )
  }
}

export default Icon
