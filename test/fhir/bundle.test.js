import sinon from 'sinon'

import { getBundleConcepts } from '../../src/fhir/bundle.js'
import * as util from '../../src/util.js'

import childBundle from '../fixtures/childBundle-21360011000036101.json'
import packageBundle from '../fixtures/packageBundle-53975011000036108.json'
import ingredientBundle from '../fixtures/ingredientBundle-1975011000036109.json'

describe('getBundleConcepts', () => {
  beforeEach(() => {
    // Need to stub out `sha256` function, as it relies on APIs only available
    // within the browser.
    sinon.stub(util, 'sha256').callsFake(() => Promise.resolve('somesha'))
  })

  it('should return correct concepts from child bundle', () => {
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
    const result = getBundleConcepts(subject, childBundle, {
      queryType: 'children',
    })
    expect(result).resolves.toMatchSnapshot()
  })

  it('should return correct concepts from package bundle', () => {
    const subject = {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '53975011000036108',
          display: 'Canesten Clotrimazole 1% cream',
        },
      ],
      type: 'BPSF',
    }
    const result = getBundleConcepts(subject, packageBundle, {
      queryType: 'packages',
    })
    expect(result).resolves.toMatchSnapshot()
  })

  it('should return correct concepts from ingredient bundle', () => {
    const subject = {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '1975011000036109',
          display: 'clotrimazole',
        },
      ],
      type: 'substance',
    }
    const result = getBundleConcepts(subject, ingredientBundle, {
      queryType: 'contains-ingredient',
    })
    expect(result).resolves.toMatchSnapshot()
  })

  afterEach(() => {
    util.sha256.restore()
  })
})
