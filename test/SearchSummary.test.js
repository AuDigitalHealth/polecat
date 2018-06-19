import React from 'react'
import { shallow } from 'enzyme'

import SearchSummary from '../src/SearchSummary.js'
import DownloadResults from '../src/DownloadResults.js'

const results1 = [
  {
    type: 'CTPP',
    coding: [
      {
        system: 'http://snomed.info/sct',
        code: '85641000036102',
        display: 'Dutran 75 microgram/hour patch, 5, sachet',
      },
      {
        system: 'https://www.tga.gov.au/australian-register-therapeutic-goods',
        code: '190792',
      },
    ],
    status: 'active',
    sourceCodeSystemUri: 'http://snomed.info/sct',
    sourceCodeSystemVersion:
      'http://snomed.info/sct?version=http%3A%2F%2Fsnomed.info%2Fsct%2F32506021000036107%2Fversion%2F20180531',
    lastModified: '2014-06-30',
    subsidy: [
      {
        subsidyCode: { system: 'http://pbs.gov.au/code/item', code: '5440H' },
        programCode: {
          system: 'http://pbs.gov.au/code/program',
          code: 'GE',
          display: 'Generally Available Pharmaceutical Benefits',
        },
        restriction: {
          system: 'http://pbs.gov.au/code/restriction',
          code: 'R',
          display: 'Restricted benefit',
        },
        commonwealthExManufacturerPrice: 25.21,
        manufacturerExManufacturerPrice: 25.21,
        atcCode: {
          system: 'http://www.whocc.no/atc',
          code: 'N02AB03',
          display: 'fentanyl',
        },
      },
    ],
    generalizedMedicines: [
      {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: '84771000036100',
            display: 'Dutran 75 microgram/hour patch, 5',
          },
        ],
        type: 'TPP',
      },
      {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: '26651011000036105',
            display: 'fentanyl 75 microgram/hour patch, 5',
          },
        ],
        type: 'MPP',
      },
    ],
  },
]

describe('SearchSummary', () => {
  it('should render', () => {
    shallow(<SearchSummary />)
  })

  it('should show a generalized medicine', () => {
    const onShowGM = jest.fn(),
      props = {
        results: results1,
        hiddenGMs: ['TPP', 'MPP'],
        onShowGM,
      },
      wrapper = shallow(<SearchSummary {...props} />),
      showTPP = wrapper.find({
        title: 'Display the corresponding TPP for each search result',
      }),
      showMPP = wrapper.find({
        title: 'Display the corresponding MPP for each search result',
      })
    expect(showTPP.exists()).toBe(true)
    showTPP.simulate('click')
    expect(onShowGM).toHaveBeenCalledWith('TPP')
    expect(showMPP.exists()).toBe(true)
    showMPP.simulate('click')
    expect(onShowGM).toHaveBeenCalledWith('MPP')
  })

  it('should hide a generalized medicine', () => {
    const onHideGM = jest.fn(),
      props = {
        results: results1,
        shownGMs: ['TPP'],
        hiddenGMs: ['MPP'],
        onHideGM,
      },
      wrapper = shallow(<SearchSummary {...props} />),
      hideTPP = wrapper.find({ title: 'Hide TPPs' })
    expect(hideTPP.exists()).toBe(true)
    hideTPP.simulate('click')
    expect(onHideGM).toHaveBeenCalledWith('TPP')
  })

  it('should call the onDownloadClick callback', () => {
    const onDownloadClick = jest.fn(),
      props = {
        results: results1,
        totalResults: results1.length,
        onDownloadClick,
      },
      wrapper = shallow(<SearchSummary {...props} />),
      downloadResults = wrapper.find(DownloadResults),
      downstreamOnDownloadClick = downloadResults.prop('onClick')
    downstreamOnDownloadClick()
    expect(onDownloadClick).toHaveBeenCalled()
  })
})
