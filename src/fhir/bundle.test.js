import sinon from 'sinon'

import { getBundleConcepts } from './bundle.js'
import * as util from '../util.js'

import bundle from '../../test/childBundle-21360011000036101.json'

describe('getBundleConcepts', () => {
  beforeEach(() => {
    // Need to stub out `sha256` function, as it relies on APIs only available
    // within the browser.
    sinon.stub(util, 'sha256').callsFake(() => Promise.resolve('somesha'))
  })

  it('should return correct concepts', () => {
    const subject = {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '21360011000036101',
          display: 'amoxicillin + clavulanic acid',
        },
      ],
      type: 'UPD',
    }
    const result = getBundleConcepts(subject, bundle)
    expect(result).resolves.toMatchSnapshot()
  })

  afterEach(() => {
    util.sha256.restore()
  })
})
