export const sniffFormat = contentType => {
  // Sniff JSON if the Content-Type header matches:
  // - application/json
  // - application/fhir+json (FHIR STU3)
  if (
    contentType.match(
      /(application\/json|application\/fhir\+json|application\/json\+fhir)/
    )
  ) {
    return 'json'
  } else {
    throw new Error('Could not sniff format as JSON.')
  }
}
