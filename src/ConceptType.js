import React, { Component } from 'react'
import PropTypes from 'prop-types'

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

  expandedConceptType() {
    const { type } = this.props
    return {
      CTPP: 'Containered Trade Product Pack',
      TPP: 'Trade Product Pack',
      TPUU: 'Trade Product Unit of Use',
      TP: 'Trade Product',
      MPP: 'Medicinal Product Pack',
      MPUU: 'Medicinal Product Unit of Use',
      MP: 'Medicinal Product',
      substance: 'Substance',
      active: 'Active',
      inactive: 'Inactive',
      'entered-in-error': 'Entered in error',
    }[type]
  }

  humanisedStatus() {
    const { status } = this.props
    return {
      active: 'Active',
      inactive: 'Inactive',
      'entered-in-error': 'Entered in error',
    }[status]
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
    const { status } = this.props
    if (this.props.title !== undefined) return this.props.title
    return status === 'active'
      ? this.expandedConceptType()
      : `${this.expandedConceptType()} - ${this.humanisedStatus()}`
  }

  render() {
    const { type } = this.props
    return (
      <span
        className={this.getClassName()}
        title={this.getTitle()}
        onClick={this.handleClick}
      >
        {type}
      </span>
    )
  }
}

export default ConceptType
