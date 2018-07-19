import { sniffFormat } from '../../src/fhir/restApi.js'

describe('sniffFormat', () => {
  const positives = [
    'application/json',
    'application/json+fhir',
    'application/json;charset=utf-8',
    'application/json+fhir;charset=macintosh',
  ].map(p => ({ headers: { 'content-type': p } }))
  for (const response of positives) {
    it(`should return JSON if Content-Type is "${
      response.headers['content-type']
    }"`, () => expect(sniffFormat(response)).toEqual('json'))
  }

  const negatives = [
    '',
    undefined,
    null,
    'application/xml',
    'image/svg+xml;charset=utf-8',
  ].map(n => ({ headers: { 'content-type': n } }))
  for (const response of negatives) {
    it(`should throw an Error if Content-Type is "${
      response.headers['content-type']
    }"`, () => {
      const sniffFormatOfContentType = () => {
        sniffFormat(response)
      }
      expect(sniffFormatOfContentType).toThrow()
    })
  }
})
