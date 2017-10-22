import { translateToAmt } from './translations.js'

import concepts1 from '../../test/unfilteredGraph-60009011000036108.json'

describe('translateToAmt', () => {
  it('should translate the raw graph as expected', () => {
    const result = translateToAmt(concepts1)
    expect(result).toMatchSnapshot()
  })
})
