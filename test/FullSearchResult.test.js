import React from 'react'
import { shallow } from 'enzyme'
import { Link } from 'react-router-dom'

import FullSearchResult from '../src/FullSearchResult.js'

describe('FullSearchResult', () => {
  const minimalProps = {
    shownGMs: [],
  }

  const propsWithResult = {
    ...minimalProps,
    result: {
      type: 'TPP',
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '813001000168100',
          display: 'Nuromol film-coated tablet, 5',
        },
      ],
      status: 'active',
      sourceCodeSystemUri: 'http://snomed.info/sct',
      sourceCodeSystemVersion:
        'http://snomed.info/sct?version=http%3A%2F%2Fsnomed.info%2Fsct%2F32506021000036107%2Fversion%2F20180630',
      lastModified: '2017-02-28',
      subsidy: [],
      generalizedMedicines: [
        {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '812991000168101',
              display: 'paracetamol 500 mg + ibuprofen 200 mg tablet, 5',
            },
          ],
          type: 'MPP',
          link: '/Medication/812991000168101',
        },
      ],
      link: '/Medication/813001000168100',
    },
  }

  it('should render unloaded when result is missing', () => {
    const wrapper = shallow(<FullSearchResult {...minimalProps} />),
      unloadedSearchResult = wrapper.find('.unloaded-search-result')
    expect(unloadedSearchResult.exists()).toBe(true)
  })

  it('should link to the subject concept', () => {
    const props = {
        ...propsWithResult,
      },
      wrapper = shallow(<FullSearchResult {...props} />),
      subjectConcept = wrapper.find('.subject-concept'),
      subjectConceptLink = subjectConcept.find(Link)
    expect(subjectConceptLink.exists()).toBe(true)
    expect(subjectConceptLink.prop('to')).toEqual('/Medication/813001000168100')
  })

  it('should call onSelectResult when subject concept is clicked', () => {
    const props = {
        ...propsWithResult,
        onSelectResult: jest.fn(),
      },
      wrapper = shallow(<FullSearchResult {...props} />),
      subjectConcept = wrapper.find('.subject-concept')
    subjectConcept.simulate('click')
    expect(props.onSelectResult).toHaveBeenCalledWith(props.result)
  })

  it('should link to the generalized medicines', () => {
    const props = {
        ...propsWithResult,
        shownGMs: ['MPP'],
        onSelectResult: jest.fn(),
      },
      wrapper = shallow(<FullSearchResult {...props} />),
      generalizedMedicine = wrapper.find('.generalized-medicine')
    expect(generalizedMedicine.is(Link)).toBe(true)
    expect(generalizedMedicine.prop('to')).toEqual(
      '/Medication/812991000168101',
    )
  })

  it('should call onSelectResult when generalized medicine is clicked', () => {
    const props = {
        ...propsWithResult,
        shownGMs: ['MPP'],
        onSelectResult: jest.fn(),
      },
      wrapper = shallow(<FullSearchResult {...props} />),
      generalizedMedicine = wrapper.find('.generalized-medicine')
    generalizedMedicine.simulate('click')
    expect(props.onSelectResult).toHaveBeenCalledWith(
      props.result.generalizedMedicines[0],
    )
  })
})
