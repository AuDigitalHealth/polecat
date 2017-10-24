import React, { Component } from 'react'
import PropTypes from 'prop-types'
import http from 'axios'

import FhirMedication from './FhirMedication.js'
import Loading from './Loading.js'
import Error from './Error.js'
import { sniffFormat } from './fhir/restApi'
import { opOutcomeFromJsonResponse } from './fhir/core.js'

import './css/RemoteFhirMedication.css'

class RemoteFhirMedication extends Component {
  static propTypes = {
    path: PropTypes.string.isRequired,
    query: PropTypes.string,
    fhirServer: PropTypes.string.isRequired,
    viewport: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props)
    this.state = { loading: false, relatedResources: {} }
    this.handleRequireRelatedResources = this.handleRequireRelatedResources.bind(
      this
    )
    this.handleRequireChildBundle = this.handleRequireChildBundle.bind(this)
  }

  updateResource(fhirServer, path, query) {
    this.setState(() => ({ status: 'loading' }))
    return this.getFhirResource(fhirServer, path, query)
      .then(resource => this.setState({ resource, status: 'loaded' }))
      .catch(error => this.handleError(error))
  }

  async getFhirResource(fhirServer, path, query) {
    try {
      const response = await http.get(fhirServer + path + (query || ''), {
        headers: { Accept: 'application/fhir+json, application/json' },
      })
      sniffFormat(response.headers['content-type'])
      return response.data
    } catch (error) {
      if (error.response) this.handleUnsuccessfulResponse(error.response)
      else throw error
    }
  }

  handleUnsuccessfulResponse(response) {
    sniffFormat(response.headers['content-type'])
    const opOutcome = opOutcomeFromJsonResponse(response)
    if (opOutcome) throw opOutcome
    if (response.status === 404) {
      throw new Error(
        `The resource you requested was not found: "${this.props.path}"`
      )
    } else {
      throw new Error(response.statusText || response.status)
    }
  }

  handleLoad(metadata) {
    if (this.props.onLoad) {
      this.props.onLoad(metadata)
    }
  }

  handleRequireRelatedResources(ids) {
    const { fhirServer } = this.props
    for (const id of ids) {
      if (typeof this.state.relatedResources[id] !== 'object') {
        this.getFhirResource(fhirServer, `/Medication/${id}`).then(resource => {
          this.setState(() => ({
            relatedResources: { ...this.state.relatedResources, [id]: resource },
          }))
        })
      }
    }
  }

  // Requests the descendants of a specified concept type, scoped down to a
  // particular resource type, e.g. all descendant UPDSFs (MPUUs) of a specified
  // UPD (MP).
  // Updates an object in state, with resources keyed by resource type.
  handleRequireChildBundle(parentId, resourceType) {
    const { fhirServer } = this.props
    this.getFhirResource(
      fhirServer,
      '/Medication',
      `?parent=Medication/${parentId}&medication-resource-type=${resourceType}`
    ).then(resource =>
      this.setState(prevState => ({
        childBundles: { ...prevState.childBundles, [resourceType]: resource },
      }))
    )
  }

  handleError(error) {
    if (this.props.onError) {
      this.props.onError(error)
    } else {
      this.setState(
        () => ({ error, status: 'error' }),
        () => {
          throw error
        }
      )
    }
  }

  componentWillMount() {
    const { fhirServer, path, query } = this.props
    this.updateResource(fhirServer, path, query)
  }

  componentWillReceiveProps(nextProps) {
    const { fhirServer, path, query } = nextProps
    this.updateResource(fhirServer, path, query)
    this.setState(() => ({ relatedResources: {}, childBundles: {} }))
  }

  render() {
    const { viewport } = this.props
    const { resource, relatedResources, childBundles, status } = this.state

    return (
      <div className='remote-fhir-medication'>
        <Loading loading={status === 'loading'} />
        <FhirMedication
          resource={resource}
          relatedResources={relatedResources}
          childBundles={childBundles}
          viewport={viewport}
          onLoad={this.handleLoad}
          onRequireRelatedResources={this.handleRequireRelatedResources}
          onRequireChildBundle={this.handleRequireChildBundle}
          onError={this.handleError}
        />
      </div>
    )
  }
}

export default RemoteFhirMedication
