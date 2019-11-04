import pick from 'lodash.pick'

import {
  fhirMedicationTypeFor,
  codingToSnomedCode,
  codingToSnomedDisplay,
} from './medication.js'

const availableMedParams = [
  'id',
  'type',
  'status',
  'pbs',
  'artg',
  'brand',
  'brand-text',
  'container',
  'container-text',
  'form',
  'not-form',
  'form-text',
  'parent',
  'parent-text',
  'ancestor',
  'ancestor-text',
  'package',
  'not-package',
  'package-text',
  'ingredient',
  'not-ingredient',
  'ingredient-text',
  'modified-from',
  'modified-to',
]

const availableSubstanceParams = ['substance', 'substance-text']

// Translates a tagged search string into a valid GET URL (path only) which will
// execute a search on the FHIR server. Returns false if there is no searchable
// information in the query, e.g. `brand:`.
export const pathForQuery = (query, options) => {
  const params = paramsFromQuery(query)
  return pathFromParams(params.medParams, params.substanceParams, options)
}

// Extracts all parameters from a search query and returns an object: `{
// medParams, substanceParams, allParams }`.
export const paramsFromQuery = query => {
  let medParams = extractSearchParams(query, availableMedParams)
  const queryText = extractQueryText(query)
  const substanceParams = extractSearchParams(query, availableSubstanceParams)
  // If there are no substance params, and no status parameter is present in the
  // query, default it to all statuses.
  if (substanceParams.length === 0) medParams = applyDefaultStatus(medParams)
  // If there is query text present within the query, add a `text` parameter to
  // the Medication params. Don't add a text parameter if it is an ID search.
  if (
    queryText &&
    !searchIncludesParam(medParams, 'id') &&
    queryText[queryText.length - 1] !== ':'
  ) {
    medParams.push(['text', queryText])
  }
  return {
    medParams,
    substanceParams,
    allParams: medParams.concat(substanceParams),
  }
}

// Translates a search object, with available search parameters as keys, into a
// tagged search string.
export const queryFromSearchObject = search => {
  const params = stripDefaultStatusFromSearch(
    filterSearchObject(
      search,
      availableMedParams.concat(availableSubstanceParams),
    ),
  )
  let query = params.map(p => `${p[0]}:${p[1]}`).join(' ')
  if (search.text) query += query ? ` ${search.text}` : search.text
  return query
}

const filterSearchObject = (search, params) => {
  const searchParams = pick(search, params)
  let result = Object.keys(searchParams).map(k => [k, searchParams[k]])
  // Filter any params with null, undefined or empty string values.
  result = result.filter(param => param[1])
  // Convert any params that can be SNOMED codes or coding objects.
  result = result.map(param => {
    if (
      [
        'brand',
        'container',
        'form',
        'not-form',
        'package',
        'not-package',
        'ingredient',
        'not-ingredient',
        'parent',
        'ancestor',
      ].includes(param[0])
    ) {
      return [param[0], codeFromCodeOrSnomedCoding(param[1])]
    } else {
      return param
    }
  })
  // Quote any values that contain spaces.
  return result.map(param => {
    if (param[1].match(/\s/)) {
      return [param[0], `"${param[1]}"`]
    }
    return param
  })
}

const pathFromParams = (
  medParams,
  substanceParams,
  { resultCount = 100 } = {},
) => {
  if (medParams.length > 0 && substanceParams.length > 0) {
    throw new Error('Cannot have both Medication and Substance search params.')
  } else if (medParams.length > 0) {
    const getParams = medParams
      .map(p => getMedicationParamFor(p[0], p[1]))
      .join('&')
    return `/Medication?${getParams}&_summary=true&_count=${resultCount}`
  } else if (substanceParams.length > 0) {
    const getParams = substanceParams
      .map(p => getSubstanceParamFor(p[0], p[1]))
      .join('&')
    return `/Substance?${getParams}&_summary=true&_count=${resultCount}`
  } else {
    return false
  }
}

// Extract all tagged search parameters from the string (subject to the supplied
// `params` whitelist), and return them as an a array of `[ param, value ]`
// tuples.
const extractSearchParams = (query, params) =>
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
            .map(match => [param, match]),
        )
      }
    }
    return result
  }, [])

// Remove any tagged parameters, leaving only the text query component.
const extractQueryText = query =>
  query.replace(/[A-Za-z\\-]+:(?:"([^"]*)"|([^"\s]*))/g, '').trim()

// Defaults the `status` parameter within a search object when it has not been
// specified.
const applyDefaultStatus = search =>
  searchIncludesParam(search, 'status')
    ? search
    : search.concat([['status', 'active']])
// const applyDefaultStatus = search => search

// Omits the default `status` value when constructing a path from a search
// object.
const stripDefaultStatusFromSearch = search =>
  search.filter(p => !(p[0] === 'status' && p[1] === 'active'))
// const stripDefaultStatusFromSearch = search => search

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
    case 'status':
      return `status=${value}`
    case 'pbs':
      return `subsidy-code=http://pbs.gov.au/code/item|${value}`
    case 'artg':
      return `code=https://www.tga.gov.au/australian-register-therapeutic-goods|${value}`
    case 'brand':
      return `brand=http://snomed.info/sct|${value}`
    case 'brand-text':
      return `brand:text=${value}`
    case 'container':
      return `container=http://snomed.info/sct|${codeFromCodeDisplay(value)}`
    case 'container-text':
      return `container:text=${value}`
    case 'form':
      return `form=http://snomed.info/sct|${value}`
    case 'form-text':
      return `form:text=${value}`
    case 'not-form':
      return `form:not=http://snomed.info/sct|${value}`
    case 'parent':
      return `parent=Medication/${codeFromCodeDisplay(value)}`
    case 'parent-text':
      return `parent:text=${value}`
    case 'ancestor':
      return `ancestor=Medication/${codeFromCodeDisplay(value)}`
    case 'ancestor-text':
      return `ancestor:text=${value}`
    case 'package':
      return `package-item=Medication/${codeFromCodeDisplay(value)}`
    case 'not-package':
      return `package-item:not=Medication/${codeFromCodeDisplay(value)}`
    case 'package-text':
      return `package-item:text=${value}`
    case 'ingredient':
      return `ingredient=Substance/${codeFromCodeDisplay(value)}`
    case 'not-ingredient':
      return `ingredient:not=Substance/${codeFromCodeDisplay(value)}`
    case 'ingredient-text':
      return `ingredient:text=${value}`
    case 'modified-from':
      return `last-modified=ge${value}`
    case 'modified-to':
      return `last-modified=le${value}`
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

const codeFromCodeOrSnomedCoding = codeOrSnomedCoding => {
  if (typeof codeOrSnomedCoding === 'string') {
    return codeOrSnomedCoding
  } else {
    return codeDisplayFromCoding(codeOrSnomedCoding)
  }
}

export const codeDisplayFromCoding = coding =>
  `${codingToSnomedCode(coding)}|${codingToSnomedDisplay(coding)}`
export const codeFromCodeDisplay = codeDisplay => codeDisplay.split('|')[0]
export const displayFromCodeDisplay = codeDisplay => codeDisplay.split('|')[1]
export const displayOrCoding = codeDisplay =>
  displayFromCodeDisplay(codeDisplay)
    ? displayFromCodeDisplay(codeDisplay)
    : codeFromCodeDisplay(codeDisplay)

const searchIncludesParam = (search, param) =>
  search.find(p => p[0] === param) !== undefined
