import React, { Component } from 'react'
import PropTypes from 'prop-types'

import './css/TextField.css'

class TextField extends Component {
  static propTypes = {
    value: PropTypes.string,
    placeholder: PropTypes.string,
    className: PropTypes.string,
    onChange: PropTypes.func,
  }

  constructor(props) {
    super(props)
    this.state = { value: this.props.value }
    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(event) {
    const target = event.target
    this.setState(
      () => ({ value: target.value }),
      () => {
        if (this.props.onChange) {
          this.props.onChange(target.value)
        }
      }
    )
  }

  componentWillReceiveProps(nextProps) {
    this.setState(() => ({ value: nextProps.value }))
  }

  render() {
    const { className, placeholder } = this.props
    const value = this.state.value
    const props = {
      className,
      type: 'text',
      placeholder,
      value: value || '',
      onChange: this.handleChange,
    }
    return (
      <div className='text-field'>
        <input {...props} />
      </div>
    )
  }
}

export default TextField
