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
  containsIngredientRequirementsFor,
} from './fhir/medication.js'
import { getBundleConcepts } from './fhir/bundle.js'

class FhirMedication extends Component {
  static propTypes = {
    resource: PropTypes.object,
    // { [id]: [resource] }
    relatedResources: PropTypes.objectOf(PropTypes.object),
    // { [FHIR medication type]: [bundle] }
    childBundles: PropTypes.objectOf(PropTypes.object),
    // { [FHIR medication type]: [bundle] }
    packageBundles: PropTypes.objectOf(PropTypes.object),
    // { [FHIR medication type]: [bundle] }
    containsIngredientBundles: PropTypes.objectOf(PropTypes.object),
    groupingThreshold: PropTypes.number,
    children: PropTypes.any.isRequired,
    onRequireRelatedResources: PropTypes.func,
    onRequireChildBundle: PropTypes.func,
    onRequirePackageBundle: PropTypes.func,
    onRequireContainsIngredientBundle: PropTypes.func,
    onLoadSubjectConcept: PropTypes.func,
  }
  static defaultProps = {
    relatedResources: {},
    childBundles: {},
    packageBundles: {},
    containsIngredientBundles: {},
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
      containsIngredientBundles = this.props.containsIngredientBundles,
      groupingThreshold = this.props.groupingThreshold,
      onLoadSubjectConcept = this.props.onLoadSubjectConcept,
      prevConcepts = emptyConcepts(),
      additionalResourcesRequested = false,
      childConceptsRequested = false,
      packageConceptsRequested = false,
      containsIngredientConceptsRequested = false,
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
        [],
      )
      // Get child concepts from all child bundles.
      const childConcepts = await Promise.all(
        values(childBundles).reduce(
          (merged, childBundle) =>
            merged.concat(
              getBundleConcepts(focused, childBundle, {
                groupingThreshold,
                queryType: 'children',
              }),
            ),
          [],
        ),
      )
      // Get package concepts from all package bundles.
      const packageConcepts = await Promise.all(
        values(packageBundles).reduce(
          (merged, packageBundle) =>
            merged.concat(
              getBundleConcepts(focused, packageBundle, {
                groupingThreshold,
                queryType: 'packages',
              }),
            ),
          [],
        ),
      )
      // Get concepts from all contains ingredient bundles.
      const containsIngredientConcepts = await Promise.all(
        values(containsIngredientBundles).reduce(
          (merged, containsIngredientBundle) =>
            merged.concat(
              getBundleConcepts(focused, containsIngredientBundle, {
                groupingThreshold,
                queryType: 'contains-ingredient',
              }),
            ),
          [],
        ),
      )
      // Merge all concepts harvested from this set of props with the previous
      // set of concepts.
      const allConcepts = [
        conceptsFromFocused,
        ...relatedConcepts,
        ...childConcepts,
        ...packageConcepts,
        ...containsIngredientConcepts,
      ].reduce(mergeConceptsAndRelationships, cloneDeep(prevConcepts))
      // Request additional resources of particular types found within the
      // original resource. Only do this once, don't recurse into related
      // resources.
      if (!additionalResourcesRequested)
        this.requireAdditionalResources(resource, conceptsFromFocused.concepts)
      // Request bundles of child concepts for the subject resource.
      if (!childConceptsRequested) this.requireChildConcepts(resource)
      // Request bundles of package concepts for the subject resource.
      if (!packageConceptsRequested) this.requirePackageConcepts(resource)
      // Request bundles of resources that contain the subject resource as an ingredient.
      if (!containsIngredientConceptsRequested)
        this.requireContainsIngredientConcepts(resource)
      // Update state with merged concepts and relationships values.
      this.setState(() => allConcepts)
      // Notify upstream components that a new subject concept has been loaded.
      // This is used for things such as updating the page title.
      if (onLoadSubjectConcept) onLoadSubjectConcept(focused)
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
        onRequireChildBundle(code, resourceType),
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
        onRequirePackageBundle(code, resourceType),
      )
      this.setState(() => ({ packageConceptsRequested: true }))
    }
  }

  requireContainsIngredientConcepts(resource) {
    const { onRequireContainsIngredientBundle } = this.props
    if (onRequireContainsIngredientBundle) {
      const concept = getSubjectConcept(resource)
      const code = codingToSnomedCode(concept.coding)
      containsIngredientRequirementsFor(concept.type).forEach(resourceType =>
        onRequireContainsIngredientBundle(code, resourceType),
      )
      this.setState(() => ({ containsIngredientConceptsRequested: true }))
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
      containsIngredientBundles,
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
        containsIngredientBundles,
        groupingThreshold,
      })
      // If only related resources are changing, preserve the set of concepts
      // and relationships. Additional resources will not be requested.
    } else if (
      (!isEqual(this.props.relatedResources, relatedResources) ||
        !isEqual(this.props.childBundles, childBundles) ||
        !isEqual(this.props.packageBundles, packageBundles) ||
        !isEqual(
          this.props.containsIngredientBundles,
          containsIngredientBundles,
        )) &&
      concepts &&
      relationships
    ) {
      const {
        additionalResourcesRequested,
        childConceptsRequested,
        packageConceptsRequested,
        containsIngredientConceptsRequested,
      } = this.state
      this.parseResources({
        resource,
        relatedResources,
        childBundles,
        packageBundles,
        containsIngredientBundles,
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
        containsIngredientConceptsRequested,
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
