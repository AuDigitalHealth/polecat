import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { DateRange } from 'react-date-range'
import onClickOutside from 'react-onclickoutside'
import moment from 'moment'

import './css/DateRangeField.css'

export class DateRangeField extends Component {
  static propTypes = {
    label: PropTypes.string,
    dateFormat: PropTypes.string,
    dateDisplayFormat: PropTypes.string,
    // Start date of range, conforming to `dateFormat`.
    startDate: PropTypes.string,
    // End date of range, conforming to `dateFormat`.
    endDate: PropTypes.string,
    onChange: PropTypes.func,
  }
  static defaultProps = {
    dateDisplayFormat: 'YYYYMMDD',
    dateFormat: 'YYYY-MM-DD',
  }

  constructor(props) {
    super(props)
    this.state = { datePickerOpen: false }
    this.toggleDatePickerOpen = this.toggleDatePickerOpen.bind(this)
    this.handleChange = this.handleChange.bind(this)
  }

  toggleDatePickerOpen() {
    const { datePickerOpen } = this.state
    this.setState(() => ({ datePickerOpen: !datePickerOpen }))
  }

  handleChange({ startDate, endDate }) {
    const { onChange, dateFormat } = this.props
    if (onChange)
      onChange({
        startDate: startDate.format(dateFormat),
        endDate: endDate.format(dateFormat),
      })
  }

  handleClickOutside() {
    this.setState(() => ({ datePickerOpen: false }))
  }

  render() {
    const { label } = this.props
    return (
      <div className="date-range-field">
        {label ? (
          <label>
            <span>{label}</span>
            {this.renderDateRangePicker()}
          </label>
        ) : (
          this.renderDateRangePicker()
        )}
      </div>
    )
  }

  renderDateRangePicker() {
    const { dateFormat, dateDisplayFormat, startDate, endDate } = this.props
    const { datePickerOpen } = this.state
    return (
      <div className="date-range-picker">
        <div
          className={
            datePickerOpen ? 'date-range-input focused' : 'date-range-input'
          }
          onClick={this.toggleDatePickerOpen}
        >
          <input
            className="start-date"
            type="text"
            disabled="disabled"
            value={startDate ? moment(startDate).format(dateDisplayFormat) : ''}
          />
          {'-'}
          <input
            className="end-date"
            type="text"
            disabled="disabled"
            value={endDate ? moment(endDate).format(dateDisplayFormat) : ''}
          />
        </div>
        {datePickerOpen ? (
          <div className="date-range-flyout">
            {' '}
            <DateRange
              format={dateFormat}
              startDate={startDate ? startDate : undefined}
              endDate={endDate ? endDate : undefined}
              onChange={this.handleChange}
            />{' '}
          </div>
        ) : null}
      </div>
    )
  }
}

export default onClickOutside(DateRangeField)
