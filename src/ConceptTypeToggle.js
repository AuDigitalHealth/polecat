import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { amtConceptTypes } from './fhir/medication.js'

import './css/ConceptTypeToggle.css'

class ConceptTypeToggle extends Component {
  static propTypes = {
    value: PropTypes.arrayOf(PropTypes.string),
    label: PropTypes.string,
    onChange: PropTypes.func,
  }

  handleChange(type, on) {
    const { onChange, value } = this.props
    if (onChange && value) {
      if (on && !value.includes(type)) {
        onChange(value.concat([type]))
      } else if (!on && value.includes(type)) {
        onChange(value.filter(v => v !== type))
      }
    } else if (onChange && !value) {
      onChange([type])
    }
  }

  render() {
    const { label } = this.props
    return (
      <div className='concept-type-toggle'>
        {label ? (
          <label>
            <span>{label}</span>
            {this.renderToggles()}
          </label>
        ) : (
          this.renderToggles()
        )}
      </div>
    )
  }

  renderToggles() {
    const { value } = this.props
    return (
      <div className='toggles'>
        {amtConceptTypes.filter(t => t !== 'substance').map(type => {
          const on = value && value.includes(type)
          return (
            <div
              className={
                on
                  ? `toggle toggle-${type.toLowerCase()} toggle-on`
                  : `toggle toggle-${type.toLowerCase()}`
              }
              key={type}
              onClick={() => this.handleChange(type, !on)}
            >
              {type}
            </div>
          )
        })}
      </div>
    )
  }
}

export default ConceptTypeToggle
