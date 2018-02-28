import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import RemoteFhirMedication from './RemoteFhirMedication.js'
import AmtProductModel from './AmtProductModel.js'
import Search from './Search.js'
import VisibilityFilter from './VisibilityFilter.js'
import SourceCodeSystem from './SourceCodeSystem.js'
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

  handleError(error) {
    this.setState(() => ({ error, loading: false }))
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

  componentDidCatch(error) {
    this.setState({ error, loading: false })
    throw error
  }

  render() {
    const { resourceType, id, query, viewport } = this.props
    const {
      loading,
      subjectConcept: {
        type: subjectConceptType,
        status: subjectConceptStatus,
        sourceCodeSystemUri,
        sourceCodeSystemVersion,
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
            viewport={viewport}
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
        {sourceCodeSystemUri && sourceCodeSystemVersion ? (
          <SourceCodeSystem
            uri={sourceCodeSystemUri}
            version={sourceCodeSystemVersion}
          />
        ) : null}
      </div>
    )
  }
}

// Map config from global state into props of this component.
export default connect(config => ({ config }))(AmtBrowser)
