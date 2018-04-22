export class OpOutcomeError extends Error {
  constructor(issue) {
    const message =
      issue.details && issue.details.display
        ? issue.details.display
        : issue.diagnostics
    super(message)
    this.name = 'OpOutcomeError'
    this.issue = issue
    Error.captureStackTrace(this, this.constructor.name)
  }
}
