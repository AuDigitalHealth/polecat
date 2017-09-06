import React, { Component } from 'react'
import PropTypes from 'prop-types'
import isEqual from 'lodash.isequal'
import values from 'lodash.values'
import cloneDeep from 'lodash.clonedeep'

import AmtProductModel from './AmtProductModel.js'
import {
  getSubjectConcept,
  getRelatedConcepts,
  mergeConcepts,
  emptyConcepts,
  resourceRequirementsFor,
} from './fhir/medication.js'

class FhirMedication extends Component {
  static propTypes = {
    resource: PropTypes.object,
    relatedResources: PropTypes.object,
    onRequireRelatedResources: PropTypes.func,
  }
  static defaultProps = {
    relatedResources: {},
  }

  constructor(props) {
    super(props)
    this.state = { additionalResourcesRequested: false }
  }

  parseResources(
    resource,
    relatedResources,
    prevConcepts,
    additionalResourcesRequested
  ) {
    if (resource) {
      // Get concepts from the main resource.
      const conceptsFromFocused = this.getConceptsForResource(resource, true)
      // Get concepts from each related resource, combine with the concepts from
      // the main resource and merge together.
      const allConceptsUnmerged = values(relatedResources).reduce(
        (merged, relatedResource) =>
          merged.concat(this.getConceptsForResource(relatedResource)),
        [conceptsFromFocused]
      )
      // Merge all concepts harvested from this set of props with the previous
      // set of concepts.
      const allConcepts = allConceptsUnmerged.reduce(
        mergeConcepts,
        cloneDeep(prevConcepts)
      )
      // Request additional resources of particular types found within the
      // original resource. Only do this once, don't recurse into related
      // resources.
      if (!additionalResourcesRequested) {
        this.requireAdditionalResources(resource, conceptsFromFocused.concepts)
      }
      // Update state with merged concepts and relationships values.
      this.setState(() => allConcepts)
    }
  }

  // Get an array of concepts for the supplied resource, unmerged.
  getConceptsForResource(resource, setFocused = false) {
    const focused = getSubjectConcept(resource)
    if (setFocused) focused.focused = true
    const result = getRelatedConcepts(resource, focused.code, focused.type)
    result.concepts.push(focused)
    return result
  }

  // Notify upstream components that we require additional resources to be
  // retrieved, based on the concept type of the supplied resource.
  requireAdditionalResources(resource, concepts) {
    const { onRequireRelatedResources } = this.props
    if (onRequireRelatedResources) {
      const type = getSubjectConcept(resource).type
      const requirements = resourceRequirementsFor(type)
      const ids = concepts
        .filter(c => requirements.includes(c.type) || !c.type)
        .map(c => c.code)
      onRequireRelatedResources(ids)
      this.setState(() => ({ additionalResourcesRequested: true }))
    }
  }

  componentWillMount() {
    const { resource, relatedResources } = this.props
    this.parseResources(resource, relatedResources, emptyConcepts(), false)
  }

  componentWillReceiveProps(nextProps) {
    const { resource, relatedResources } = nextProps
    const { concepts, relationships, additionalResourcesRequested } = this.state
    let prevConcepts = emptyConcepts()
    if (isEqual(this.props.resource, resource) && concepts && relationships) {
      prevConcepts = {
        concepts: concepts.concat([]),
        relationships: relationships.concat([]),
      }
    }
    if (!isEqual(this.props, nextProps)) {
      this.parseResources(
        resource,
        relatedResources,
        prevConcepts,
        additionalResourcesRequested
      )
    }
  }

  render() {
    const { concepts, relationships } = this.state
    return <AmtProductModel nodes={concepts} links={relationships} />
  }
}

export default FhirMedication
