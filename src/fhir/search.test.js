import { pathForQuery } from './search.js'

describe('pathForQuery', () => {
  const expectedResults = {
    // Basic text search
    something: '/Medication?_text=something&_summary=true&_count=20',
    // SCTID
    'id:61428011000036109':
      '/Medication?code=http://snomed.info/sct|61428011000036109&_summary=true&_count=20',
    // Combination of multiple search types
    'varicella id:959031000168106':
      '/Medication?code=http://snomed.info/sct|959031000168106&_text=varicella&_summary=true&_count=20',
    'id:959031000168106 varicella':
      '/Medication?code=http://snomed.info/sct|959031000168106&_text=varicella&_summary=true&_count=20',
    // Empty value should be omitted
    'phenylephrine id:':
      '/Medication?_text=phenylephrine&_summary=true&_count=20',
    // PBS code
    'pbs:4313B':
      '/Medication?subsidy-code=http://pbs.gov.au/code/item|4313B&_summary=true&_count=20',
    // ARTG ID
    'artg:123270':
      '/Medication?code=https://www.tga.gov.au/australian-register-therapeutic-goods|123270&_summary=true&_count=20',
    // Brand
    'brand:53259011000036106':
      '/Medication?brand=http://snomed.info/sct|53259011000036106&_summary=true&_count=20',
    'brand-text:augmentin':
      '/Medication?brand:text=augmentin&_summary=true&_count=20',
    // Use of quotes
    'brand-text:"panadeine forte"':
      '/Medication?brand:text=panadeine forte&_summary=true&_count=20',
    // Container
    'container:51915011000036106':
      '/Medication?container=http://snomed.info/sct|51915011000036106&_summary=true&_count=20',
    'container-text:poison':
      '/Medication?container:text=poison&_summary=true&_count=20',
    // Form
    'form:154011000036109':
      '/Medication?form=http://snomed.info/sct|154011000036109&_summary=true&_count=20',
    'form-text:tablet': '/Medication?form:text=tablet&_summary=true&_count=20',
    'not-form:154011000036109':
      '/Medication?form:not=http://snomed.info/sct|154011000036109&_summary=true&_count=20',
    // Substance
    'substance:2442011000036104':
      '/Substance?code=http://snomed.info/sct|2442011000036104&_summary=true&_count=20',
    'substance-text:para,ibu':
      '/Substance?_text=para,ibu&_summary=true&_count=20',
    // Parent
    'parent:931803011000036105':
      '/Medication?parent=Medication/931803011000036105&_summary=true&_count=20',
    'parent:931803011000036105,33623011000036103':
      '/Medication?parent=Medication/931803011000036105,Medication/33623011000036103&_summary=true&_count=20',
    'parent:931803011000036105,33623011000036103 parent:77446011000036105':
      '/Medication?parent=Medication/931803011000036105,Medication/33623011000036103&parent=Medication/77446011000036105&_summary=true&_count=20',
    'parent-text:paracetamol':
      '/Medication?parent:text=paracetamol&_summary=true&_count=20',
    // Ingredient
    'ingredient:1978011000036103 ingredient:2442011000036104 ingredient-not:2525011000036101':
      '/Medication?ingredient=Substance/1978011000036103&ingredient=Substance/2442011000036104&ingredient:not=Substance/2525011000036101&_summary=true&_count=20',
    'ingredient-text:paracetamol ingredient-text:codeine':
      '/Medication?ingredient:text=paracetamol&ingredient:text=codeine&_summary=true&_count=20',
  }

  for (const query in expectedResults) {
    it(`should return correct result for ${query}`, () => {
      expect(pathForQuery(query)).toEqual(expectedResults[query])
    })
  }
})
