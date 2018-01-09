import React, { Component } from 'react'
import PropTypes from 'prop-types'
import bowser from 'bowser'

import icons from './img/icons.svg'

// Fallback graphics
import clipboardActive from './img/clipboard-active.png'
import clipboard from './img/clipboard.png'
import cross from './img/cross.png'
import expandDown from './img/expand-down.png'
import expandUp from './img/expand-up.png'
import graphActive from './img/graph-active.png'
import graph from './img/graph.png'
import listActive from './img/list-active.png'
import list from './img/list.png'
import nextActive from './img/next-active.png'
import next from './img/next.png'
import previousActive from './img/previous-active.png'
import previous from './img/previous.png'
import search from './img/search.png'
import tick from './img/tick.png'

const rasterIcons = {
  'clipboard-active': clipboardActive,
  clipboard,
  cross,
  'expand-down': expandDown,
  'expand-up': expandUp,
  'graph-active': graphActive,
  graph,
  'list-active': listActive,
  list,
  'next-active': nextActive,
  next,
  'previous-active': previousActive,
  previous,
  search,
  tick,
}

const fallback = bowser.firefox && bowser.version < 50

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

  handleMouseLeave() {
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
    return fallback ? (
      <img
        className={className ? `icon ${className}` : 'icon'}
        alt={alt}
        title={title}
        width={width}
        height={height}
        src={
          hoverType && mouse === 'hover'
            ? rasterIcons[hoverType]
            : rasterIcons[type]
        }
        onMouseOver={this.handleMouseOver}
        onMouseLeave={this.handleMouseLeave}
        onClick={this.handleClick}
      />
    ) : (
      <svg
        className={className ? `icon ${className}` : 'icon'}
        width={width}
        height={height}
        viewBox="0 0 100 100"
        onMouseOver={this.handleMouseOver}
        onMouseLeave={this.handleMouseLeave}
        onClick={this.handleClick}
      >
        <title>{title}</title>
        <desc>{alt}</desc>
        <use
          href={`${icons}#${hoverType && mouse === 'hover' ? hoverType : type}`}
        />
      </svg>
    )
  }
}

export default Icon
