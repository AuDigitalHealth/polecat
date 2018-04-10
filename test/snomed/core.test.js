import { humaniseUri, humaniseVersion } from '../../src/snomed/core.js'

describe('humaniseUri', () => {
  it('should return the correct values', () => {
    const expectations = {
      'http://snomed.info/sct': 'SNOMED CT',
      'http://loinc.org': 'http://loinc.org',
    }
    for (const uri in expectations) {
      expect(humaniseUri(uri)).toEqual(expectations[uri])
    }
  })
})

describe('humaniseVersion', () => {
  it('should return the correct values', () => {
    const expectations = [
      [
        'http://snomed.info/sct',
        'http://snomed.info/sct?version=http%3A%2F%2Fsnomed.info%2Fsct%2F32506021000036107%2Fversion%2F20180331',
        'Australian Edition (20180331)',
      ],
      [
        'http://snomed.info/sct',
        'http://snomed.info/sct?version=http%3A%2F%2Fsnomed.info%2Fsct%2F900000000000207008%2Fversion%2F20170731',
        'International Edition (20170731)',
      ],
      ['http://loinc.org', 'http://loinc.org/2.52', 'http://loinc.org/2.52'],
    ]
    for (const expectation of expectations) {
      expect(humaniseVersion(...expectation.slice(0, -1))).toEqual(
        expectation[expectation.length - 1],
      )
    }
  })
})
