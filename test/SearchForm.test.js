import React from 'react'
import { shallow } from 'enzyme'

import SearchForm from '../src/SearchForm.js'
import MedicationSearchField from '../src/MedicationSearchField.js'

describe('SearchForm', () => {
  it('should populate fields with a query', () => {
    const props = {
        query: 'parent:931803011000036105 spray',
      },
      wrapper = shallow(<SearchForm {...props} />),
      textField = wrapper.find({ value: 'spray' })
    expect(textField.exists()).toBe(true)
    const parentField = wrapper.find({
      codingValue: '931803011000036105',
    })
    expect(parentField.exists()).toBe(true)
  })

  it('should notify of a search update when a field is updated', () => {
    const onSearchUpdate = jest.fn(),
      props = { onSearchUpdate },
      wrapper = shallow(<SearchForm {...props} />),
      brandField = wrapper.find({ label: 'Brand' }),
      ancestorField = wrapper.find({ label: 'Ancestor' }),
      typeField = wrapper.find({ label: 'Type' }),
      submitButton = wrapper.find('button[type="submit"]')
    brandField.prop('onChange')('Gasbusters')
    ancestorField.prop('onCodingChange')(
      '65673011000036103|Gasbusters 200 mg soft capsule',
    )
    typeField.prop('onChange')(['CTPP'])
    submitButton.simulate('click')
    expect(onSearchUpdate).toHaveBeenCalledWith(
      'type:CTPP brand-text:Gasbusters ancestor:"65673011000036103|Gasbusters 200 mg soft capsule"',
    )
  })

  it('should notify of an error pushed up from a MedicationSearchField', () => {
    const onError = jest.fn(),
      props = { onError },
      wrapper = shallow(<SearchForm {...props} />),
      medSearchField = wrapper.find(MedicationSearchField).first(),
      error = new Error('Something went wrong')
    medSearchField.prop('onError')(error)
    expect(onError).toHaveBeenCalledWith(error)
  })

  it('should clear the search when the "Clear all" link is clicked', () => {
    const onSearchUpdate = jest.fn(),
      props = {
        query:
          'type:CTPP brand-text:Gasbusters ancestor:"65673011000036103|Gasbusters 200 mg soft capsule"',
        onSearchUpdate,
      },
      wrapper = shallow(<SearchForm {...props} />),
      clearSearch = wrapper.find('.clear-form')
    clearSearch.simulate('click')
    expect(onSearchUpdate).toHaveBeenCalledWith('')
  })

  it('should show all types selected when none are specified', () => {
    const props = {
        query: 'brand-text:Gasbusters',
      },
      wrapper = shallow(<SearchForm {...props} />),
      typeField = wrapper.find({ label: 'Type' })
    expect(typeField.prop('value')).toEqual([
      'CTPP',
      'TPP',
      'TPUU',
      'MPP',
      'MPUU',
      'MP',
    ])
  })

  it('should show all statuses selected when none are specified', () => {
    const props = {
        query: 'brand-text:Gasbusters',
      },
      wrapper = shallow(<SearchForm {...props} />),
      statusField = wrapper.find({ label: 'Status' })
    expect(statusField.prop('value')).toEqual([
      'active',
      'inactive',
      'entered-in-error',
    ])
  })
})
