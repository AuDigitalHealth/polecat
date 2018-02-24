import {
  pathForQuery,
  queryFromSearchObject,
  paramsFromQuery,
} from '../../src/fhir/search.js'

describe('pathForQuery', () => {
  const expectedResults = {
    // Basic text search
    something:
      '/Medication?status=active&_text=something&_summary=true&_count=20',
    // SCTID
    'id:61428011000036109':
      '/Medication?code=http://snomed.info/sct|61428011000036109&_summary=true&_count=20',
    // Concept type
    'type:CTPP':
      '/Medication?medication-resource-type=BPGC&status=active&_summary=true&_count=20',
    // Code should not be combined with other parameters
    'varicella id:959031000168106':
      '/Medication?code=http://snomed.info/sct|959031000168106&_summary=true&_count=20',
    'id:959031000168106 varicella':
      '/Medication?code=http://snomed.info/sct|959031000168106&_summary=true&_count=20',
    // Empty value should be omitted
    'phenylephrine id:':
      '/Medication?status=active&_text=phenylephrine&_summary=true&_count=20',
    // PBS code
    'pbs:4313B':
      '/Medication?subsidy-code=http://pbs.gov.au/code/item|4313B&status=active&_summary=true&_count=20',
    // ARTG ID
    'artg:123270':
      '/Medication?code=https://www.tga.gov.au/australian-register-therapeutic-goods|123270&status=active&_summary=true&_count=20',
    // Brand
    'brand:53259011000036106':
      '/Medication?brand=http://snomed.info/sct|53259011000036106&status=active&_summary=true&_count=20',
    'brand-text:augmentin':
      '/Medication?brand:text=augmentin&status=active&_summary=true&_count=20',
    // Use of quotes
    'brand-text:"panadeine forte"':
      '/Medication?brand:text=panadeine forte&status=active&_summary=true&_count=20',
    // Container
    'container:51915011000036106':
      '/Medication?container=http://snomed.info/sct|51915011000036106&status=active&_summary=true&_count=20',
    'container-text:poison':
      '/Medication?container:text=poison&status=active&_summary=true&_count=20',
    // Form
    'form:154011000036109':
      '/Medication?form=http://snomed.info/sct|154011000036109&status=active&_summary=true&_count=20',
    'form-text:tablet':
      '/Medication?form:text=tablet&status=active&_summary=true&_count=20',
    'not-form:154011000036109':
      '/Medication?form:not=http://snomed.info/sct|154011000036109&status=active&_summary=true&_count=20',
    // Substance
    'substance:2442011000036104':
      '/Substance?code=http://snomed.info/sct|2442011000036104&_summary=true&_count=20',
    'substance-text:para,ibu':
      '/Substance?_text=para,ibu&_summary=true&_count=20',
    // Parent
    'parent:931803011000036105':
      '/Medication?parent=Medication/931803011000036105&status=active&_summary=true&_count=20',
    'parent:931803011000036105 parent:77446011000036105':
      '/Medication?parent=Medication/931803011000036105&parent=Medication/77446011000036105&status=active&_summary=true&_count=20',
    'parent-text:paracetamol':
      '/Medication?parent:text=paracetamol&status=active&_summary=true&_count=20',
    // Ancestor
    'ancestor:931803011000036105':
      '/Medication?ancestor=Medication/931803011000036105&status=active&_summary=true&_count=20',
    'ancestor:931803011000036105 ancestor:77446011000036105':
      '/Medication?ancestor=Medication/931803011000036105&ancestor=Medication/77446011000036105&status=active&_summary=true&_count=20',
    'ancestor-text:paracetamol':
      '/Medication?ancestor:text=paracetamol&status=active&_summary=true&_count=20',
    // Package
    'package:54112011000036105':
      '/Medication?package-item=Medication/54112011000036105&status=active&_summary=true&_count=20',
    'not-package:6140011000036103':
      '/Medication?package-item:not=Medication/6140011000036103&status=active&_summary=true&_count=20',
    'package-text:nexium':
      '/Medication?package-item:text=nexium&status=active&_summary=true&_count=20',
    // Ingredient
    'ingredient:1978011000036103 ingredient:2442011000036104 not-ingredient:2525011000036101':
      '/Medication?ingredient=Substance/1978011000036103&ingredient=Substance/2442011000036104&ingredient:not=Substance/2525011000036101&status=active&_summary=true&_count=20',
    'ingredient-text:paracetamol ingredient-text:codeine':
      '/Medication?ingredient:text=paracetamol&ingredient:text=codeine&status=active&_summary=true&_count=20',
    // Combination of multiple different search parameters
    'parent:931803011000036105 spray':
      '/Medication?parent=Medication/931803011000036105&status=active&_text=spray&_summary=true&_count=20',
    'spray parent:931803011000036105':
      '/Medication?parent=Medication/931803011000036105&status=active&_text=spray&_summary=true&_count=20',
    // Code and display
    'parent:21433011000036107|paracetamol':
      '/Medication?parent=Medication/21433011000036107&status=active&_summary=true&_count=20',
    // Quoted strings
    'ingredient:"73620011000036103|death adder antivenom"':
      '/Medication?ingredient=Substance/73620011000036103&status=active&_summary=true&_count=20',
    'ingredient:"73620011000036103|death adder antivenom" adder':
      '/Medication?ingredient=Substance/73620011000036103&status=active&_text=adder&_summary=true&_count=20',
  }

  for (const query in expectedResults) {
    it(`should return correct result for ${query}`, () => {
      expect(pathForQuery(query)).toEqual(expectedResults[query])
    })
  }
})

describe('queryFromSearchObject', () => {
  const expectedResults = [
    [
      { ingredient: '73620011000036103|death adder antivenom', text: 'adder' },
      'ingredient:"73620011000036103|death adder antivenom" adder',
    ],
    [
      {
        container: [
          {
            system: 'http://snomed.info/sct',
            code: '51915011000036106',
            display: 'poison bottle',
          },
        ],
      },
      'container:"51915011000036106|poison bottle"',
    ],
    [
      {
        type: 'TPUU',
        ancestor: '21885011000036105|ibuprofen',
        status: 'active',
      },
      'type:TPUU ancestor:21885011000036105|ibuprofen',
    ],
  ]

  for (const result of expectedResults) {
    it(`should return correct query for ${JSON.stringify(result[0])}`, () => {
      expect(queryFromSearchObject(result[0])).toEqual(result[1])
    })
  }
})

describe('paramsFromQuery', () => {
  const inputs = [
    'type:TPUU status:active,entered-in-error ancestor:"23628011000036109|paracetamol 500 mg tablet"',
    'type:TPUU ancestor:21821011000036104|codeine',
    '',
    'soma',
  ]
  for (const input of inputs) {
    it(`should return correct object for "${input}"`, () => {
      expect(paramsFromQuery(input)).toMatchSnapshot()
    })
  }
})
