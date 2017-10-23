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
  codingToSnomedCode,
  groupUri,
} from './fhir/medication.js'
import { sha256 } from './util.js'

class FhirMedication extends Component {
  static propTypes = {
    resource: PropTypes.object,
    relatedResources: PropTypes.object,
    childBundle: PropTypes.object,
    groupingThreshold: PropTypes.number,
    viewport: PropTypes.object.isRequired,
    onRequireRelatedResources: PropTypes.func,
    onRequireChildBundle: PropTypes.func,
  }
  static defaultProps = {
    relatedResources: {},
    groupingThreshold: 3,
  }

  constructor(props) {
    super(props)
    this.state = { additionalResourcesRequested: false }
  }

  async parseResources(
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
      const childConcepts = await this.getChildConcepts(focused, childBundle)
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
        : getRelatedConcepts(resource, focused)
    result.concepts.push(focused)
    return result
  }

  // Get child concepts from the supplied child bundle, relating them to the
  // focused concept.
  async getChildConcepts(focused, childBundle) {
    const { groupingThreshold } = this.props
    if (!childBundle || childBundle.total === 0) return emptyConcepts()
    if (childBundle.total <= groupingThreshold) {
      return childBundle.entry.reduce((acc, e) => {
        const child = getSubjectConcept(e.resource)
        acc.concepts.push(child)
        acc.relationships.push({
          source: codingToSnomedCode(child.coding),
          target: codingToSnomedCode(focused.coding),
          type: relationshipTypeFor(child.type, focused.type),
        })
        return acc
      }, emptyConcepts())
    } else {
      const concepts = childBundle.entry
        .slice(0, groupingThreshold)
        .map(e => getSubjectConcept(e.resource))
      // The group's code is a hash of the concept data within the group.
      const groupCode = await sha256(JSON.stringify(concepts))
      return {
        concepts: [
          {
            coding: [{ system: groupUri, code: groupCode }],
            type: 'group',
            total: childBundle.total,
            concepts,
          },
        ],
        relationships: [
          {
            // A `group-` prefix is added to the group code within the
            // relationships so that it can be discerned when drawing curves and
            // arrows.
            source: `group-${groupCode}`,
            target: codingToSnomedCode(focused.coding),
            type: 'is-a',
          },
        ],
      }
    }
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
        .map(c => codingToSnomedCode(c.coding))
      onRequireRelatedResources(ids)
      this.setState(() => ({ additionalResourcesRequested: true }))
    }
  }

  requireChildConcepts(resource) {
    const { onRequireChildBundle } = this.props
    if (onRequireChildBundle) {
      const code = codingToSnomedCode(getSubjectConcept(resource).coding)
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
