const availableMedParams = [
  'id',
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
]

const availableSubstanceParams = [ 'substance', 'substance-text' ]

export const pathForQuery = query => {
  const medParams = extractSearchParams(query, availableMedParams)
  const queryText = extractQueryText(query)
  if (queryText && queryText[queryText.length - 1] !== ':') {
    medParams.push([ 'text', queryText ])
  }
  const substanceParams = extractSearchParams(query, availableSubstanceParams)
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
    throw new Error('No valid search params found.')
  }
}

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
            .map(match => [ param, match ])
        )
      }
    }
    return result
  }, [])

const extractQueryText = query =>
  query.replace(/[A-Za-z\\-]+:(?:"([^"]*)"|([^"\s]*))/g, '').trim()

const getMedicationParamFor = (param, value) => {
  switch (param) {
    case 'id':
      return `code=http://snomed.info/sct|${value}`
    case 'pbs':
      return `subsidy-code=http://pbs.gov.au/code/item|${value}`
    case 'artg':
      return `code=https://www.tga.gov.au/australian-register-therapeutic-goods|${value}`
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
    case 'text':
      return `_text=${value}`
    default:
      throw new Error(`Unknown Medication parameter encountered: ${param}`)
  }
}

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
