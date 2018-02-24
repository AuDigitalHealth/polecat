import { isValidSctid } from '../../src/snomed/sctid.js'

describe('isValidSctid', () => {
  const validSctids = [
    '21433011000036107',
    '54316011000036102',
    '2594011000036109',
    '780701000168107',
    '21258011000036102',
  ]
  const invalidSctids = [
    'dog',
    '1234',
    '21433011000036106',
    '21258001000036102',
    '0438505003',
    '001256',
    '53919011000036101.',
  ]

  for (const sctid of validSctids) {
    it(`should return true for ${sctid}`, () => {
      expect(isValidSctid(sctid)).toBe(true)
    })
  }

  for (const sctid of invalidSctids) {
    it(`should return false for ${sctid}`, () => {
      expect(isValidSctid(sctid)).toBe(false)
    })
  }
})
