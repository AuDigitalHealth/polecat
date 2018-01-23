import React, { Component } from 'react'
import PropTypes from 'prop-types'

import RemoteFhirMedication from './RemoteFhirMedication.js'
import AmtProductModel from './AmtProductModel.js'
import Search from './Search.js'
import Loading from './Loading.js'
import SourceCodeSystem from './SourceCodeSystem.js'
import ErrorMessage from './ErrorMessage.js'

import './css/AmtBrowser.css'

class AmtBrowser extends Component {
  static propTypes = {
    resourceType: PropTypes.oneOf(['Medication', 'Substance']),
    id: PropTypes.string,
    query: PropTypes.string,
    viewport: PropTypes.object.isRequired,
    config: PropTypes.object,
    onLoadSubjectConcept: PropTypes.func,
  }
  static defaultProps = {
    config: { fhirServer: 'https://medserve.online/fhir' },
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
    if (concept)
      this.setState(() => ({
        sourceCodeSystemUri: concept.sourceCodeSystemUri,
        sourceCodeSystemVersion: concept.sourceCodeSystemVersion,
      }))
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
  }

  render() {
    const { resourceType, id, query, viewport, config } = this.props
    const {
      loading,
      sourceCodeSystemUri,
      sourceCodeSystemVersion,
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
            {...config}
          >
            <AmtProductModel viewport={viewport} />
          </RemoteFhirMedication>
        ) : null}
        <Search
          query={query}
          fhirServer={config.fhirServer}
          onError={this.handleError}
          focusUponMount
        />
        <Loading loading={loading} />
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

export default AmtBrowser
