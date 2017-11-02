import React, { Component } from 'react'
import PropTypes from 'prop-types'
import isEqual from 'lodash.isequal'
import values from 'lodash.values'
import cloneDeep from 'lodash.clonedeep'

import {
  getSubjectConcept,
  getRelatedConcepts,
  mergeConceptsAndRelationships,
  emptyConcepts,
  resourceRequirementsFor,
  childRequirementsFor,
  packageRequirementsFor,
  codingToSnomedCode,
} from './fhir/medication.js'
import { getBundleConcepts } from './fhir/bundle.js'

class FhirMedication extends Component {
  static propTypes = {
    resource: PropTypes.object,
    relatedResources: PropTypes.object,
    childBundles: PropTypes.object,
    packageBundles: PropTypes.object,
    groupingThreshold: PropTypes.number,
    onRequireRelatedResources: PropTypes.func,
    onRequireChildBundle: PropTypes.func,
    onRequirePackageBundle: PropTypes.func,
  }
  static defaultProps = {
    relatedResources: {},
    childBundles: {},
    packageBundles: {},
    groupingThreshold: 3,
  }

  constructor(props) {
    super(props)
    this.state = {
      additionalResourcesRequested: false,
    }
  }

  // Parse resources and bundles from props and put the extracted concepts into
  // `allConcepts` in state.
  async parseResources(options = {}) {
    const {
      resource = this.props.resource,
      relatedResources = this.props.relatedResources,
      childBundles = this.props.childBundles,
      packageBundles = this.props.packageBundles,
      groupingThreshold = this.props.groupingThreshold,
      prevConcepts = emptyConcepts(),
      additionalResourcesRequested = false,
      childConceptsRequested = false,
      packageConceptsRequested = false,
    } = options
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
      // Get child concepts from all child bundles.
      const childConcepts = await Promise.all(
        values(childBundles).reduce(
          (merged, childBundle) =>
            merged.concat(
              getBundleConcepts(focused, childBundle, {
                groupingThreshold,
                groupRelationshipType: 'is-a',
              })
            ),
          []
        )
      )
      // Get package concepts from all package bundles.
      const packageConcepts = await Promise.all(
        values(packageBundles).reduce(
          (merged, packageBundle) =>
            merged.concat(
              getBundleConcepts(focused, packageBundle, {
                groupingThreshold,
                groupRelationshipType: 'is-component-of',
              })
            ),
          []
        )
      )
      // Merge all concepts harvested from this set of props with the previous
      // set of concepts.
      const allConcepts = [
        conceptsFromFocused,
        ...relatedConcepts,
        ...childConcepts,
        ...packageConcepts,
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
      // Request bundle of package concepts for the subject resource.
      if (!packageConceptsRequested) {
        this.requirePackageConcepts(resource)
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
      const concept = getSubjectConcept(resource)
      const code = codingToSnomedCode(concept.coding)
      childRequirementsFor(concept.type).forEach(resourceType =>
        onRequireChildBundle(code, resourceType)
      )
      this.setState(() => ({ childConceptsRequested: true }))
    }
  }

  requirePackageConcepts(resource) {
    const { onRequirePackageBundle } = this.props
    if (onRequirePackageBundle) {
      const concept = getSubjectConcept(resource)
      const code = codingToSnomedCode(concept.coding)
      packageRequirementsFor(concept.type).forEach(resourceType =>
        onRequirePackageBundle(code, resourceType)
      )
      this.setState(() => ({ packageConceptsRequested: true }))
    }
  }

  componentWillMount() {
    this.parseResources()
  }

  componentWillReceiveProps(nextProps) {
    const {
      resource,
      relatedResources,
      childBundles,
      packageBundles,
      groupingThreshold,
    } = nextProps
    const { concepts, relationships } = this.state
    // If the primary resource has changed, start with a empty set of concepts
    // and relationships, and reset the flag for requesting additional
    // resources.
    if (!isEqual(this.props.resource, resource)) {
      this.parseResources({
        resource,
        relatedResources,
        childBundles,
        packageBundles,
        groupingThreshold,
      })
      // If only related resources are changing, preserve the set of concepts
      // and relationships. Additional resources will not be requested.
    } else if (
      (!isEqual(this.props.relatedResources, relatedResources) ||
        !isEqual(this.props.childBundles, childBundles) ||
        !isEqual(this.props.packageBundles, packageBundles)) &&
      concepts &&
      relationships
    ) {
      const {
        additionalResourcesRequested,
        childConceptsRequested,
        packageConceptsRequested,
      } = this.state
      this.parseResources({
        resource,
        relatedResources,
        childBundles,
        packageBundles,
        groupingThreshold,
        // Ensure that a copy of the concepts and relationships are taken before
        // passing them in.
        prevConcepts: {
          concepts: concepts.concat([]),
          relationships: relationships.concat([]),
        },
        additionalResourcesRequested,
        childConceptsRequested,
        packageConceptsRequested,
      })
    }
  }

  render() {
    const { concepts, relationships } = this.state
    // This component expects a single child element, which it will add the
    // concepts and relationships props to before rendering.
    return React.cloneElement(this.props.children, {
      nodes: concepts,
      links: relationships,
    })
  }
}

export default FhirMedication
