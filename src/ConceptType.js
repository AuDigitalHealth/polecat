import React, { Component } from 'react'
import PropTypes from 'prop-types'

import {
  expandedConceptType,
  humanisedStatus,
  humanisedType,
} from './amt/concept.js'

import './css/ConceptType.css'

class ConceptType extends Component {
  static propTypes = {
    type: PropTypes.oneOf([
      'CTPP',
      'TPP',
      'TPUU',
      'TP',
      'MPP',
      'MPUU',
      'MP',
      'substance',
      'active',
      'inactive',
      'entered-in-error',
    ]),
    status: PropTypes.oneOf(['active', 'inactive', 'entered-in-error']),
    enabled: PropTypes.bool,
    className: PropTypes.string,
    title: PropTypes.string,
    onClick: PropTypes.func,
  }
  static defaultProps = { status: 'active', enabled: true }

  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }

  handleClick(event) {
    const { onClick } = this.props
    if (onClick) onClick(event)
  }

  getClassName() {
    const { type, status, enabled } = this.props
    let className = `concept-type concept-type-${type}`.toLowerCase()
    className =
      status == 'active'
        ? className
        : className + ' concept-type-status-inactive'
    className = enabled ? className : className + ' concept-type-disabled'
    if (this.props.className) className += ` ${this.props.className}`
    return className
  }

  getTitle() {
    const { status, type } = this.props
    if (this.props.title !== undefined) return this.props.title
    return status === 'active'
      ? expandedConceptType(type)
      : `${expandedConceptType(type)} - ${humanisedStatus(status)}`
  }

  render() {
    const { type } = this.props
    return (
      <span
        className={this.getClassName()}
        title={this.getTitle()}
        onClick={this.handleClick}
      >
        {humanisedType(type)}
      </span>
    )
  }
}

export default ConceptType
