import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import FileSaver from 'file-saver'

import DownloadResults from '../src/DownloadResults.js'

describe('DownloadResults', () => {
  it('should report click to handler when clicked', () => {
    const onClick = jest.fn()
    const props = {
      onClick,
    }
    const wrapper = shallow(<DownloadResults {...props} />)
    wrapper.simulate('click')
    expect(onClick).toHaveBeenCalled()
  })

  it('should download results when they are passed through props', () => {
    const saveAs = sinon.stub(FileSaver, 'saveAs')
    const props = {
      results: [
        {
          type: 'TPUU',
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '725751000168107',
              display: 'PKU Cooler 20 Green oral liquid solution, 174 mL pouch',
            },
          ],
          status: 'active',
          sourceCodeSystemUri: 'http://snomed.info/sct',
          sourceCodeSystemVersion:
            'http://snomed.info/sct?version=http%3A%2F%2Fsnomed.info%2Fsct%2F32506021000036107%2Fversion%2F20180228',
        },
        {
          type: 'TPUU',
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '710331000168102',
              display:
                'PKU Air 20 Red (Berry Blast) oral liquid solution, 174 mL pouch',
            },
          ],
          status: 'active',
          sourceCodeSystemUri: 'http://snomed.info/sct',
          sourceCodeSystemVersion:
            'http://snomed.info/sct?version=http%3A%2F%2Fsnomed.info%2Fsct%2F32506021000036107%2Fversion%2F20180228',
        },
      ],
    }
    const wrapper = shallow(<DownloadResults />)
    wrapper.setProps(props)
    expect(saveAs.calledOnce).toBe(true)
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.addEventListener('load', event => {
        expect(event.target.result).toMatchSnapshot()
        resolve()
      })
      reader.readAsText(saveAs.firstCall.args[0])
    })
  })

  it('should not register click when loading', () => {
    const onClick = jest.fn()
    const props = {
      loading: true,
      onClick,
    }
    const wrapper = shallow(<DownloadResults {...props} />)
    wrapper.simulate('click')
    expect(onClick).not.toHaveBeenCalled()
  })
})
