import { translateToAmt } from '../../src/graph/translations.js'

import concepts1 from '../fixtures/unfilteredGraph-60009011000036108.json'
import concepts2 from '../fixtures/unfilteredGraph-60473011000036105.json'
import concepts3 from '../fixtures/unfilteredGraph-37732011000036107.json'
import concepts4 from '../fixtures/unfilteredGraph-60241011000036109.json'
import concepts5 from '../fixtures/unfilteredGraph-61765011000036100.json'
import concepts6 from '../fixtures/unfilteredGraph-44924011000036104.json'
import concepts7 from '../fixtures/unfilteredGraph-813241000168107.json'

describe('translateToAmt', () => {
  it('should translate the raw graph as expected', () => {
    const result = translateToAmt(concepts1)
    expect(result).toMatchSnapshot()
  })

  it('should apply the substance filter correctly', () => {
    const result = translateToAmt(concepts3, { filters: ['substance'] })
    expect(result).toMatchSnapshot()
  })

  it('should apply the "Parent of MP" filter correctly', () => {
    const result = translateToAmt(concepts2, { filters: ['parent-of-mp'] })
    expect(result).toMatchSnapshot()
  })

  it('should apply the MP filter correctly', () => {
    const result = translateToAmt(concepts1, { filters: ['mp'] })
    expect(result).toMatchSnapshot()
  })

  it('should apply the "Parent of MPUU" filter', () => {
    const result = translateToAmt(concepts2, { filters: ['parent-of-mpuu'] })
    expect(result).toMatchSnapshot()
  })

  it('should apply the MPUU filter correctly', () => {
    const result = translateToAmt(concepts1, { filters: ['mpuu'] })
    expect(result).toMatchSnapshot()
  })

  it('should apply the "Parent of MPP" filter correctly', () => {
    const result = translateToAmt(concepts2, { filters: ['parent-of-mpp'] })
    expect(result).toMatchSnapshot()
  })

  it('should apply the MPP filter correctly', () => {
    const result = translateToAmt(concepts1, { filters: ['mpp'] })
    expect(result).toMatchSnapshot()
  })

  it('should apply the TP filter correctly', () => {
    const result = translateToAmt(concepts1, { filters: ['tp'] })
    expect(result).toMatchSnapshot()
  })

  it('should apply the TPUU filter correctly', () => {
    const result = translateToAmt(concepts1, { filters: ['tpuu'] })
    expect(result).toMatchSnapshot()
  })

  it('should apply the TPP filter correctly', () => {
    const result = translateToAmt(concepts1, { filters: ['tpp'] })
    expect(result).toMatchSnapshot()
  })

  it('should apply the CTPP filter correctly', () => {
    const result = translateToAmt(concepts7, { filters: ['ctpp'] })
    expect(result).toMatchSnapshot()
  })

  it('should apply the component packs filter correctly', () => {
    const result = translateToAmt(concepts4, { filters: ['component-pack'] })
    expect(result).toMatchSnapshot()
  })

  it('should apply the "is replaced by" filter correctly', () => {
    const result = translateToAmt(concepts5, { filters: ['replaced-by'] })
    expect(result).toMatchSnapshot()
  })

  it('should apply the "replaces" filter correctly', () => {
    const result = translateToAmt(concepts6, { filters: ['replaces'] })
    expect(result).toMatchSnapshot()
  })

  it('should apply the "not replaced by" filter correctly', () => {
    const result = translateToAmt(concepts5, { filters: ['not-replaced-by'] })
    expect(result).toMatchSnapshot()
  })
})
