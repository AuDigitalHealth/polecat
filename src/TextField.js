import React, { Component } from 'react'
import PropTypes from 'prop-types'

class TextField extends Component {
  static propTypes = {
    value: PropTypes.string,
    label: PropTypes.string,
    placeholder: PropTypes.string,
    disabled: PropTypes.bool,
    className: PropTypes.string,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    focusUponMount: PropTypes.bool,
  }
  static defaultProps = {
    disabled: false,
  }

  constructor(props) {
    super(props)
    this.state = { value: this.props.value }
    this.handleChange = this.handleChange.bind(this)
    this.handleFocus = this.handleFocus.bind(this)
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

  handleFocus(event) {
    const { onFocus } = this.props
    if (onFocus) {
      onFocus()
    }
  }

  componentDidMount() {
    if (this.props.focusUponMount) this.textInput.focus()
  }

  componentWillReceiveProps(nextProps) {
    this.setState(() => ({ value: nextProps.value }))
  }

  render() {
    const { className, label, placeholder, disabled } = this.props
    const value = this.state.value
    const props = {
      className,
      type: 'text',
      placeholder,
      value: value || '',
      disabled,
      onChange: this.handleChange,
      onFocus: this.handleFocus,
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
