import React from 'react'
import { shallow } from 'enzyme'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

import { MedicationSearchField } from '../src/MedicationSearchField.js'
import config from './config.js'

import searchBundle1 from './fixtures/searchBundle-1.json'
import QuickSearchResults from '../src/QuickSearchResults'

const mock = new MockAdapter(axios)

describe('MedicationSearchField', () => {
  it('should not show quick search when text value is empty', () => {
    const props = {
      fhirServer: config.fhirServer,
      searchPath: query => `/some/search/path/${query}`,
    }
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
})
