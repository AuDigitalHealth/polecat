import { opOutcomeFromJsonResponse } from './core.js'

import opOutcome from '../../test/operationOutcome.json'

describe('opOutcomeFromJsonResponse', () => {
  it('should return a correct OpOutcomeError', () =>
    expect(opOutcomeFromJsonResponse(opOutcome)).toMatchSnapshot())
})
