import React from 'react'
import { shallow } from 'enzyme'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

import { MedicationSearchField } from '../src/MedicationSearchField.js'
import TextField from '../src/TextField.js'
import QuickSearchResults from '../src/QuickSearchResults'
import config from './config.js'

import searchBundle1 from './fixtures/searchBundle-1.json'
import results2 from './fixtures/results-2.json'
import results3 from './fixtures/results-3.json'

const mock = new MockAdapter(axios)

describe('MedicationSearchField', () => {
  const minimalProps = {
    fhirServer: config.fhirServer,
    searchPath: query => `/some/search/path/${query}`,
  }

  afterEach(() => mock.reset())

  it('should call onError if there is an error response', () => {
    const props = {
      ...minimalProps,
      onError: jest.fn(),
    }
    const wrapper = shallow(<MedicationSearchField {...props} />)
    mock
      .onGet(`${config.fhirServer}/some/search/path/l&_summary=true&_count=100`)
      .reply(500)
    // Set the text value to `l`.
    wrapper.setProps({ textValue: 'l' })
    return new Promise(resolve => {
      setTimeout(() => {
        expect(props.onError).toHaveBeenCalled()
        resolve()
      }, 50)
    })
  })

  it('should not show quick search when text value is empty', () => {
    const props = { ...minimalProps }
    const wrapper = shallow(<MedicationSearchField {...props} />)
    mock
      .onGet(`${config.fhirServer}/some/search/path/l&_summary=true&_count=100`)
      .reply(200, searchBundle1, { 'content-type': 'application/fhir+json' })
    // Set the text value to `l`.
    wrapper.setProps({ textValue: 'l' })
    return new Promise(resolve => {
      setTimeout(() => {
        wrapper.update()
        // Wait for the component to update, then verify that the quick search
        // results are visible.
        expect(wrapper.find(QuickSearchResults).exists()).toBe(true)
        // Set the text value to an empty string.
        wrapper.setProps({ textValue: '' })
        setTimeout(() => {
          wrapper.update()
          // Wait for the component to update, then verify that the quick search
          // results are no longer visible.
          expect(wrapper.find(QuickSearchResults).exists()).toBe(false)
          resolve()
        }, 50)
      }, 50)
    })
  })

  it('should show the quick search upon click', () => {
    const props = { ...minimalProps },
      wrapper = shallow(<MedicationSearchField {...props} />),
      onClick = wrapper.find(TextField).prop('onClick')
    onClick()
    expect(wrapper.state('quickSearchOpen')).toBe(true)
  })

  it('should call onTextChange when text value changes', () => {
    const props = { ...minimalProps, onTextChange: jest.fn() },
      wrapper = shallow(<MedicationSearchField {...props} />),
      onChange = wrapper.find(TextField).prop('onChange')
    onChange('foo')
    expect(props.onTextChange).toHaveBeenCalledWith('foo')
  })

  it('should have no result selected upon an update', () => {
    const props = { ...minimalProps },
      wrapper = shallow(<MedicationSearchField {...props} />)
    mock
      .onGet(`${config.fhirServer}/some/search/path/l&_summary=true&_count=100`)
      .reply(200, searchBundle1, { 'content-type': 'application/fhir+json' })
    wrapper.setProps({ textValue: 'l' })
    return new Promise(resolve => {
      setTimeout(() => {
        const found = wrapper.state('results').some(r => r.selected)
        expect(found).toBe(false)
        resolve()
      }, 50)
    })
  })

  it('should move the selection when pressing the down and up arrows', () => {
    const props = { ...minimalProps },
      wrapper = shallow(<MedicationSearchField {...props} />),
      onKeyDown = wrapper.find(TextField).prop('onKeyDown')
    wrapper.setProps({ textValue: 'l' })
    wrapper.setState({ results: results2 })
    return new Promise(resolve => {
      setTimeout(() => {
        let results = wrapper.state('results')
        expect(results).toHaveLength(2)
        const found = results.some(r => r.selected)
        expect(found).toBe(false)
        onKeyDown({ key: 'ArrowDown' })
        results = wrapper.state('results')
        expect(results.findIndex(f => f.selected)).toEqual(0)
        // Should stop at the end.
        onKeyDown({ key: 'ArrowDown' })
        onKeyDown({ key: 'ArrowDown' })
        results = wrapper.state('results')
        expect(results.findIndex(f => f.selected)).toEqual(1)
        onKeyDown({ key: 'ArrowUp' })
        results = wrapper.state('results')
        expect(results.findIndex(f => f.selected)).toEqual(0)
        // Should stop at the start.
        onKeyDown({ key: 'ArrowUp' })
        results = wrapper.state('results')
        expect(results.findIndex(f => f.selected)).toEqual(0)
        resolve()
      }, 50)
    })
  })

  it('should call onTextChange for the selected text on enter', () => {
    const props = { ...minimalProps, onTextChange: jest.fn() },
      wrapper = shallow(<MedicationSearchField {...props} />),
      onKeyDown = wrapper.find(TextField).prop('onKeyDown')
    wrapper.setProps({ textValue: 'l' })
    wrapper.setState({ results: results3, quickSearchOpen: true })
    return new Promise(resolve => {
      setTimeout(() => {
        onKeyDown({ key: 'ArrowDown' })
        onKeyDown({ key: 'Enter' })
        expect(props.onTextChange).toHaveBeenCalledWith('f')
        resolve()
      }, 50)
    })
  })

  it('should call onCodingChange for the selected medication on enter', () => {
    const props = { ...minimalProps, onCodingChange: jest.fn() },
      wrapper = shallow(<MedicationSearchField {...props} />),
      onKeyDown = wrapper.find(TextField).prop('onKeyDown')
    wrapper.setProps({ textValue: 'l' })
    wrapper.setState({ results: results2, quickSearchOpen: true })
    return new Promise(resolve => {
      setTimeout(() => {
        onKeyDown({ key: 'ArrowDown' })
        const results = wrapper.state('results')
        expect(results.findIndex(f => f.selected)).toEqual(0)
        onKeyDown({ key: 'Enter' })
        expect(props.onCodingChange).toHaveBeenCalledWith(
          '7488011000036109|Nexium 20 mg enteric tablet',
        )
        resolve()
      }, 50)
    })
  })

  it('should close the quick search on escape', () => {
    const props = { ...minimalProps },
      wrapper = shallow(<MedicationSearchField {...props} />),
      onKeyDown = wrapper.find(TextField).prop('onKeyDown')
    wrapper.setProps({ textValue: 'l' })
    wrapper.setState({ quickSearchOpen: true })
    expect(wrapper.state('quickSearchOpen')).toBe(true)
    onKeyDown({ key: 'Escape' })
    expect(wrapper.state('quickSearchOpen')).toBe(false)
  })

  it('should close the quick search on tab', () => {
    const props = { ...minimalProps },
      wrapper = shallow(<MedicationSearchField {...props} />),
      onKeyDown = wrapper.find(TextField).prop('onKeyDown')
    wrapper.setProps({ textValue: 'l' })
    wrapper.setState({ quickSearchOpen: true })
    expect(wrapper.state('quickSearchOpen')).toBe(true)
    onKeyDown({ key: 'Tab' })
    expect(wrapper.state('quickSearchOpen')).toBe(false)
  })

  it('should open the quick search on focus', () => {
    const props = { ...minimalProps },
      wrapper = shallow(<MedicationSearchField {...props} />),
      onFocus = wrapper.find(TextField).prop('onFocus')
    wrapper.setProps({ textValue: 'l' })
    wrapper.setState({ quickSearchOpen: false })
    expect(wrapper.state('quickSearchOpen')).toBe(false)
    onFocus()
    expect(wrapper.state('quickSearchOpen')).toBe(true)
  })

  it('should clear a selected coding', () => {
    const props = { ...minimalProps, onClear: jest.fn() },
      wrapper = shallow(<MedicationSearchField {...props} />)
    wrapper.setProps({ codingValue: 'something' })
    const onClick = wrapper.find('.selected-code').prop('onClick')
    onClick()
    expect(props.onClear).toHaveBeenCalled()
  })
})
