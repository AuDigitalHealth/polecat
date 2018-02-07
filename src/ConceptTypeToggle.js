import React, { Component } from 'react'
import PropTypes from 'prop-types'

import ConceptType from './ConceptType.js'
import { amtConceptTypes } from './fhir/medication.js'

import './css/ConceptTypeToggle.css'

class ConceptTypeToggle extends Component {
  static propTypes = {
    types: PropTypes.arrayOf(
      PropTypes.oneOf(
        amtConceptTypes.concat(['active', 'inactive', 'entered-in-error']),
      ),
    ),
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
      <div className="concept-type-toggle">
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
    const { types, value } = this.props
    return (
      <div className="toggles">
        {types.map(type => {
          const on = value && value.includes(type)
          return (
            <ConceptType
              key={type}
              type={type}
              enabled={on || false}
              onClick={() => this.handleChange(type, !on)}
            />
          )
        })}
      </div>
    )
  }
}

export default ConceptTypeToggle
