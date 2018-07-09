import React from 'react'
import { shallow } from 'enzyme'
import { Link } from 'react-router-dom'

import QuickSearchResults from '../src/QuickSearchResults'

import results1 from './fixtures/quickSearchResults-1.json'

describe('QuickSearchResults', () => {
  it('should render empty results', () => {
    const props = { query: 'foo', results: [] },
      wrapper = shallow(<QuickSearchResults {...props} />),
      noResults = wrapper.find('.no-results')
    expect(noResults.text()).toEqual('No results matching "foo".')
  })

  it('should render a set of coded results', () => {
    const props = {
        query: 'fot',
        results: results1,
        onSelectResult: jest.fn(),
      },
      wrapper = shallow(<QuickSearchResults {...props} />),
      result = wrapper.find('.search-result'),
      firstResult = result.first(),
      firstResultLink = firstResult.find(Link)
    expect(result).toHaveLength(4)
    firstResult.simulate('click')
    expect(props.onSelectResult).toHaveBeenCalledWith({
      coding: [
        {
          code: '21336011000036105',
          display: 'fotemustine',
          system: 'http://snomed.info/sct',
        },
      ],
      generalizedMedicines: [],
      lastModified: '2014-06-30',
      link: '/Medication/21336011000036105',
      selected: true,
      sourceCodeSystemUri: 'http://snomed.info/sct',
      sourceCodeSystemVersion:
        'http://snomed.info/sct?version=http%3A%2F%2Fsnomed.info%2Fsct%2F32506021000036107%2Fversion%2F20180630',
      status: 'active',
      subsidy: [],
      type: 'MP',
    })
    expect(firstResultLink.prop('to')).toEqual('/Medication/21336011000036105')
    expect(props.results[0].selected).toBe(true)
    expect(firstResult.hasClass('selected')).toBe(true)
  })

  it('should render a item to select a text search', () => {
    const props = {
        query: 'fot',
        results: [{ type: 'text', query: 'fot' }],
        onSelectResult: jest.fn(),
      },
      wrapper = shallow(<QuickSearchResults {...props} />),
      text = wrapper.find('.text'),
      textTarget = wrapper.find('.text .target')
    expect(textTarget.text()).toEqual('All concepts containing the text "fot"')
    expect(text.find(Link).exists()).toBe(false)
    text.simulate('click')
    expect(props.onSelectResult).toHaveBeenCalledWith({
      query: 'fot',
      type: 'text',
    })
  })

  it('should select a text search', () => {
    const props = {
        query: 'fot',
        results: [{ type: 'text', query: 'fot', selected: true }],
      },
      wrapper = shallow(<QuickSearchResults {...props} />),
      text = wrapper.find('.text')
    expect(text.hasClass('selected')).toBe(true)
  })

  it('should render a more link', () => {
    const props = {
        query: 'far',
        results: [{ type: 'more', link: '/?q=far', total: 27 }],
        onSelectResult: jest.fn(),
      },
      wrapper = shallow(<QuickSearchResults {...props} />),
      moreResults = wrapper.find('.more-results'),
      moreResultsTarget = wrapper.find('.more-results .target'),
      moreResultsLink = moreResults.find(Link)
    expect(moreResultsTarget.text()).toEqual('view all 27 matches →')
    expect(moreResultsLink.prop('to')).toEqual('/?q=far')
    moreResults.simulate('click')
    expect(props.onSelectResult).toHaveBeenCalledWith({
      type: 'more',
      link: '/?q=far',
      total: 27,
    })
  })

  it('should select a more link', () => {
    const props = {
        query: 'far',
        results: [{ type: 'more', link: '/?q=far', total: 27, selected: true }],
      },
      wrapper = shallow(<QuickSearchResults {...props} />),
      moreResults = wrapper.find('.more-results')
    expect(moreResults.hasClass('selected')).toBe(true)
  })
})
