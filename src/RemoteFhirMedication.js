import React, { Component } from 'react'
import PropTypes from 'prop-types'
import http, { CancelToken } from 'axios'

import FhirMedication from './FhirMedication.js'
import { sniffFormat } from './fhir/restApi'
import { opOutcomeFromJsonResponse } from './fhir/core.js'

class RemoteFhirMedication extends Component {
  static propTypes = {
    resourceType: PropTypes.oneOf(['Medication', 'Substance']),
    id: PropTypes.string.isRequired,
    fhirServer: PropTypes.string.isRequired,
    children: PropTypes.any.isRequired,
    onLoadingChange: PropTypes.func,
    onLoadSubjectConcept: PropTypes.func,
    onError: PropTypes.func,
  }
  static defaultProps = {
    resourceType: 'Medication',
  }

  constructor(props) {
    super(props)
    this.state = { loading: false, relatedResources: {} }
    this.handleRequireRelatedResources = this.handleRequireRelatedResources.bind(
      this,
    )
    this.handleRequireChildBundle = this.handleRequireChildBundle.bind(this)
    this.handleRequirePackageBundle = this.handleRequirePackageBundle.bind(this)
    this.handleRequireContainsIngredientBundle = this.handleRequireContainsIngredientBundle.bind(
      this,
    )
    this.handleLoadSubjectConcept = this.handleLoadSubjectConcept.bind(this)
    this.setLoadingStatus = this.setLoadingStatus.bind(this)
  }

  updateResource(fhirServer, resourceType, id) {
    this.setLoadingStatus(true)
    return this.getFhirResource(fhirServer, `/${resourceType}/${id}`)
      .then(resource => this.setState({ resource, cancelRequest: null }))
      .then(() => this.setLoadingStatus(false))
      .catch(error => this.handleError(error))
      .then(() => this.setLoadingStatus(false))
  }

  async getFhirResource(fhirServer, path, query) {
    let response, newCancelRequest
    try {
      const cancelToken = new CancelToken(function executor(c) {
        newCancelRequest = c
      })
      this.setState(() => ({ cancelRequest: newCancelRequest }))
      response = await http.get(fhirServer + path + (query || ''), {
        headers: { Accept: 'application/fhir+json' },
        cancelToken,
        timeout: 10000,
      })
    } catch (error) {
      if (error.response) this.handleUnsuccessfulResponse(error.response)
      else throw error
    }
    sniffFormat(response.headers['content-type'])
    return response.data
  }

  setLoadingStatus(loading) {
    const { onLoadingChange } = this.props
    if (onLoadingChange) onLoadingChange(loading)
  }

  handleUnsuccessfulResponse(response) {
    sniffFormat(response.headers['content-type'])
    const opOutcome = opOutcomeFromJsonResponse(response.data)
    if (opOutcome) throw opOutcome
    else if (response.status === 404) {
      const { resourceType, id } = this.props
      throw new Error(
        `The resource you requested was not found: ${resourceType}/${id}`,
      )
    } else {
      throw new Error(response.statusText || response.status)
    }
  }

  handleRequireRelatedResources(ids) {
    const { fhirServer } = this.props
    for (const id of ids) {
      if (typeof this.state.relatedResources[id] !== 'object') {
        this.getFhirResource(fhirServer, `/Medication/${id}`)
          .then(resource => {
            this.setState(() => ({
              relatedResources: {
                ...this.state.relatedResources,
                [id]: resource,
              },
              cancelRequest: null,
            }))
          })
          .catch(error => this.handleError(error))
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
      `?ancestor=Medication/${parentId}&medication-resource-type=${resourceType}`,
    )
      .then(resource =>
        this.setState(prevState => ({
          childBundles: { ...prevState.childBundles, [resourceType]: resource },
          cancelRequest: null,
        })),
      )
      .catch(error => this.handleError(error))
  }

  // Requests the packages that contain a specified concept type, scoped down to
  // a particular resource type, e.g. all BPG (TPP) packages for a specified
  // BPSF (TPUU).
  // Updates an object in state, with resources keyed by resource type.
  handleRequirePackageBundle(subjectId, resourceType) {
    const { fhirServer } = this.props
    this.getFhirResource(
      fhirServer,
      '/Medication',
      `?package-item=Medication/${subjectId}&medication-resource-type=${resourceType}`,
    )
      .then(resource =>
        this.setState(prevState => ({
          packageBundles: {
            ...prevState.packageBundles,
            [resourceType]: resource,
          },
        })),
      )
      .catch(error => this.handleError(error))
  }

  // Requests concepts that contain a specified substance as an ingredient,
  // scoped down to a particular resource type, e.g. all UPDSF (MPUU) concepts
  // that contain a specified substance.
  // Updates an object in state, with resources keyed by resource type.
  handleRequireContainsIngredientBundle(substanceId, resourceType) {
    const { fhirServer } = this.props
    this.getFhirResource(
      fhirServer,
      '/Medication',
      `?ingredient=Substance/${substanceId}&medication-resource-type=${resourceType}`,
    )
      .then(resource =>
        this.setState(prevState => ({
          containsIngredientBundles: {
            ...prevState.containsIngredientBundles,
            [resourceType]: resource,
          },
        })),
      )
      .catch(error => this.handleError(error))
  }

  handleLoadSubjectConcept(concept) {
    const { onLoadSubjectConcept } = this.props
    if (onLoadSubjectConcept) onLoadSubjectConcept(concept)
  }

  handleError(error) {
    const { onError } = this.props
    // Only notify upstream components about the error if it is not a request
    // cancellation.
    if (onError && !http.isCancel(error)) onError(error)
  }

  componentWillMount() {
    const { fhirServer, resourceType, id } = this.props
    this.updateResource(fhirServer, resourceType, id)
  }

  componentWillUnmount() {
    const { cancelRequest } = this.state
    if (cancelRequest) cancelRequest()
  }

  componentWillReceiveProps(nextProps) {
    const { resourceType, id } = this.props,
      { resourceType: nextResourceType, id: nextId, fhirServer } = nextProps,
      { cancelRequest } = this.state
    if (resourceType !== nextResourceType || id !== nextId) {
      // Cancel any outstanding search requests, we will update to match the
      // results to this search now or when the throttle period renews.
      if (cancelRequest) cancelRequest()
      this.updateResource(fhirServer, nextResourceType, nextId)
    }
    // Make sure related resources and bundles don't hang around when changing
    // the subject resource.
    this.setState(() => ({
      relatedResources: {},
      childBundles: {},
      packageBundles: {},
      containsIngredientBundles: {},
    }))
  }

  render() {
    const {
      resource,
      relatedResources,
      childBundles,
      packageBundles,
      containsIngredientBundles,
    } = this.state

    // This component expects a single child element, which it will pass down to
    // FhirMedication as a child.
    return (
      <FhirMedication
        resource={resource}
        relatedResources={relatedResources}
        childBundles={childBundles}
        packageBundles={packageBundles}
        containsIngredientBundles={containsIngredientBundles}
        onRequireRelatedResources={this.handleRequireRelatedResources}
        onRequireChildBundle={this.handleRequireChildBundle}
        onRequirePackageBundle={this.handleRequirePackageBundle}
        onRequireContainsIngredientBundle={
          this.handleRequireContainsIngredientBundle
        }
        onLoadSubjectConcept={this.handleLoadSubjectConcept}
        onError={this.handleError}
      >
        {this.props.children}
      </FhirMedication>
    )
  }
}

export default RemoteFhirMedication
