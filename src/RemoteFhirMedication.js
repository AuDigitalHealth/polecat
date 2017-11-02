import React, { Component } from 'react'
import PropTypes from 'prop-types'
import http from 'axios'
import isEqual from 'lodash.isequal'

import FhirMedication from './FhirMedication.js'
import { sniffFormat } from './fhir/restApi'
import { opOutcomeFromJsonResponse } from './fhir/core.js'

class RemoteFhirMedication extends Component {
  static propTypes = {
    path: PropTypes.string.isRequired,
    query: PropTypes.string,
    fhirServer: PropTypes.string.isRequired,
    onLoadingChange: PropTypes.func,
    onError: PropTypes.func,
  }

  constructor(props) {
    super(props)
    this.state = { loading: false, relatedResources: {} }
    this.handleRequireRelatedResources = this.handleRequireRelatedResources.bind(
      this
    )
    this.handleRequireChildBundle = this.handleRequireChildBundle.bind(this)
    this.handleRequirePackageBundle = this.handleRequirePackageBundle.bind(this)
    this.setLoadingStatus = this.setLoadingStatus.bind(this)
  }

  updateResource(fhirServer, path, query) {
    this.setLoadingStatus(true)
    return this.getFhirResource(fhirServer, path, query)
      .then(resource => this.setState({ resource }))
      .then(() => this.setLoadingStatus(false))
      .catch(error => this.handleError(error))
  }

  async getFhirResource(fhirServer, path, query) {
    let response
    try {
      response = await http.get(fhirServer + path + (query || ''), {
        headers: { Accept: 'application/fhir+json, application/json' },
      })
    } catch (error) {
      if (error.response) this.handleUnsuccessfulResponse(error.response)
      else throw error
    }
    sniffFormat(response.headers['content-type'])
    return response.data
  }

  setLoadingStatus(loading) {
    if (this.props.onLoadingChange) {
      this.props.onLoadingChange(loading)
    }
  }

  handleUnsuccessfulResponse(response) {
    try {
      sniffFormat(response.headers['content-type'])
      const opOutcome = opOutcomeFromJsonResponse(response.data)
      if (opOutcome) throw opOutcome
    } catch (error) {}
    if (response.status === 404) {
      throw new Error(
        `The resource you requested was not found: "${this.props.path}"`
      )
    } else {
      throw new Error(response.statusText || response.status)
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

  // Requests the packages that contain a specified concept type, scoped down to
  // a particular resource type, e.g. all BPG (TPP) packages for a specified
  // BPSF (TPUU).
  // Updates an object in state, with resources keyed by resource type.
  handleRequirePackageBundle(parentId, resourceType) {
    const { fhirServer } = this.props
    this.getFhirResource(
      fhirServer,
      '/Medication',
      `?package-item=Medication/${parentId}&medication-resource-type=${resourceType}`
    ).then(resource =>
      this.setState(prevState => ({
        packageBundles: {
          ...prevState.packageBundles,
          [resourceType]: resource,
        },
      }))
    )
  }

  handleError(error) {
    if (this.props.onError) {
      this.props.onError(error)
    }
  }

  componentWillMount() {
    const { fhirServer, path, query } = this.props
    this.updateResource(fhirServer, path, query)
  }

  componentWillReceiveProps(nextProps) {
    if (!isEqual(this.props, nextProps)) {
      const { fhirServer, path, query } = nextProps
      this.updateResource(fhirServer, path, query)
    }
    // Make sure related resources and bundles don't hang around when changing
    // the subject resource.
    this.setState(() => ({
      relatedResources: {},
      childBundles: {},
      packageBundles: {},
    }))
  }

  render() {
    const {
      resource,
      relatedResources,
      childBundles,
      packageBundles,
    } = this.state

    // This component expects a single child element, which it will pass down to
    // FhirMedication as a child.
    return (
      <FhirMedication
        resource={resource}
        relatedResources={relatedResources}
        childBundles={childBundles}
        packageBundles={packageBundles}
        onRequireRelatedResources={this.handleRequireRelatedResources}
        onRequireChildBundle={this.handleRequireChildBundle}
        onRequirePackageBundle={this.handleRequirePackageBundle}
        onError={this.handleError}
      >
        {this.props.children}
      </FhirMedication>
    )
  }
}

export default RemoteFhirMedication
