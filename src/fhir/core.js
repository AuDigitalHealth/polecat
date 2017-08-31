import pick from 'lodash.pick'

import { OpOutcomeError } from '../errorTypes.js'

export const opOutcomeFromJsonResponse = response => {
  if (response.data.resourceType !== 'OperationOutcome') return null
  if (response.data.issue.length === 0) return null
  return new OpOutcomeError(
    pick(
      // We only ever look at the first issue described within an
      // OperationOutcome resource.
      response.data.issue[0],
      'severity',
      'code',
      'details',
      'diagnostics',
      'location',
      'expression'
    )
  )
}
