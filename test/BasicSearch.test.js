import React from 'react'
import { shallow } from 'enzyme'

import { BasicSearch } from '../src/BasicSearch.js'
import QuickSearchResults from '../src/QuickSearchResults.js'
import TextField from '../src/TextField.js'
import Expand from '../src/Expand.js'

import results1 from './fixtures/results-1.json'
import results2 from './fixtures/results-2.json'

describe('BasicSearch', () => {
  it('should pass the onSelectResult handler to QuickSearchResults', () => {
    const props = {
        onSelectResult: jest.fn(),
      },
      wrapper = shallow(<BasicSearch {...props} />)
    wrapper.setState({ quickSearchOpen: true })
    const quickSearchResults = wrapper.find(QuickSearchResults),
      onSelectResult = quickSearchResults.prop('onSelectResult')
    expect(onSelectResult).not.toBeUndefined()
    expect(onSelectResult).toEqual(props.onSelectResult)
  })

  it('should add a more link if not all results are shown', () => {
    const props = {
        results: results1,
        query: 'nuromol',
        bundle: { total: 10 },
      },
      wrapper = shallow(<BasicSearch {...props} />)
    wrapper.setState({ quickSearchOpen: true })
    const results = wrapper.find(QuickSearchResults).prop('results'),
      moreLink = results.find(f => f.type === 'more')
    expect(moreLink).not.toBeUndefined()
    expect(moreLink.link).toEqual('/?q=nuromol')
    expect(moreLink.total).toEqual(10)
  })

  it('should not render more link if all results are shown', () => {
    const props = {
        results: results1,
        query: 'nuromol',
        bundle: { total: 1 },
      },
      wrapper = shallow(<BasicSearch {...props} />)
    wrapper.setState({ quickSearchOpen: true })
    const results = wrapper.find(QuickSearchResults).prop('results'),
      moreLink = results.find(f => f.type === 'more')
    expect(moreLink).toBeUndefined()
  })

  it('should close quick search on Esc key in text field', () => {
    const props = {
        results: results1,
        query: 'nuromol',
        bundle: { total: 10 },
      },
      wrapper = shallow(<BasicSearch {...props} />)
    wrapper.setState({ quickSearchOpen: true })
    const onKeyDown = wrapper.find(TextField).prop('onKeyDown')
    onKeyDown({ key: 'Escape' })
    expect(wrapper.state('quickSearchOpen')).toBe(false)
  })

  it('should fire onQueryUpdate upon change to text field', () => {
    const props = {
        onQueryUpdate: jest.fn(),
      },
      wrapper = shallow(<BasicSearch {...props} />),
      onChange = wrapper.find(TextField).prop('onChange')
    onChange('foo')
    expect(props.onQueryUpdate).toHaveBeenCalledWith('foo')
  })

  it('should fire onQueryUpdate upon input of SCTID to text field', () => {
    const props = {
        onQueryUpdate: jest.fn(),
      },
      wrapper = shallow(<BasicSearch {...props} />),
      onChange = wrapper.find(TextField).prop('onChange')
    onChange('1094401000168108')
    expect(props.onQueryUpdate).toHaveBeenCalledWith('id:1094401000168108')
  })

  it('should open the quick search upon focussing the text field', () => {
    const wrapper = shallow(<BasicSearch />),
      onFocus = wrapper.find(TextField).prop('onFocus')
    onFocus()
    expect(wrapper.state('quickSearchOpen')).toBe(true)
  })

  it('should select the first result on initialisation', () => {
    const props = {
        results: results2,
        query: 'nexium enteric',
      },
      wrapper = shallow(<BasicSearch {...props} />),
      results = wrapper.state('results')
    expect(results.findIndex(f => f.selected)).toEqual(0)
  })

  it('should move the selection when pressing the down and up arrows', () => {
    const props = {
        results: results2,
        query: 'nexium enteric',
      },
      wrapper = shallow(<BasicSearch {...props} />),
      onKeyDown = wrapper.find(TextField).prop('onKeyDown')
    let results = wrapper.state('results')
    expect(results.findIndex(f => f.selected)).toEqual(0)
    onKeyDown({ key: 'ArrowDown' })
    results = wrapper.state('results')
    expect(results.findIndex(f => f.selected)).toEqual(1)
    // Should stop at the end.
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
  })

  it('should select the selected result on enter', () => {
    const props = {
        results: results2,
        query: 'nexium enteric',
        onSelectResult: jest.fn(),
      },
      wrapper = shallow(<BasicSearch {...props} />),
      onKeyDown = wrapper.find(TextField).prop('onKeyDown')
    onKeyDown({ key: 'Enter' })
    expect(props.onSelectResult).toHaveBeenCalledWith(
      {
        ...props.results[0],
        selected: true,
      },
      { navigate: true },
    )
  })

  it('should call onToggleAdvanced upon clicking the expand icon', () => {
    const props = {
        query: 'foo',
        onToggleAdvanced: jest.fn(),
      },
      wrapper = shallow(<BasicSearch {...props} />),
      onToggle = wrapper.find(Expand).prop('onToggle')
    onToggle()
    expect(props.onToggleAdvanced).toHaveBeenCalled()
  })

  it('should call onToggleAdvanced if the query is empty', () => {
    const props = {
        query: '',
        onToggleAdvanced: jest.fn(),
      },
      wrapper = shallow(<BasicSearch {...props} />),
      onToggle = wrapper.find(Expand).prop('onToggle')
    onToggle()
    expect(props.onToggleAdvanced).toHaveBeenCalled()
  })

  it('should handle updates to the query and results via props', () => {
    const wrapper = shallow(<BasicSearch />)
    wrapper.setProps({ query: 'nuromol', results: results1 })
    const expected = results1
    expected[0] = { ...expected[0], selected: true }
    expect(wrapper.state('results')).toEqual(expected)
  })

  it('should close quick search when passed quickSearchShouldClose', () => {
    const props = { onQuickSearchClosed: jest.fn() }
    const wrapper = shallow(<BasicSearch {...props} />)
    wrapper.setState({ quickSearchOpen: true })
    wrapper.setProps({ quickSearchShouldClose: true })
    expect(wrapper.state('quickSearchOpen')).toBe(false)
    expect(props.onQuickSearchClosed).toHaveBeenCalled()
  })
})
