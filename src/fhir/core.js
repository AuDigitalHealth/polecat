import pick from 'lodash.pick'

import { OpOutcomeError } from '../OpOutcomeError.js'

export const opOutcomeFromJsonResponse = parsed => {
  if (parsed.resourceType !== 'OperationOutcome') return null
  if (parsed.issue.length === 0) return null
  return new OpOutcomeError(
    pick(
      // We only ever look at the first issue described within an
      // OperationOutcome resource.
      parsed.issue[0],
      'severity',
      'code',
      'details',
      'diagnostics',
      'location',
      'expression',
    ),
  )
}
