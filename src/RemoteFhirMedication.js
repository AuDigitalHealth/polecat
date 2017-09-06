import React, { Component } from 'react'
import PropTypes from 'prop-types'
import http from 'axios'

import FhirMedication from './FhirMedication.js'
import Loading from './Loading.js'
import Error from './Error.js'
import { sniffFormat } from './fhir/restApi'
import { opOutcomeFromJsonResponse } from './fhir/core.js'

class RemoteFhirMedication extends Component {
  static propTypes = {
    path: PropTypes.string.isRequired,
    query: PropTypes.string.isRequired,
    fhirServer: PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props)
    this.state = { relatedResources: {} }
    this.handleRequireRelatedResources = this.handleRequireRelatedResources.bind(
      this
    )
  }

  updateResource(fhirServer, path, query) {
    this.setState(() => ({ status: 'loading' }))
    return this.getSubjectConcept(fhirServer, path, query)
      .then(resource => this.setState({ resource, status: 'loaded' }))
      .catch(error => this.handleError(error))
  }

  async getSubjectConcept(fhirServer, path, query) {
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
        this.getSubjectConcept(
          fhirServer,
          `/Medication/${id}`
        ).then(resource => {
          this.setState(() => ({
            relatedResources: { ...this.state.relatedResources, [id]: resource },
          }))
        })
      }
    }
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
    this.setState(() => ({ relatedResources: {} }))
  }

  render() {
    const { resource, relatedResources, status } = this.state

    return (
      <div className='remote-fhir-medication'>
        <Loading loading={status === 'loading'} />
        <FhirMedication
          resource={resource}
          relatedResources={relatedResources}
          onLoad={this.handleLoad}
          onRequireRelatedResources={this.handleRequireRelatedResources}
          onError={this.handleError}
        />
      </div>
    )
  }
}

export default RemoteFhirMedication
