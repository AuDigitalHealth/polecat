import React from 'react'
import { shallow } from 'enzyme'

import { AdvancedSearch } from '../src/AdvancedSearch.js'
import TextField from '../src/TextField.js'
import SearchForm from '../src/SearchForm.js'
import FullSearchResults from '../src/FullSearchResults.js'
import SearchSummary from '../src/SearchSummary.js'
import Expand from '../src/Expand.js'

import results1 from './fixtures/results-1.json'

const minimalProps = { history: {} }

describe('AdvancedSearch', () => {
  it('should pass routed query to text field and search form', () => {
    const props = {
        ...minimalProps,
        query: 'nuromol',
      },
      wrapper = shallow(<AdvancedSearch {...props} />),
      textField = wrapper.find(TextField),
      searchForm = wrapper.find(SearchForm)
    expect(textField.prop('value')).toEqual(props.query)
    expect(searchForm.prop('query')).toEqual(props.query)
  })

  it('should pass correct GM props when search has a type', () => {
    const props = {
        ...minimalProps,
      },
      wrapper = shallow(<AdvancedSearch {...props} />)
    wrapper.setProps({
      query: 'nuromol type:CTPP',
      results: results1,
      bundle: { total: 1 },
    })
    const searchSummary = wrapper.find(SearchSummary),
      fullSearchResults = wrapper.find(FullSearchResults)
    expect(searchSummary.prop('allResultsAreOfType')).toEqual('CTPP')
    expect(searchSummary.prop('shownGMs')).toEqual([])
    expect(searchSummary.prop('hiddenGMs')).toEqual(['TPP', 'MPP'])
    expect(fullSearchResults.prop('allResultsAreOfType')).toEqual('CTPP')
    expect(fullSearchResults.prop('shownGMs')).toEqual([])
  })

  it('should call onQueryUpdate when notified of update from SearchForm', () => {
    const props = { ...minimalProps, onQueryUpdate: jest.fn() },
      wrapper = shallow(<AdvancedSearch {...props} />),
      onSearchUpdate = wrapper.find(SearchForm).prop('onSearchUpdate')
    onSearchUpdate('foo')
    expect(props.onQueryUpdate).toHaveBeenCalledWith('foo')
  })

  it('should call onToggleAdvanced when expand icon is clicked', () => {
    const props = { ...minimalProps, onToggleAdvanced: jest.fn() },
      wrapper = shallow(<AdvancedSearch {...props} />),
      onToggle = wrapper.find(Expand).prop('onToggle')
    onToggle()
    expect(props.onToggleAdvanced).toHaveBeenCalled()
  })

  it('should call onDownloadClick when notified of download click', () => {
    const props = {
        ...minimalProps,
        results: results1,
        bundle: { total: 1 },
        onDownloadClick: jest.fn(),
      },
      wrapper = shallow(<AdvancedSearch {...props} />),
      onDownloadClick = wrapper.find(SearchSummary).prop('onDownloadClick')
    onDownloadClick()
    expect(props.onDownloadClick).toHaveBeenCalled()
  })

  it('should call onRequireMoreResults when notified of requirement', () => {
    const props = {
        ...minimalProps,
        results: results1,
        bundle: { total: 1 },
        onRequireMoreResults: jest.fn(),
      },
      wrapper = shallow(<AdvancedSearch {...props} />),
      onRequireMoreResults = wrapper
        .find(FullSearchResults)
        .prop('onRequireMoreResults')
    onRequireMoreResults({ startIndex: 105, stopIndex: 175 })
    expect(props.onRequireMoreResults).toHaveBeenCalledWith({ stopIndex: 175 })
  })

  it('should show and hide GMs when asked to by SearchSummary', () => {
    const props = {
        ...minimalProps,
        query: 'nuromol type:CTPP',
        results: results1,
        bundle: { total: 1 },
        onShowGM: jest.fn(),
      },
      wrapper = shallow(<AdvancedSearch {...props} />),
      onShowGM = wrapper.find(SearchSummary).prop('onShowGM'),
      onHideGM = wrapper.find(SearchSummary).prop('onHideGM')
    expect(wrapper.state('shownGMs').toArray()).toEqual([])
    expect(wrapper.state('hiddenGMs').toArray()).toEqual(['TPP', 'MPP'])
    onShowGM('TPP')
    expect(wrapper.state('shownGMs').toArray()).toEqual(['TPP'])
    expect(wrapper.state('hiddenGMs').toArray()).toEqual(['MPP'])
    onHideGM('TPP')
    expect(wrapper.state('shownGMs').toArray()).toEqual([])
    expect(wrapper.state('hiddenGMs').toArray()).toEqual(['TPP', 'MPP'])
  })

  it('should throw an error when trying to show a non-existent GM', () => {
    const props = {
        ...minimalProps,
        query: 'nuromol type:CTPP',
        results: results1,
        bundle: { total: 1 },
        onShowGM: jest.fn(),
      },
      wrapper = shallow(<AdvancedSearch {...props} />),
      onShowGM = wrapper.find(SearchSummary).prop('onShowGM')
    expect(wrapper.state('hiddenGMs').toArray()).toEqual(['TPP', 'MPP'])
    expect(() => onShowGM('TPUU')).toThrowError(
      'Attempt to show a generalised medicine type (TPUU) that is not currently hidden.',
    )
  })

  it('should throw an error when trying to hide a non-existent GM', () => {
    const props = {
        ...minimalProps,
        query: 'nuromol type:CTPP',
        results: results1,
        bundle: { total: 1 },
        onHideGM: jest.fn(),
      },
      wrapper = shallow(<AdvancedSearch {...props} />),
      onHideGM = wrapper.find(SearchSummary).prop('onHideGM')
    expect(wrapper.state('shownGMs').toArray()).toEqual([])
    expect(() => onHideGM('MP')).toThrowError(
      'Attempt to hide a generalised medicine type (MP) that is not currently shown.',
    )
  })

  it('should call onError when an error is reported from the search form', () => {
    const props = {
        ...minimalProps,
        results: results1,
        bundle: { total: 1 },
        onError: jest.fn(),
      },
      wrapper = shallow(<AdvancedSearch {...props} />),
      onError = wrapper.find(SearchForm).prop('onError'),
      error = new Error('Some error')
    onError(error)
    expect(props.onError).toHaveBeenCalledWith(error)
  })
})
