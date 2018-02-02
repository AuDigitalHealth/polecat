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
    ]),
    status: PropTypes.oneOf(['active', 'inactive', 'entered-in-error']),
    enabled: PropTypes.bool,
    onClick: PropTypes.func,
  }
  static defaultProps = { status: 'active', enabled: true }

  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
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

  render() {
    const { type, status, enabled } = this.props
    let className = `concept-type concept-type-${type}`.toLowerCase()
    className =
      status === 'active' ? className : className + ' concept-type-inactive'
    className = enabled ? className : className + ' concept-type-disabled'
    return (
      <span
        className={className}
        title={this.humanisedStatus()}
        onClick={this.handleClick}
      >
        {type}
      </span>
    )
  }
}

export default ConceptType
