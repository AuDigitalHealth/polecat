import React from 'react'
import { shallow } from 'enzyme'
import { DateRange } from 'react-date-range'
import moment from 'moment'

import { DateRangeField } from '../src/DateRangeField.js'

describe('DateRangeField', () => {
  it('should toggle visibility of the DateRange component upon clicking the field', () => {
    const wrapper = shallow(<DateRangeField />)
    const input = wrapper.find('.date-range-input').first()
    input.simulate('click')
    const dateRange = wrapper.find(DateRange)
    expect(dateRange.exists()).toBe(true)
  })

  it('should pass startDate and endDate to DateRange component', () => {
    const props = {
      startDate: '2017-12-01',
      endDate: '2018-01-31',
    }
    const wrapper = shallow(<DateRangeField {...props} />)
    // Click on the input field section to display the DateRange component.
    const input = wrapper.find('.date-range-input').first()
    input.simulate('click')
    const dateRange = wrapper.find(DateRange)
    expect(dateRange.exists()).toBe(true)
    // Check that the correct props are passed to the DateRange component.
    expect(dateRange.prop('startDate')).toEqual(props.startDate)
    expect(dateRange.prop('endDate')).toEqual(props.endDate)
  })

  it('should pass start and end date values to the input fields', () => {
    const props = {
      startDate: '2017-12-01',
      endDate: '2018-01-31',
    }
    const wrapper = shallow(<DateRangeField {...props} />)
    const startInput = wrapper.find({ value: '20171201' })
    const endInput = wrapper.find({ value: '20180131' })
    expect(startInput.exists()).toBe(true)
    expect(endInput.exists()).toBe(true)
  })

  it('report change to the DateRange value using the onChange prop', () => {
    const onChange = jest.fn(),
      props = { onChange },
      change = { startDate: '2018-01-01', endDate: '2018-01-14' }
    const wrapper = shallow(<DateRangeField {...props} />)
    // Click on the input field section to display the DateRange component.
    const input = wrapper.find('.date-range-input').first()
    input.simulate('click')
    // Call the onChange prop passed to the DateRange component, note that this
    // returns Moments as opposed to text dates.
    wrapper.find(DateRange).prop('onChange')({
      startDate: moment(change.startDate),
      endDate: moment(change.endDate),
    })
    // Check that the onChange prop passed to the DateRangeField component was
    // called with the same value.
    expect(onChange).toHaveBeenCalledWith(change)
  })
})
