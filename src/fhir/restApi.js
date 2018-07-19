export const sniffFormat = response => {
  if (!response || !response.headers)
    throw new Error('Could not sniff format as JSON.')
  // Sniff JSON if the Content-Type header matches:
  // - application/json
  // - application/fhir+json (FHIR STU3)
  if (
    response.headers['content-type'].match(
      /(application\/json|application\/fhir\+json|application\/json\+fhir)/,
    )
  ) {
    return 'json'
  } else {
    throw new Error('Could not sniff format as JSON.')
  }
}
