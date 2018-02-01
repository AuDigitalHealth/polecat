import invert from 'lodash.invert'

import { snomedUri } from '../snomed/core.js'

// Get `{ coding, type }` for the subject concept of a Medication resource.
export const getSubjectConcept = resource => {
  if (!resource.code) throw new Error('No code element found.')
  if (!resource.code.coding) throw new Error('No code.coding element found.')
  const coding = resource.code.coding
  const type = getSubjectConceptType(resource)
  const status = getStatus(resource)
  const sourceCodeSystem =
    resource.resourceType === 'Medication' ? getSourceCodeSystem(resource) : {}
  return { type, coding, status, ...sourceCodeSystem }
}

// Get the type of subject concept, which will either be:
// - In the `medicationResourceType` extension, in the case of a Medication
//   resource, OR;
// - `substance`, in the case of a Substance resource.
const getSubjectConceptType = resource => {
  if (resource.resourceType === 'Medication') {
    const resourceType = resource.extension.find(
      extensionFilterFor('medicationResourceType'),
    )
    validateMedicationResourceType(resourceType)
    return resourceType.valueCoding.code
  } else if (resource.resourceType === 'Substance') {
    return 'substance'
  } else {
    throw new Error('Unknown resource type encountered.')
  }
}

export const getRelatedConcepts = (resource, source) => {
  // Call the generator function and merge together the results into a single
  // object with all concepts and all relationships.
  const result = [
    ...getExtensionConcepts(resource.extension, source),
    ...getPackageConcepts(resource.package, source),
  ].reduce(mergeConceptsAndRelationships, emptyConcepts())
  return result
}

function* getExtensionConcepts(extension, source) {
  if (!extension) return emptyConcepts()
  // Get parent medication.
  const parent = getParentMedication(extension, source)
  let target
  // Grab the parent medication, if there is one at this level.
  if (parent) {
    yield parent
    target = parent.concepts[0]
  }
  // Get brand.
  yield getBrand(extension, source)
  // Recurse into each "parents" array to extract the data from each level
  // of the hierarchy.
  for (const parents of extension.filter(
    extensionFilterFor('parentMedicationResources'),
  )) {
    yield* getExtensionConcepts(parents.extension, target || source)
  }
}

function* getPackageConcepts(medPackage, source) {
  if (!medPackage) return emptyConcepts()
  for (const content of medPackage.content) {
    validatePackageContent(content)
    const coding = [
      {
        system: snomedUri,
        code: referenceToCode(content.itemReference.reference),
        display: content.itemReference.display,
      },
    ]
    // Get the type of the primary package concept by finding the
    // `medicationResourceType` within the extension.
    const resourceType = validateMedicationResourceType(
      content.itemReference.extension.find(
        extensionFilterFor('medicationResourceType'),
      ),
    )
    // Get the status of the primary package concept by finding the
    // `medicationResourceReferenceStatus` within the extension.
    const resourceStatus = validateMedicationResourceReferenceStatus(
      content.itemReference.extension.find(
        extensionFilterFor('medicationResourceReferenceStatus'),
      ),
    )
    const type = resourceType.valueCoding.code
    const status = resourceStatus.valueCode
    const target = { coding, type, status }
    // Return the new concept, along with a relationship between the source
    // concept and the new concept.
    yield {
      concepts: [target],
      relationships: [
        {
          source: codingToSnomedCode(source.coding),
          target: codingToSnomedCode(target.coding),
          type: relationshipTypeFor(source.type, target.type),
        },
      ],
    }
    // Recurse into each "parents" array to extract the data from each level
    // of the hierarchy.
    for (const parents of content.itemReference.extension.filter(
      extensionFilterFor('parentMedicationResources'),
    )) {
      // The target concept becomes the new source.
      yield* getExtensionConcepts(parents.extension, target)
    }
  }
}

// Get the status of the Medication resource.
const getStatus = resource => resource.status

// Get the source code system URI and version from a Medication resource.
const getSourceCodeSystem = resource => {
  if (!resource.extension) return {}
  const sourceCodeSystem = resource.extension.find(
    extensionFilterFor('sourceCodeSystem'),
  )
  if (!sourceCodeSystem) throw new Error('Missing sourceCodeSystem.')
  const sourceCodeSystemUri = sourceCodeSystem.extension.find(
    extensionFilterFor('sourceCodeSystemUri'),
  )
  const sourceCodeSystemVersion = sourceCodeSystem.extension.find(
    extensionFilterFor('sourceCodeSystemVersion'),
  )
  if (!sourceCodeSystemUri || !sourceCodeSystemUri.valueUri)
    throw new Error('Missing sourceCodeSystemUri.')
  if (!sourceCodeSystemVersion || !sourceCodeSystemVersion.valueString)
    throw new Error('Missing sourceCodeSystemVersion.')
  return {
    sourceCodeSystemUri: sourceCodeSystemUri.valueUri,
    sourceCodeSystemVersion: sourceCodeSystemVersion.valueString,
  }
}

// Get the code and type of a parent medication, and work out its relationship
// to a given source code.
const getParentMedication = (extension, source) => {
  try {
    // Get the extension which provides the parent code itself.
    const parentMedication = validateParentMedication(
      extension.find(extensionFilterFor('parentMedication')),
    )
    // Get the extension which describes the resource type of the parent code.
    const resourceType = validateMedicationResourceType(
      extension.find(extensionFilterFor('medicationResourceType')),
    )
    // Get the extension which describes the status of the parent code.
    const resourceStatus = validateMedicationResourceReferenceStatus(
      extension.find(extensionFilterFor('medicationResourceReferenceStatus')),
    )
    const coding = valueReferenceToSnomedCoding(parentMedication.valueReference)
    const type = resourceType.valueCoding.code
    const status = resourceStatus.valueCode
    // Yield a structure with an array of concepts, and an array of
    // relationships. This will be merged with data found elsewhere in the
    // resource, and in other resources, later on.
    return {
      concepts: [{ coding, type, status }],
      relationships: [
        {
          source: codingToSnomedCode(source.coding),
          target: codingToSnomedCode(coding),
          type: relationshipTypeFor(source.type, type),
        },
      ],
    }
  } catch (error) {
    return null
  }
}

// Get brand information from within the extension.
const getBrand = (extension, source) => {
  try {
    // Get the extension which provides the brand information.
    const brand = validateBrand(extension.find(extensionFilterFor('brand')))
    const coding = brand.valueCodeableConcept.coding
    return {
      concepts: [{ coding, type: 'brand' }],
      relationships: [
        {
          source: codingToSnomedCode(source.coding),
          target: codingToSnomedCode(coding),
          type: relationshipTypeFor(source.type, 'brand'),
        },
      ],
    }
  } catch (error) {
    return emptyConcepts()
  }
}

const validateParentMedication = parentMedication => {
  if (!parentMedication) throw new Error('Missing parentMedication.')
  return parentMedication
}

const validateMedicationResourceType = medicationResourceType => {
  if (!medicationResourceType) {
    throw new Error('Missing medicationResourceType value.')
  }
  if (!medicationResourceType.valueCoding) {
    throw new Error('Missing medicationResourceType.valueCoding.')
  }
  if (!medicationResourceType.valueCoding.code) {
    throw new Error('Missing medicationResourceType.valueCoding.code.')
  }
  return medicationResourceType
}

const validateMedicationResourceReferenceStatus = medResourceRefStatus => {
  if (!medResourceRefStatus) {
    throw new Error('Missing medicationResourceReferenceStatus value.')
  }
  if (!medResourceRefStatus.valueCode) {
    throw new Error('Missing medicationResourceType.valueCode.')
  }
  return medResourceRefStatus
}

const validateBrand = brand => {
  if (!brand) throw new Error('Missing brand value.')
  if (!brand.valueCodeableConcept) {
    throw new Error('Missing brand.valueCodeableConcept.')
  }
  return brand
}

const validatePackageContent = content => {
  if (!content) throw new Error('Missing package content.')
  if (!content.itemReference) throw new Error('Missing content.itemReference.')
  if (!content.itemReference.reference) {
    throw new Error('Missing content.itemReference.reference.')
  }
  if (!content.itemReference.display) {
    throw new Error('Missing content.itemReference.display.')
  }
  if (!content.itemReference.extension) {
    throw new Error('Missing content.itemReference.extension.')
  }
  return content
}

export const artgUri =
  'https://www.tga.gov.au/australian-register-therapeutic-goods'
export const groupUri = 'group'

const urlForExtension = name =>
  ({
    medicationResourceType:
      'http://medserve.online/fhir/StructureDefinition/medicationResourceType',
    medicationResourceReferenceStatus:
      'http://medserve.online/fhir/StructureDefinition/medicationResourceReferenceStatus',
    sourceCodeSystem:
      'http://medserve.online/fhir/StructureDefinition/sourceCodeSystem',
    sourceCodeSystemUri:
      'http://medserve.online/fhir/StructureDefinition/sourceCodeSystemUri',
    sourceCodeSystemVersion:
      'http://medserve.online/fhir/StructureDefinition/sourceCodeSystemVersion',
    parentMedication:
      'http://medserve.online/fhir/StructureDefinition/parentMedication',
    parentMedicationResources:
      'http://medserve.online/fhir/StructureDefinition/parentMedicationResources',
    brand: 'http://medserve.online/fhir/StructureDefinition/brand',
  }[name])

export const urlForArtgId = id =>
  `http://search.tga.gov.au/s/search.html?collection=tga-artg&profile=record&meta_i=${id}`

// Filter functions for finding different types of information within the
// extension.
const extensionFilterFor = key =>
  ({
    medicationResourceType: ext =>
      ext.url === urlForExtension('medicationResourceType'),
    medicationResourceReferenceStatus: ext =>
      ext.url === urlForExtension('medicationResourceReferenceStatus'),
    sourceCodeSystem: ext => ext.url === urlForExtension('sourceCodeSystem'),
    sourceCodeSystemUri: ext =>
      ext.url === urlForExtension('sourceCodeSystemUri'),
    sourceCodeSystemVersion: ext =>
      ext.url === urlForExtension('sourceCodeSystemVersion'),
    parentMedication: ext => ext.url === urlForExtension('parentMedication'),
    parentMedicationResources: ext =>
      ext.url === urlForExtension('parentMedicationResources') && ext.extension,
    brand: ext => ext.url === urlForExtension('brand'),
  }[key])

// Relationship types for different combinations of concept types.
export const relationshipTypeFor = (sourceType, targetType) => {
  switch (`${sourceType}-${targetType}`) {
    // CTPP -> CTPP
    // Branded package with container -> Branded package with container
    case 'BPGC-BPGC':
      return 'has-component'
    // CTPP -> TPP
    // Branded package with container -> Branded package with no container
    case 'BPGC-BPG':
      return 'is-a'
    // CTPP -> TP
    // Branded package with container -> brand
    case 'BPGC-brand':
      return 'has-brand'
    // TPP -> TP
    // Branded package with no container -> brand
    case 'BPG-brand':
      return 'has-brand'
    // TPUU -> TP
    // Branded product with strengths and form -> brand
    case 'BPSF-brand':
      return 'has-brand'
    // TPP -> TPUU
    // Branded package with no container ->
    //   Branded product with strengths and form
    case 'BPG-BPSF':
      return 'has-bpsf'
    // TPUU -> MPUU
    // Branded product with strengths and form ->
    //   Unbranded product with strengths and form
    case 'BPSF-UPDSF':
      return 'is-a'
    // TPUU -> MP
    // Branded product with strengths and form ->
    //   Unbranded product with no strengths or form
    case 'BPSF-UPD':
      return 'is-a'
    // TPP -> MPP
    // Branded package with no container -> Unbranded package with no container
    case 'BPG-UPG':
      return 'is-a'
    // MPP -> MPP
    // Unbranded package with no container ->
    //   Unbranded product with no container
    case 'UPG-UPG':
      return 'has-component'
    // TPP -> TPP
    // Branded package with no container ->
    //   Branded product with no container
    case 'BPG-BPG':
      return 'has-component'
    // MPP -> MPUU
    // Unbranded package with no container ->
    //   Unbranded product with strengths and form
    case 'UPG-UPDSF':
      return 'has-updsf'
    // MPUU -> MP
    // Unbranded product with strengths and form ->
    //   Unbranded product with no strengths or form
    case 'UPDSF-UPD':
      return 'is-a'
    // MPUU -> MPUU
    // Unbranded product with strengths and form ->
    //   Unbranded product with strengths and form
    case 'UPDSF-UPDSF':
      return 'is-a'
    // MP -> MP
    // Unbranded product with strengths and form ->
    //   Unbranded product with strengths and form
    case 'UPD-UPD':
      return 'is-a'
    default:
      return 'unknown'
  }
}

export const humaniseRelationshipType = (type, plural) =>
  plural
    ? {
        'is-a': 'are subtypes of',
        'has-updsf': 'are packages containing',
        'has-component': 'have component',
        'has-brand': 'have brand',
        'has-bpsf': 'are packages containing',
        unknown: null,
      }[type]
    : {
        'is-a': 'is a subtype of',
        'has-updsf': 'has unit of use',
        'has-component': 'has component',
        'has-brand': 'has brand',
        'has-bpsf': 'has unit of use',
        unknown: null,
      }[type]

// Settings that control the set of additional resources requested for each
// given concept type.
export const resourceRequirementsFor = sourceType =>
  ({
    BPGC: [],
    BPG: [],
    BPSF: [],
    UPG: [],
    UPDSF: [],
    UPD: [],
    substance: [],
  }[sourceType])

// Settings that control the set of child resource types requested for each
// given concept type.
export const childRequirementsFor = sourceType =>
  ({
    BPGC: [],
    BPG: ['BPGC'],
    BPSF: [],
    UPG: ['UPG', 'BPG'],
    UPDSF: ['UPDSF', 'BPSF'],
    UPD: ['UPD', 'UPDSF', 'BPSF'],
    substance: [],
  }[sourceType])

// Settings that control the set of package resource types requested for each
// given concept type.
export const packageRequirementsFor = sourceType =>
  ({
    BPGC: ['BPGC'],
    BPG: [],
    BPSF: ['BPG'],
    UPG: ['UPG'],
    UPDSF: ['UPG'],
    UPD: [],
    substance: [],
  }[sourceType])

const fhirToAmtTypes = {
  BPGC: 'CTPP',
  BPG: 'TPP',
  BPSF: 'TPUU',
  brand: 'TP',
  UPG: 'MPP',
  UPDSF: 'MPUU',
  UPD: 'MP',
  substance: 'substance',
}

const amtToFhirTypes = invert(fhirToAmtTypes)

export const amtConceptTypes = Object.keys(fhirToAmtTypes).map(
  k => fhirToAmtTypes[k],
)

// Mapping from FHIR Medication type to AMT concept type.
export const amtConceptTypeFor = fhirType => fhirToAmtTypes[fhirType]

// Mapping from AMT concept type to FHIR Medication type.
export const fhirMedicationTypeFor = amtType => amtToFhirTypes[amtType]

// Conversion from `Medication/[code]` to code.
const referenceToCode = reference => {
  if (!reference) {
    throw new Error('Missing reference.')
  }
  return reference.split('/').slice(-1)[0]
}

// Extracts a SNOMED code from a `coding` element, e.g.:
// [
//   {
//     "system": "http://snomed.info/sct",
//     "code": "813191000168107",
//     "display": "Nuromol film-coated tablet, 16, blister pack"
//   },
//   {
//     "system": "https://www.tga.gov.au/australian-register-therapeutic-goods",
//     "code": "225322"
//   }
// ]
// Returns: 813191000168107
export const codingToSnomedCode = coding => {
  const found = coding.find(c => c.system === snomedUri)
  return found ? found.code : null
}

// Extracts a SNOMED display from a `coding` element.
export const codingToSnomedDisplay = coding => {
  const found = coding.find(c => c.system === snomedUri)
  return found ? found.display : null
}

// Extracts an ARTG ID from a `coding` element.
export const codingToArtgId = coding => {
  const found = coding.find(c => c.system === artgUri)
  return found ? found.code : null
}

// Extracts a group code from a `coding` element.
export const codingToGroupCode = coding => {
  const found = coding.find(c => c.system === groupUri)
  return found ? found.code : null
}

// Takes a `valueReference` element and returns a `coding` element, containing a
// single SNOMED 'code', e.g.
// {
//   "reference": "Medication/813181000168109",
//   "display": "Nuromol film-coated tablet, 16"
// }
// Returns:
// [
//   {
//     "system": "http://snomed.info/sct",
//     "code": "813181000168109",
//     "display": "Nuromol film-coated tablet, 16"
//   },
// ]
const valueReferenceToSnomedCoding = valueReference => {
  if (!valueReference) throw new Error('Missing valueReference.')
  return [
    {
      system: snomedUri,
      code: referenceToCode(valueReference.reference),
      display: valueReference.display,
    },
  ]
}

// Merges a concept object `{ concepts: [], relationships: [] }` into an array
// of concept objects, minding uniqueness of concepts and relationships. If a
// concept or relationship is already existing, its data is merged in an
// additive fashion.
export const mergeConceptsAndRelationships = (merged, object) => {
  mergeConcepts(merged.concepts, object.concepts)
  mergeRelationships(merged.relationships, object.relationships)
  return merged
}

export const mergeConcepts = (merged, concepts) => {
  let found
  for (const concept of concepts) {
    found = merged.findIndex(c => conceptsHaveSameCoding(c, concept))
    if (found !== -1) {
      merged[found] = { ...merged[found], ...concept }
    } else merged.push(concept)
  }
  return merged
}

const mergeRelationships = (merged, relationships) => {
  for (const relationship of relationships) {
    const found = merged.findIndex(r =>
      relationshipHasSourceTarget(r, relationship.source, relationship.target),
    )
    if (found !== -1) {
      merged[found] = {
        ...merged[found],
        ...relationship,
      }
    } else merged.push(relationship)
  }
  return merged
}

// Concepts A and B are deemed to have the same coding if the SNOMED CT codes
// are present and match.
const conceptsHaveSameCoding = (conceptA, conceptB) => {
  const conceptACode =
      codingToSnomedCode(conceptA.coding) || codingToGroupCode(conceptA.coding),
    conceptBCode =
      codingToSnomedCode(conceptB.coding) || codingToGroupCode(conceptB.coding)
  return conceptACode && conceptBCode && conceptACode === conceptBCode
}

// A relationship's uniqueness is defined by its source and target codes.
const relationshipHasSourceTarget = (relationship, source, target) =>
  relationship.source === source && relationship.target === target

export const emptyConcepts = () => {
  return { concepts: [], relationships: [] }
}
