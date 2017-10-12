import fs from 'fs'

import { getSubjectConcept, getRelatedConcepts } from './medication.js'

describe('getSubjectConcept', () => {
  for (const sctid of [ '61428011000036109', '21062011000036103' ]) {
    it(`should return correct result for CTPP ${sctid}`, () => {
      const resource = JSON.parse(fs.readFileSync(`test/ctpp-${sctid}.json`))
      const result = getSubjectConcept(resource)
      expect(result).toMatchSnapshot()
    })
  }
  for (const sctid of ['2292011000036106']) {
    it(`should return correct result for substance ${sctid}`, () => {
      const resource = JSON.parse(
        fs.readFileSync(`test/substance-${sctid}.json`)
      )
      const result = getSubjectConcept(resource)
      expect(result).toMatchSnapshot()
    })
  }
})

describe('getRelatedConcepts', () => {
  for (const sctid of [ '61428011000036109', '21062011000036103' ]) {
    it(`should return correct result for CTPP ${sctid}`, () => {
      const resource = JSON.parse(fs.readFileSync(`test/ctpp-${sctid}.json`))
      const result = getRelatedConcepts(resource, sctid, 'BPGC')
      expect(result).toMatchSnapshot()
    })
  }
})
