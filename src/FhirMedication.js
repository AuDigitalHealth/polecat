import React, { Component } from 'react'
import PropTypes from 'prop-types'
import isEqual from 'lodash.isequal'
import values from 'lodash.values'
import cloneDeep from 'lodash.clonedeep'

import AmtProductModel from './AmtProductModel.js'
import {
  getSubjectConcept,
  getRelatedConcepts,
  mergeConceptsAndRelationships,
  emptyConcepts,
  resourceRequirementsFor,
  relationshipTypeFor,
} from './fhir/medication.js'

class FhirMedication extends Component {
  static propTypes = {
    resource: PropTypes.object,
    relatedResources: PropTypes.object,
    childResources: PropTypes.object,
    viewport: PropTypes.object.isRequired,
    onRequireRelatedResources: PropTypes.func,
    onRequireChildBundle: PropTypes.func,
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
    childBundle,
    prevConcepts,
    additionalResourcesRequested,
    childConceptsRequested
  ) {
    if (resource) {
      const focused = getSubjectConcept(resource)
      // Get concepts from the main resource.
      const conceptsFromFocused = this.getConceptsForResource(resource, true)
      // Get concepts from each related resource, combine with the concepts from
      // the main resource and merge together.
      const relatedConcepts = values(relatedResources).reduce(
        (merged, relatedResource) =>
          merged.concat(this.getConceptsForResource(relatedResource)),
        []
      )
      // Get child concepts.
      const childConcepts =
        childBundle && childBundle.total > 0
          ? childBundle.entry.reduce((acc, e) => {
            const child = getSubjectConcept(e.resource)
            acc.concepts.push(child)
            acc.relationships.push({
              source: child.code,
              target: focused.code,
              type: relationshipTypeFor(child.type, focused.type),
            })
            return acc
          }, emptyConcepts())
          : emptyConcepts()
      // Merge all concepts harvested from this set of props with the previous
      // set of concepts.
      const allConcepts = [
        conceptsFromFocused,
        ...relatedConcepts,
        childConcepts,
      ].reduce(mergeConceptsAndRelationships, cloneDeep(prevConcepts))
      // Request additional resources of particular types found within the
      // original resource. Only do this once, don't recurse into related
      // resources.
      if (!additionalResourcesRequested) {
        this.requireAdditionalResources(resource, conceptsFromFocused.concepts)
      }
      // Request bundle of child concepts for the subject resource.
      if (!childConceptsRequested) {
        this.requireChildConcepts(resource)
      }
      // Update state with merged concepts and relationships values.
      this.setState(() => allConcepts)
    }
  }

  // Get an array of concepts for the supplied resource, unmerged.
  getConceptsForResource(resource, setFocused = false) {
    const focused = getSubjectConcept(resource)
    if (setFocused) focused.focused = true
    const result =
      focused.type === 'substance'
        ? emptyConcepts()
        : getRelatedConcepts(resource, focused.code, focused.type)
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

  requireChildConcepts(resource) {
    const { onRequireChildBundle } = this.props
    if (onRequireChildBundle) {
      const code = getSubjectConcept(resource).code
      onRequireChildBundle(code)
      this.setState(() => ({ childConceptsRequested: true }))
    }
  }

  componentWillMount() {
    const { resource, relatedResources, childBundle } = this.props
    this.parseResources(
      resource,
      relatedResources,
      childBundle,
      emptyConcepts(),
      false,
      false
    )
  }

  componentWillReceiveProps(nextProps) {
    const { resource, relatedResources, childBundle } = nextProps
    const { concepts, relationships } = this.state
    // If the primary resource has changed, start with a empty set of concepts
    // and relationships, and reset the flag for requesting additional
    // resources.
    if (!isEqual(this.props.resource, resource)) {
      this.parseResources(
        resource,
        relatedResources,
        childBundle,
        emptyConcepts(),
        false,
        false
      )
      // If only related resources are changing, preserve the set of concepts and
      // relationships. Additional resources will not be requested.
    } else if (
      (!isEqual(this.props.relatedResources, relatedResources) ||
        !isEqual(this.props.childBundle, childBundle)) &&
      concepts &&
      relationships
    ) {
      const {
        additionalResourcesRequested,
        childConceptsRequested,
      } = this.state
      this.parseResources(
        resource,
        relatedResources,
        childBundle,
        {
          concepts: concepts.concat([]),
          relationships: relationships.concat([]),
        },
        additionalResourcesRequested,
        childConceptsRequested
      )
    }
  }

  render() {
    const { viewport } = this.props
    const { concepts, relationships } = this.state
    return (
      <AmtProductModel
        nodes={concepts}
        links={relationships}
        viewport={viewport}
      />
    )
  }
}

export default FhirMedication
