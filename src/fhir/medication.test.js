import fs from 'fs'

import {
  getSubjectConcept,
  getRelatedConcepts,
  mergeConceptsAndRelationships,
  emptyConcepts,
  fhirMedicationTypeFor,
  codingToSnomedCode,
  codingToGroupCode,
} from './medication.js'

const filePrefixToAmtType = filePrefix =>
  ({
    ctpp: 'CTPP',
    tpp: 'TPP',
    tpuu: 'TPUU',
    tp: 'TP',
    mpp: 'MPP',
    mpuu: 'MPUU',
    mp: 'MP',
    substance: 'substance',
  }[filePrefix])

describe('getSubjectConcept', () => {
  for (const file of fs.readdirSync('test')) {
    const match = file.match(/(ctpp|tpp|tpuu|tp|mpp|mpuu|mp|substance)-(\d+)/)
    if (!match) continue
    const type = match[1],
      sctid = match[2],
      amtType = filePrefixToAmtType(type)
    it(`should return correct result for ${amtType} ${sctid}`, () => {
      const resource = JSON.parse(fs.readFileSync(`test/${file}`))
      const result = getSubjectConcept(resource)
      expect(result).toMatchSnapshot()
    })
  }
})

describe('getRelatedConcepts', () => {
  for (const file of fs.readdirSync('test')) {
    const match = file.match(/(ctpp|tpp|tpuu|tp|mpp|mpuu|mp|substance)-(\d+)/)
    if (!match) continue
    const type = match[1],
      sctid = match[2],
      amtType = filePrefixToAmtType(type)
    it(`should return correct result for ${amtType} ${sctid}`, () => {
      const resource = JSON.parse(fs.readFileSync(`test/${file}`))
      const result = getRelatedConcepts(resource, {
        coding: [{ system: 'http://snomed.info/sct', code: sctid }],
        type: fhirMedicationTypeFor(filePrefixToAmtType(type)),
      })
      expect(result).toMatchSnapshot()
    })
  }
})

describe('mergeConceptsAndRelationships', () => {
  const concepts1 = {
      concepts: [
        {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '34839011000036106',
              display: 'pethidine',
            },
          ],
          type: 'UPD',
        },
        {
          type: 'UPDSF',
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '34848011000036104',
              display: 'pethidine hydrochloride 100 mg/2 mL injection, ampoule',
            },
          ],
          focused: true,
        },
      ],
      relationships: [
        {
          source: '34848011000036104',
          target: '34839011000036106',
          type: 'is-a',
        },
      ],
    },
    concepts2 = [],
    concepts3 = [
      { concepts: [], relationships: [] },
      {
        concepts: [
          {
            type: 'BPSF',
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: '33964011000036109',
                display:
                  'Pethidine Hydrochloride (DBL) 100 mg/2 mL injection solution, 2 mL ampoule',
              },
            ],
          },
          {
            type: 'BPSF',
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: '921063011000036106',
                display:
                  'Pethidine Hydrochloride (AstraZeneca) 100 mg/2 mL injection solution, 2 mL ampoule',
              },
            ],
          },
        ],
        relationships: [
          {
            source: '33964011000036109',
            target: '34848011000036104',
            type: 'is-a',
          },
          {
            source: '921063011000036106',
            target: '34848011000036104',
            type: 'is-a',
          },
        ],
      },
    ],
    concepts4 = [
      {
        concepts: [
          {
            type: 'UPG',
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: '35098011000036100',
                display:
                  'pethidine hydrochloride 100 mg/2 mL injection, 50 x 2 mL ampoules',
              },
            ],
          },
          {
            type: 'UPG',
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: '922650011000036103',
                display:
                  'pethidine hydrochloride 100 mg/2 mL injection, 10 x 2 mL ampoules',
              },
            ],
          },
          {
            type: 'UPG',
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: '35097011000036101',
                display:
                  'pethidine hydrochloride 100 mg/2 mL injection, 5 x 2 mL ampoules',
              },
            ],
          },
        ],
        relationships: [
          {
            source: '35098011000036100',
            target: '34848011000036104',
            type: 'has-updsf',
          },
          {
            source: '922650011000036103',
            target: '34848011000036104',
            type: 'has-updsf',
          },
          {
            source: '35097011000036101',
            target: '34848011000036104',
            type: 'has-updsf',
          },
        ],
      },
    ]
  it('should merge correctly', () => {
    const result = [ concepts1, ...concepts2, ...concepts3, ...concepts4 ].reduce(
      mergeConceptsAndRelationships,
      emptyConcepts()
    )
    expect(result).toMatchSnapshot()
  })
})

describe('codingToSnomedCode', () => {
  it('should return the correct code', () => {
    const coding = [
      {
        system: 'http://snomed.info/sct',
        code: '813191000168107',
        display: 'Nuromol film-coated tablet, 16, blister pack',
      },
      {
        system: 'https://www.tga.gov.au/australian-register-therapeutic-goods',
        code: '225322',
      },
    ]
    expect(codingToSnomedCode(coding)).toEqual('813191000168107')
  })
})

describe('codingToGroupCode', () => {
  it('should return the correct code', () => {
    const coding = [
      {
        system: 'group',
        code:
          'ad71ccb9ec7758b59d6eccfa729a8ba5bbc2350bcf41068ae75821be9e22fab6',
      },
    ]
    expect(codingToGroupCode(coding)).toEqual(
      'ad71ccb9ec7758b59d6eccfa729a8ba5bbc2350bcf41068ae75821be9e22fab6'
    )
  })
})
