import fs from 'fs'

import { getResource, getRelatedResources } from './medication.js'

describe('getResource', () => {
  for (const sctid of [ '61428011000036109', '21062011000036103' ]) {
    it(`should return correct result for CTPP ${sctid}`, () => {
      const resource = JSON.parse(fs.readFileSync(`test/ctpp-${sctid}.json`))
      const result = getResource(resource)
      expect(result).toMatchSnapshot()
    })
  }
})

describe('getRelatedResources', () => {
  for (const sctid of [ '61428011000036109', '21062011000036103' ]) {
    it(`should return correct result for CTPP ${sctid}`, () => {
      const resource = JSON.parse(fs.readFileSync(`test/ctpp-${sctid}.json`))
      const result = getRelatedResources(resource, sctid, 'BPGC', [
        'BPGC',
        'BPG',
        'BPSF',
        'brand',
        'UPG',
        'UBDSF',
        'UPD',
      ])
      expect(result).toMatchSnapshot()
    })
  }
})
