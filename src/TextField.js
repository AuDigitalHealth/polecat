import React, { Component } from 'react'
import PropTypes from 'prop-types'

class TextField extends Component {
  static propTypes = {
    value: PropTypes.string,
    label: PropTypes.string,
    placeholder: PropTypes.string,
    className: PropTypes.string,
    onChange: PropTypes.func,
    focusUponMount: PropTypes.bool,
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

  componentDidMount() {
    if (this.props.focusUponMount) this.textInput.focus()
  }

  componentWillReceiveProps(nextProps) {
    this.setState(() => ({ value: nextProps.value }))
  }

  render() {
    const { className, label, placeholder } = this.props
    const value = this.state.value
    const props = {
      className,
      type: 'text',
      placeholder,
      value: value || '',
      onChange: this.handleChange,
      ref: el => (this.textInput = el),
    }
    return (
      <div className='text-field'>
        {label ? (
          <label>
            {label} <input {...props} />
          </label>
        ) : (
          <input {...props} />
        )}
      </div>
    )
  }
}

export default TextField
