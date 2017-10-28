import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Motion, spring } from 'react-motion'

import './css/ErrorMessage.css'

// Renders a Error or OpOutcomeError object.
class ErrorMessage extends Component {
  static propTypes = {
    error: PropTypes.shape({
      issue: PropTypes.shape({
        severity: PropTypes.string,
        details: PropTypes.shape({
          display: PropTypes.string,
        }),
        diagnostics: PropTypes.string,
        code: PropTypes.string,
        location: PropTypes.string,
        expression: PropTypes.string,
      }),
      message: PropTypes.string,
    }),
  }

  render() {
    const { error } = this.props
    const defaultStyle = { y: -70 }
    const style = { y: spring(0) }

    return (
      <Motion defaultStyle={defaultStyle} style={style}>
        {motion => this.renderError(error, motion)}
      </Motion>
    )
  }

  renderError(error, motion) {
    const attrs = { style: { top: `${motion.y}px` } }
    if (error.issue) {
      return (
        <div className='error' {...attrs}>
          {error.issue.details && error.issue.details.display ? (
            <p className='details'>{error.issue.details.display}</p>
          ) : (
            undefined
          )}
          {error.issue.diagnostics ? (
            <p className='diagnostics'>{error.issue.diagnostics}</p>
          ) : (
            undefined
          )}
        </div>
      )
    } else if (error.message) {
      return (
        <div className='error' {...attrs}>
          <p className='message'>{error.message}</p>
        </div>
      )
    } else {
      return <div className='error' />
    }
  }
}

export default ErrorMessage
