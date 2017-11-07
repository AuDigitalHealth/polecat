import { sniffFormat } from './restApi.js'

describe('sniffFormat', () => {
  const positives = [
    'application/json',
    'application/json+fhir',
    'application/json;charset=utf-8',
    'application/json+fhir;charset=macintosh',
  ]
  for (const contentType of positives) {
    it(`should return JSON if Content-Type is ${contentType}`, () =>
      expect(sniffFormat(contentType)).toEqual('json'))
  }

  const negatives = [
    '',
    undefined,
    null,
    'application/xml',
    'image/svg+xml;charset=utf-8',
  ]
  for (const contentType of negatives) {
    it('should throw an Error if Content-Type is not JSON', () => {
      const sniffFormatOfContentType = () => {
        sniffFormat(contentType)
      }
      expect(sniffFormatOfContentType).toThrow()
    })
  }
})
