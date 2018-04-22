import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import Raven from 'raven-js'

import RemoteFhirMedication from './RemoteFhirMedication.js'
import AmtProductModel from './AmtProductModel.js'
import Search from './Search.js'
import VisibilityFilter from './VisibilityFilter.js'
import SubjectConceptDetails from './SubjectConceptDetails.js'
import ErrorMessage from './ErrorMessage.js'
import { amtConceptTypeFor } from './fhir/medication.js'

import './css/AmtBrowser.css'

export class AmtBrowser extends Component {
  static propTypes = {
    resourceType: PropTypes.oneOf(['Medication', 'Substance']),
    id: PropTypes.string,
    query: PropTypes.string,
    viewport: PropTypes.object.isRequired,
    config: PropTypes.object,
    onLoadSubjectConcept: PropTypes.func,
  }
  static defaultProps = {
    resourceType: 'Medication',
  }

  constructor(props) {
    super(props)
    this.state = { loading: false }
    this.handleLoadingChange = this.handleLoadingChange.bind(this)
    this.handleLoadSubjectConcept = this.handleLoadSubjectConcept.bind(this)
    this.handleError = this.handleError.bind(this)
  }

  handleLoadingChange(loading) {
    this.setState(() => ({ loading }))
  }

  handleLoadSubjectConcept(concept) {
    const { onLoadSubjectConcept } = this.props
    if (concept) this.setState(() => ({ subjectConcept: concept }))
    if (onLoadSubjectConcept) onLoadSubjectConcept(concept)
  }

  // This is where errors that are explicitly caught land, through calls to this
  // handler by downstream components.
  handleError(error) {
    this.setState(() => ({ error, loading: false }))
    Raven.captureException(error)
  }

  reset() {
    this.setState(() => ({ loading: false, error: null }))
  }

  componentWillReceiveProps(nextProps) {
    const { resourceType, id, query } = nextProps
    if (!id && !query) return
    // Reset the error state when the location changes.
    if (
      this.props.resourceType !== resourceType ||
      this.props.id !== id ||
      this.props.query !== query
    ) {
      this.reset()
    }
  }

  // This is where uncaught exceptions land.
  componentDidCatch(error) {
    this.setState({ error, loading: false })
    Raven.captureException(error)
  }

  render() {
    const { resourceType, id, query, viewport } = this.props
    const {
      loading,
      subjectConcept,
      subjectConcept: {
        coding,
        type: subjectConceptType,
        status: subjectConceptStatus,
      } = {},
      error,
    } = this.state
    return (
      <div
        className="amt-browser"
        style={{ width: viewport.width, height: viewport.height }}
      >
        {error ? (
          <div className="errors">
            <ErrorMessage error={error} />
          </div>
        ) : null}
        {id ? (
          <RemoteFhirMedication
            resourceType={resourceType}
            id={id}
            onLoadingChange={this.handleLoadingChange}
            onLoadSubjectConcept={this.handleLoadSubjectConcept}
            onError={this.handleError}
          >
            <AmtProductModel viewport={viewport} />
          </RemoteFhirMedication>
        ) : null}
        <Search
          query={query}
          loading={loading}
          focusUponMount
          onError={this.handleError}
          onLoadingChange={this.handleLoadingChange}
        />
        {subjectConceptType && subjectConceptStatus ? (
          <VisibilityFilter
            subjectConceptType={amtConceptTypeFor(subjectConceptType)}
            subjectConceptStatus={subjectConceptStatus}
          />
        ) : null}
        {coding ? <SubjectConceptDetails {...subjectConcept} /> : null}
      </div>
    )
  }
}

// Map config from global state into props of this component.
export default connect(config => ({ config }))(AmtBrowser)
