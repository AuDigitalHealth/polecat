import pick from 'lodash.pick'

import { fhirMedicationTypeFor } from './medication.js'

export const availableMedParams = [
  'id',
  'type',
  'pbs',
  'artg',
  'brand',
  'brand-text',
  'container',
  'container-text',
  'form',
  'form-text',
  'not-form',
  'parent',
  'parent-text',
  'package',
  'package-text',
  'package-not',
  'ingredient',
  'ingredient-not',
  'ingredient-text',
]

export const availableSubstanceParams = [ 'substance', 'substance-text' ]

// Translates a tagged search string into a valid GET URL (path only) which will
// execute a search on the FHIR server. Returns false if there is no searchable
// information in the query, e.g. `brand:`.
export const pathForQuery = query => {
  const medParams = extractSearchParams(query, availableMedParams)
  const queryText = extractQueryText(query)
  if (queryText && queryText[queryText.length - 1] !== ':') {
    medParams.push([ 'text', queryText ])
  }
  const substanceParams = extractSearchParams(query, availableSubstanceParams)
  return pathFromParams(medParams, substanceParams)
}

// Translates a search object, with available search parameters as keys, into a
// tagged search string.
export const queryFromSearchObject = search => {
  const params = filterSearchObject(
    search,
    availableMedParams.concat(availableSubstanceParams)
  )
  let query = params.map(p => `${p[0]}:${p[1]}`).join(' ')
  if (search.text) query += query ? ` ${search.text}` : search.text
  return query
}

const filterSearchObject = (search, params) => {
  const result = Object.entries(pick(search, params))
  // Filter any params with null, undefined or empty string values.
  return result.filter(param => param[1])
}

const pathFromParams = (medParams, substanceParams) => {
  if (medParams.length > 0 && substanceParams.length > 0) {
    throw new Error('Cannot have both Medication and Substance search params.')
  } else if (medParams.length > 0) {
    const getParams = medParams
      .map(p => getMedicationParamFor(p[0], p[1]))
      .join('&')
    return `/Medication?${getParams}&_summary=true&_count=20`
  } else if (substanceParams.length > 0) {
    const getParams = substanceParams
      .map(p => getSubstanceParamFor(p[0], p[1]))
      .join('&')
    return `/Substance?${getParams}&_summary=true&_count=20`
  } else {
    return false
  }
}

// Extract all tagged search parameters from the string (subject to the supplied
// `params` whitelist), and return them as an a array of `[ param, value ]`
// tuples.
export const extractSearchParams = (query, params) =>
  params.reduce((result, param) => {
    const pattern = RegExp(`(?:^|\\s)${param}:(?:"([^"]+)"|([^"\\s]+))`, 'g')
    let match
    // eslint-disable-next-line no-cond-assign
    while ((match = pattern.exec(query))) {
      if (match) {
        result = result.concat(
          match
            .slice(1)
            .filter(x => x)
            .map(match => [ param, match ])
        )
      }
    }
    return result
  }, [])

// Remove any tagged parameters, leaving only the text query component.
export const extractQueryText = query =>
  query.replace(/[A-Za-z\\-]+:(?:"([^"]*)"|([^"\s]*))/g, '').trim()

// Return the GET parameter for a specified Medication search tag and value.
const getMedicationParamFor = (param, value) => {
  switch (param) {
    case 'id':
      return `code=http://snomed.info/sct|${value}`
    case 'type':
      return `medication-resource-type=${value
        .split(',')
        .map(v => fhirMedicationTypeFor(v))
        .join(',')}`
    case 'pbs':
      return `subsidy-code=http://pbs.gov.au/code/item|${value}`
    case 'artg':
      return `code=https://www.tga.gov.au/australian-register-therapeutic-goods|${
        value
      }`
    case 'brand':
      return `brand=http://snomed.info/sct|${value}`
    case 'brand-text':
      return `brand:text=${value}`
    case 'container':
      return `container=http://snomed.info/sct|${value}`
    case 'container-text':
      return `container:text=${value}`
    case 'form':
      return `form=http://snomed.info/sct|${value}`
    case 'form-text':
      return `form:text=${value}`
    case 'not-form':
      return `form:not=http://snomed.info/sct|${value}`
    case 'parent':
      return `parent=${value
        .split(',')
        .map(id => `Medication/${id}`)
        .join(',')}`
    case 'parent-text':
      return `parent:text=${value}`
    case 'package':
      return `package-item=Medication/${value}`
    case 'package-text':
      return `package-item:text=${value}`
    case 'package-not':
      return `package-item:not=Medication/${value}`
    case 'ingredient':
      return `ingredient=Substance/${value}`
    case 'ingredient-not':
      return `ingredient:not=Substance/${value}`
    case 'ingredient-text':
      return `ingredient:text=${value}`
    case 'text':
      return `_text=${value}`
    default:
      throw new Error(`Unknown Medication parameter encountered: ${param}`)
  }
}

// Return the GET parameter for a specified Substance search tag and value.
const getSubstanceParamFor = (param, value) => {
  switch (param) {
    case 'substance':
      return `code=http://snomed.info/sct|${value}`
    case 'substance-text':
      return `_text=${value}`
    default:
      throw new Error(`Unknown Substance parameter encountered: ${param}`)
  }
}
