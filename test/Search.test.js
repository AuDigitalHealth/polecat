import React from 'react'
import { shallow } from 'enzyme'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import sinon from 'sinon'

import { Search } from '../src/Search.js'
import BasicSearch from '../src/BasicSearch.js'
import AdvancedSearch from '../src/AdvancedSearch.js'
import config from './config.js'

import searchBundle1 from './fixtures/searchBundle-1.json'
import searchBundle2 from './fixtures/searchBundle-2.json'
import searchBundle3 from './fixtures/searchBundle-3.json'
import searchBundle4 from './fixtures/searchBundle-4.json'
import searchBundle5 from './fixtures/searchBundle-5.json'
import searchBundle6 from './fixtures/searchBundle-6.json'
import results1 from './fixtures/results-1.json'

var mock = new MockAdapter(axios)

describe('Search', () => {
  const minimalProps = {
    fhirServer: config.fhirServer,
    history: {},
  }

  afterEach(() => mock.reset())

  it('should render with a query from props, and also update', async () => {
    const props = {
      ...minimalProps,
      query: 'nuromol',
    }
    mock
      .onGet(
        `${
          minimalProps.fhirServer
        }/Medication?status=active,inactive,entered-in-error&_text=nuromol&_summary=true&_count=100`,
      )
      .reply(200, searchBundle1, {
        'content-type': 'application/fhir+json',
      })
      .onGet(
        `${
          minimalProps.fhirServer
        }/Medication?status=active,inactive,entered-in-error&_text=fentanyl&_summary=true&_count=100`,
      )
      .reply(200, searchBundle2, {
        'content-type': 'application/fhir+json',
      })
    const wrapper = shallow(<Search {...props} />)
    let advancedSearch = wrapper.find(AdvancedSearch)
    expect(advancedSearch.exists()).toBe(true)
    expect(advancedSearch.prop('query')).toEqual('nuromol')
    wrapper.setProps({ query: 'fentanyl' })
    advancedSearch = wrapper.find(AdvancedSearch)
    expect(advancedSearch.prop('query')).toEqual('fentanyl')
  })

  it('should not close quick search when getting results with no query', () => {
    const wrapper = shallow(<Search {...minimalProps} />)
    wrapper.setProps({ results: results1 })
    expect(wrapper.state('quickSearchShouldClose')).toBe(false)
  })

  it('should stop asking for quick search to be closed once notified', () => {
    const wrapper = shallow(<Search {...minimalProps} />),
      onQuickSearchClosed = wrapper
        .find(BasicSearch)
        .prop('onQuickSearchClosed')
    onQuickSearchClosed()
    expect(wrapper.state('quickSearchShouldClose')).toBe(false)
  })

  it('should ask for quick search to be closed when a result has been selected in basic search', () => {
    const wrapper = shallow(<Search {...minimalProps} />),
      basicSearch = wrapper.find(BasicSearch)
    basicSearch.prop('onSelectResult')()
    wrapper.update()
    expect(wrapper.find(BasicSearch).prop('quickSearchShouldClose')).toBe(true)
  })

  it('should unset query and results in state when a result has been selected', () => {
    const wrapper = shallow(<Search {...minimalProps} />)
    wrapper.setState({ query: 'foo' })
    let basicSearch = wrapper.find(BasicSearch)
    expect(basicSearch.prop('query')).toEqual('foo')
    basicSearch.prop('onSelectResult')()
    wrapper.setProps({
      query: 'ingredient:"933240721000036101|dressing foam with silver" foo',
    })
    wrapper.update()
    const advancedSearch = wrapper.find(AdvancedSearch)
    expect(advancedSearch.prop('query')).toEqual(
      'ingredient:"933240721000036101|dressing foam with silver" foo',
    )
    expect(advancedSearch.prop('results')).toBeNull()
    expect(advancedSearch.prop('allResults')).toBeNull()
    expect(advancedSearch.prop('bundle')).toBeNull()
    wrapper.setState({ advanced: false })
    basicSearch = wrapper.find(BasicSearch)
    expect(basicSearch.prop('results')).toBeNull()
    expect(basicSearch.prop('bundle')).toBeNull()
  })

  it('should not, on selection of a result, push a history entry if navigate is not set', () => {
    const props = {
        ...minimalProps,
        history: { push: jest.fn() },
      },
      wrapper = shallow(<Search {...props} />)
    const basicSearch = wrapper.find(BasicSearch)
    basicSearch.prop('onSelectResult')({
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '812991000168101',
          display: 'paracetamol 500 mg + ibuprofen 200 mg tablet, 5',
        },
      ],
      type: 'MPP',
      link: '/Medication/812991000168101',
    })
    expect(props.history.push).not.toHaveBeenCalled()
  })

  it('should retrieve all results on download click', () => {
    const wrapper = shallow(<Search {...minimalProps} />)
    wrapper.setState({
      query: 'type:MP ancestor:37732011000036107|phenylephrine',
      advanced: true,
    })
    // Mock out HTTP calls such that the search request receives the first page,
    // and the subsequent request receives the second page of results.
    mock
      .onGet(
        `${
          minimalProps.fhirServer
        }/Medication?medication-resource-type=UPD&ancestor=Medication/37732011000036107&status=active,inactive,entered-in-error&_summary=true&_count=100`,
      )
      .reply(200, searchBundle1, {
        'content-type': 'application/fhir+json',
      })
      .onGet(
        `${
          minimalProps.fhirServer
        }?_getpages=ac0f1c84-093d-4696-af6a-d8245e92f846&_getpagesoffset=20&_count=20&_bundletype=searchset`,
      )
      .reply(200, searchBundle2, {
        'content-type': 'application/fhir+json',
      })
    // Get the `onDownloadClick` handler passed to the AdvancedSearchComponent,
    // and call it.
    const onDownloadClick = wrapper.find(AdvancedSearch).prop('onDownloadClick')
    onDownloadClick()
    // Give the async code a chance to execute, then check that the `allResults`
    // prop has been passed to the AdvancedSearch component, with the correct value.
    return new Promise(resolve => {
      setTimeout(() => {
        wrapper.update()
        const advancedSearch = wrapper.find(AdvancedSearch)
        expect(advancedSearch).toBeDefined()
        expect(advancedSearch.prop('allResults')).toBeDefined()
        expect(advancedSearch.prop('allResults')).toMatchSnapshot()
        resolve()
      }, 50)
    })
  })

  it('should download with query in props but not state', () => {
    const props = {
      ...minimalProps,
      query: 'type:MP ancestor:37732011000036107|phenylephrine',
    }
    const wrapper = shallow(<Search {...props} />)
    // Mock out HTTP calls such that the search request receives the first page,
    // and the subsequent request receives the second page of results.
    mock
      .onGet(
        `${
          props.fhirServer
        }/Medication?medication-resource-type=UPD&ancestor=Medication/37732011000036107&status=active,inactive,entered-in-error&_summary=true&_count=100`,
      )
      .reply(200, searchBundle1, { 'content-type': 'application/fhir+json' })
      .onGet(
        `${
          props.fhirServer
        }?_getpages=ac0f1c84-093d-4696-af6a-d8245e92f846&_getpagesoffset=20&_count=20&_bundletype=searchset`,
      )
      .reply(200, searchBundle2, {
        'content-type': 'application/fhir+json',
      })
    // Get the `onDownloadClick` handler passed to the AdvancedSearchComponent,
    // and call it.
    const onDownloadClick = wrapper.find(AdvancedSearch).prop('onDownloadClick')
    onDownloadClick()
    // Give the async code a chance to execute, then check that the `allResults`
    // prop has been passed to the AdvancedSearch component, with the correct value.
    return new Promise(resolve => {
      setTimeout(() => {
        wrapper.update()
        const advancedSearch = wrapper.find(AdvancedSearch)
        expect(advancedSearch).toBeDefined()
        expect(advancedSearch.prop('allResults')).toBeDefined()
        resolve()
      }, 50)
    })
  })

  it('should call onError when getting all results yields an error response', () => {
    const props = {
      ...minimalProps,
      query: 'type:MP ancestor:37732011000036107|phenylephrine',
      onLoadingChange: jest.fn(),
      onError: jest.fn(),
    }
    const wrapper = shallow(<Search {...props} />)
    mock
      // This request covers the request made upon mounting the component.
      .onGet(
        `${
          props.fhirServer
        }/Medication?medication-resource-type=UPD&ancestor=Medication/37732011000036107&status=active,inactive,entered-in-error&_summary=true&_count=100`,
      )
      .reply(200, searchBundle1, {
        'content-type': 'application/fhir+json',
      })
      .onGet(
        `${
          props.fhirServer
        }/Medication?medication-resource-type=UPD&ancestor=Medication/37732011000036107&status=active,inactive,entered-in-error&_summary=true&_count=100`,
      )
      .reply(500)
    // Get the `onDownloadClick` handler passed to the AdvancedSearchComponent,
    // and call it.
    const onDownloadClick = wrapper.find(AdvancedSearch).prop('onDownloadClick')
    return onDownloadClick().then(() => {
      expect(props.onError).toHaveBeenCalled()
      return expect(props.onLoadingChange).toHaveBeenLastCalledWith(false)
    })
  })

  it('should add links to results', () => {
    const props = {
      ...minimalProps,
      query: 'nuromol',
    }
    mock
      .onGet(
        `${
          minimalProps.fhirServer
        }/Medication?status=active,inactive,entered-in-error&_text=nuromol&_summary=true&_count=100`,
      )
      .replyOnce(200, searchBundle1, {
        'content-type': 'application/fhir+json',
      })
    const wrapper = shallow(<Search {...props} />)
    return new Promise(resolve => {
      setTimeout(() => {
        wrapper.update()
        const advancedSearch = wrapper.find(AdvancedSearch)
        expect(advancedSearch.prop('results')[0].link).toEqual(
          '/Medication/61786011000036109',
        )
        resolve()
      }, 50)
    })
  })

  it('should add links to generalized medicines', () => {
    const props = {
      ...minimalProps,
      query:
        'type:TPP status:active modified-from:2018-05-01 modified-to:2018-05-31',
    }
    mock
      .onGet(
        `${
          minimalProps.fhirServer
        }/Medication?medication-resource-type=BPG&status=active&last-modified=ge2018-05-01&last-modified=le2018-05-31&_summary=true&_count=100`,
      )
      .replyOnce(200, searchBundle3, {
        'content-type': 'application/fhir+json',
      })
    const wrapper = shallow(<Search {...props} />)
    return new Promise(resolve => {
      setTimeout(() => {
        wrapper.update()
        const advancedSearch = wrapper.find(AdvancedSearch),
          firstResult = advancedSearch.prop('results')[0]
        expect(firstResult.generalizedMedicines[0].link).toEqual(
          '/Medication/1077401000168106',
        )
        resolve()
      }, 50)
    })
  })

  describe('request triggering', () => {
    let httpSpy
    beforeEach(() => (httpSpy = sinon.spy(axios, 'get')))
    afterEach(() => httpSpy.restore())

    it('should not make another request if sent the same query through props', () => {
      const props = {
        ...minimalProps,
        query: 'g',
      }
      mock
        .onGet(
          `${
            props.fhirServer
          }/Medication?status=active,inactive,entered-in-error&_text=g&_summary=true&_count=100`,
        )
        .reply(200, searchBundle1, {
          'content-type': 'application/fhir+json',
        })
      const wrapper = shallow(<Search {...props} />)
      return new Promise(resolve => {
        setTimeout(() => {
          wrapper.setProps({ loading: true, query: 'g' })
          expect(httpSpy.callCount).toBe(1)
          resolve()
        }, 50)
      })
    })

    it('should not make another request if sent the same query through onQueryUpdate', () => {
      const props = {
        ...minimalProps,
        history: { push: jest.fn() },
        query: 'g',
      }
      mock
        .onGet(
          `${
            props.fhirServer
          }/Medication?status=active,inactive,entered-in-error&_text=g&_summary=true&_count=100`,
        )
        .reply(200, searchBundle1, {
          'content-type': 'application/fhir+json',
        })
      const wrapper = shallow(<Search {...props} />)
      const onQueryUpdate = wrapper.find(AdvancedSearch).prop('onQueryUpdate')
      return new Promise(resolve => {
        setTimeout(() => {
          onQueryUpdate('g')
          expect(httpSpy.callCount).toBe(1)
          resolve()
        }, 50)
      })
    })

    it('should not make another request if the same query comes through onQueryUpdate, then props', () => {
      const props = {
        ...minimalProps,
        history: { push: jest.fn() },
      }
      mock
        .onGet(
          `${
            props.fhirServer
          }/Medication?status=active,inactive,entered-in-error&_text=g&_summary=true&_count=100`,
        )
        .reply(200, searchBundle1, {
          'content-type': 'application/fhir+json',
        })
      const wrapper = shallow(<Search {...props} />)
      wrapper.setState({ advanced: true })
      const onQueryUpdate = wrapper.find(AdvancedSearch).prop('onQueryUpdate')
      onQueryUpdate('g')
      return new Promise(resolve => {
        setTimeout(() => {
          wrapper.setProps({ query: 'g' })
          expect(httpSpy.callCount).toBe(1)
          resolve()
        }, 50)
      })
    })
  })

  describe('pagination', () => {
    it('should retrieve an extra page of results when onRequireMoreResults is called', () => {
      const props = {
        ...minimalProps,
        history: { push: jest.fn() },
      }
      const wrapper = shallow(<Search {...props} />)
      // Put search into advanced mode.
      wrapper.setState({
        advanced: true,
      })
      // Mock out HTTP calls such that the search request receives the first page,
      // and the subsequent request receives the second page of results.
      mock
        .onGet(
          `${
            props.fhirServer
          }/Medication?medication-resource-type=UPG&status=active&last-modified=ge2018-05-01&last-modified=le2018-05-31&_summary=true&_count=100`,
        )
        .reply(200, searchBundle3, {
          'content-type': 'application/fhir+json',
        })
        .onGet(
          `${
            props.fhirServer
          }?_getpages=ceb6c9b6-2519-4bce-be8d-e19a8fa1f856&_getpagesoffset=100&_count=100&_bundletype=searchset`,
        )
        .reply(200, searchBundle4, {
          'content-type': 'application/fhir+json',
        })
      // Update the query using the `onQueryUpdate` callback function.
      const onQueryUpdate = wrapper.find(AdvancedSearch).prop('onQueryUpdate')
      onQueryUpdate(
        'type:MPP status:active modified-from:2018-05-01 modified-to:2018-05-31',
      )
      // Give the async code a chance to execute, then run the first set of
      // assertions on downstream props.
      return new Promise(resolve => {
        setTimeout(() => {
          wrapper.update()
          const advancedSearch = wrapper.find(AdvancedSearch)
          // The first set of results should be passed to the AdvancedSearch
          // component, and the `moreLink` prop should be the next link from the
          // bundle.
          expect(advancedSearch).toBeDefined()
          expect(advancedSearch.prop('results')).toBeDefined()
          expect(advancedSearch.prop('results')).toMatchSnapshot()
          // Get the `onRequireMoreResults` handler passed to the AdvancedSearchComponent,
          // and call it.
          const onRequireMoreResults = wrapper
            .find(AdvancedSearch)
            .prop('onRequireMoreResults')
          onRequireMoreResults({ stopIndex: 150 })
          // Give the async code a chance to execute, then check that the
          // downstream props have been updated to match the second page of results.
          setTimeout(() => {
            wrapper.update()
            // The second set of results should be passed to the AdvancedSearch
            // component, and the `moreLink` prop should be unset, as there is
            // no next link in the second bundle.
            const advancedSearch = wrapper.find(AdvancedSearch)
            expect(advancedSearch).toBeDefined()
            expect(advancedSearch.prop('results')).toBeDefined()
            expect(advancedSearch.prop('results')).toMatchSnapshot()
            expect(advancedSearch.prop('moreLink')).toBeFalsy()
            resolve()
          }, 50)
        }, 50)
      })
    })

    it('should handle an error when requesting more results', () => {
      const props = {
        ...minimalProps,
        history: { push: jest.fn() },
        onError: jest.fn(),
      }
      const wrapper = shallow(<Search {...props} />)
      // Put search into advanced mode.
      wrapper.setState({
        advanced: true,
      })
      // Mock out HTTP calls such that the search request receives the first page,
      // and the subsequent request generates an error.
      mock
        .onGet(
          `${
            props.fhirServer
          }/Medication?medication-resource-type=UPG&status=active&last-modified=ge2018-05-01&last-modified=le2018-05-31&_summary=true&_count=100`,
        )
        .reply(200, searchBundle3, {
          'content-type': 'application/fhir+json',
        })
        .onGet(
          `${
            props.fhirServer
          }?_getpages=b92d05a5-8272-42fc-95d9-be572621f46c&_getpagesoffset=100&_count=100&_bundletype=searchset`,
        )
        .reply(500)
      // Update the query using the `onQueryUpdate` callback function.
      const onQueryUpdate = wrapper.find(AdvancedSearch).prop('onQueryUpdate')
      onQueryUpdate(
        'type:MPP status:active modified-from:2018-05-01 modified-to:2018-05-31',
      )
      return new Promise(resolve => {
        setTimeout(() => {
          // Get the `onRequireMoreResults` handler passed to the AdvancedSearchComponent,
          // and call it.
          const onRequireMoreResults = wrapper
            .find(AdvancedSearch)
            .prop('onRequireMoreResults')
          onRequireMoreResults({ stopIndex: 150 })
          // Give the async code a chance to execute, then check that the
          // downstream props have been updated to match the second page of results.
          setTimeout(() => {
            expect(props.onError).toHaveBeenCalledWith(new Error('500'))
            resolve()
          }, 50)
        }, 50)
      })
    })

    it('should not retain paginated results between searches', () => {
      const props = {
        ...minimalProps,
        history: { push: jest.fn() },
        minRequestFrequency: 0,
      }
      const wrapper = shallow(<Search {...props} />)
      // Put search into advanced mode.
      wrapper.setState({
        advanced: true,
      })
      // Mock out HTTP calls such that the search request receives the first page,
      // and the subsequent request receives the second page of results.
      mock
        .onGet(
          `${
            props.fhirServer
          }/Medication?medication-resource-type=BPG&status=active&last-modified=ge2018-05-01&last-modified=le2018-05-31&_summary=true&_count=100`,
        )
        .reply(200, searchBundle3, {
          'content-type': 'application/fhir+json',
        })
        .onGet(
          `${
            props.fhirServer
          }?_getpages=b92d05a5-8272-42fc-95d9-be572621f46c&_getpagesoffset=100&_count=100&_bundletype=searchset`,
        )
        .reply(200, searchBundle4, {
          'content-type': 'application/fhir+json',
        })
        .onGet(
          `${
            props.fhirServer
          }/Medication?medication-resource-type=BPSF&status=active&last-modified=ge2018-05-01&last-modified=le2018-05-31&_summary=true&_count=100`,
        )
        .reply(200, searchBundle5, {
          'content-type': 'application/fhir+json',
        })
        .onGet(
          `${
            props.fhirServer
          }?_getpages=f42a28a9-f81a-4943-bd17-7e425f7955f1&_getpagesoffset=100&_count=100&_bundletype=searchset`,
        )
        .reply(200, searchBundle6, {
          'content-type': 'application/fhir+json',
        })
      // Update the query using the `onQueryUpdate` callback function.
      const onQueryUpdate = wrapper.find(AdvancedSearch).prop('onQueryUpdate')
      onQueryUpdate(
        'type:TPP status:active modified-from:2018-05-01 modified-to:2018-05-31',
      )
      return new Promise(resolve => {
        setTimeout(() => {
          wrapper.update()
          const onRequireMoreResults = wrapper
            .find(AdvancedSearch)
            .prop('onRequireMoreResults')
          onRequireMoreResults({ stopIndex: 150 })
          setTimeout(() => {
            wrapper.update()
            const onQueryUpdate = wrapper
              .find(AdvancedSearch)
              .prop('onQueryUpdate')
            onQueryUpdate(
              'type:TPUU status:active modified-from:2018-05-01 modified-to:2018-05-31',
            )
            setTimeout(() => {
              wrapper.update()
              const advancedSearch = wrapper.find(AdvancedSearch)
              expect(advancedSearch.prop('results')).toHaveLength(100)
              const onRequireMoreResults = wrapper
                .find(AdvancedSearch)
                .prop('onRequireMoreResults')
              onRequireMoreResults({ stopIndex: 150 })
              setTimeout(() => {
                wrapper.update()
                const advancedSearch = wrapper.find(AdvancedSearch)
                expect(advancedSearch.prop('results')).toHaveLength(200)
                expect(
                  advancedSearch.prop('results').some(r => r.type === 'TPP'),
                ).toBe(false)
                resolve()
              }, 50)
            }, 50)
          }, 50)
        }, 50)
      })
    })
  })
})
