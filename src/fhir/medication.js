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
    const type = getExtension(resource, 'medicationResourceType', 'valueCoding')
    return type.code
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
    ...getExtensionConcepts(resource, source),
    ...getPackageConcepts(resource, source),
    ...getIngredients(resource, source),
  ].reduce(mergeConceptsAndRelationships, emptyConcepts())
  return result
}

function* getExtensionConcepts(resource, sourceConcept) {
  if (!resource.extension) return emptyConcepts()
  // Get brand.
  yield getBrand(resource, sourceConcept)
  // Recursively yield all parent medications.
  yield* getParentMedications(resource, sourceConcept)
  // Get concepts that the source concept is replaced by.
  // TODO: Enable this when replaced by lands in Medserve.
  // yield* getReplacedByConcepts(resource, sourceConcept)
  // Get concepts that the source concept replaces.
  // TODO: Enable this when replaces lands in Medserve.
  // yield* getReplacesConcepts(resource, sourceConcept)
}

function* getPackageConcepts(resource, sourceConcept) {
  if (!resource.package) return emptyConcepts()
  for (const content of resource.package.content) {
    try {
      if (!content.itemReference)
        throw new Error('content.itemReference not found.')
      const coding = [
        {
          system: snomedUri,
          code: referenceToId(content.itemReference.reference),
          display: content.itemReference.display,
        },
      ]
      // Get the type of the primary package concept by finding the
      // `medicationResourceType` within the extension.
      const resourceType = getExtension(
        content.itemReference,
        'medicationResourceType',
      )
      // Get the status of the primary package concept by finding the
      // `medicationResourceReferenceStatus` within the extension.
      const resourceStatus = getExtension(
        content.itemReference,
        'medicationResourceReferenceStatus',
      )
      const type = resourceType.code
      const status = resourceStatus
      const targetConcept = { coding, type, status }
      // Return the new concept, along with a relationship between the source
      // concept and the new concept.
      yield {
        concepts: [targetConcept],
        relationships: [
          {
            source: codingToSnomedCode(sourceConcept.coding),
            target: codingToSnomedCode(targetConcept.coding),
            type: relationshipTypeFor(sourceConcept.type, targetConcept.type),
          },
        ],
      }
      // Recursively process further parent medications.
      yield* getParentMedications(content.itemReference, targetConcept)
    } catch (error) {
      // If there is an error, skip this content item and try the next one.
      continue
    }
  }
}

function* getIngredients(resource, sourceConcept) {
  if (!resource.ingredient) return []
  for (const ingredient of resource.ingredient) {
    try {
      if (!ingredient.itemReference)
        throw new Error('ingredient.itemReference not found.')
      // Get the details of the coding from the `ingredient` element.
      const coding = [
        {
          system: snomedUri,
          code: referenceToId(ingredient.itemReference.reference),
          display: ingredient.itemReference.display,
        },
      ]
      // Return the Substance concept, along with a relationship between it and
      // the source concept.
      const targetConcept = { coding, type: 'substance' }
      yield {
        concepts: [targetConcept],
        relationships: [
          {
            source: codingToSnomedCode(sourceConcept.coding),
            target: codingToSnomedCode(targetConcept.coding),
            type: relationshipTypeFor(sourceConcept.type, targetConcept.type),
          },
        ],
      }
    } catch (error) {
      continue
    }
  }
}

// Get the status of the Medication resource.
const getStatus = resource => resource.status

// Get the source code system URI and version from a Medication resource.
const getSourceCodeSystem = resource => {
  try {
    const sourceCodeSystem = getExtension(resource, 'sourceCodeSystem')
    const sourceCodeSystemUri = getExtension(
      sourceCodeSystem,
      'sourceCodeSystemUri',
    )
    const sourceCodeSystemVersion = getExtension(
      sourceCodeSystem,
      'sourceCodeSystemVersion',
    )
    return { sourceCodeSystemUri, sourceCodeSystemVersion }
  } catch (error) {
    return {}
  }
}

// Yield the concepts and relationships between all parent medications
// represented within the extension of the given element, using the given
// concept as the source of the child-parent relationship.
function* getParentMedications(resourceOrExtension, sourceConcept) {
  for (const parentMedicationResources of getAllExtensions(
    resourceOrExtension,
    'parentMedicationResources',
  )) {
    try {
      // Get the extension which provides the parent code itself.
      const parentMedication = getExtension(
        parentMedicationResources,
        'parentMedication',
      )
      // Get the extension which describes the resource type of the parent code.
      const resourceType = getExtension(
        parentMedicationResources,
        'medicationResourceType',
      )
      // Get the extension which describes the status of the parent code.
      const status = getExtension(
        parentMedicationResources,
        'medicationResourceReferenceStatus',
      )
      const coding = referenceToSnomedCoding(parentMedication)
      const type = resourceType.code
      const targetConcept = { coding, type, status }
      // Yield a structure with an array of concepts, and an array of
      // relationships. This will be merged with data found elsewhere in the
      // resource, and in other resources, later on.
      yield {
        concepts: [targetConcept],
        relationships: [
          {
            source: codingToSnomedCode(sourceConcept.coding),
            target: codingToSnomedCode(coding),
            type: relationshipTypeFor(sourceConcept.type, type),
          },
        ],
      }
      // Recursively process further parent medications.
      yield* getParentMedications(parentMedicationResources, targetConcept)
    } catch (error) {
      // If there is an error processing one of the `parentMedicationResources`,
      // abort and go on to the next one.
      continue
    }
  }
}

// Get brand information from within the extension.
const getBrand = (resource, subjectConcept) => {
  try {
    // Get the extension which provides the brand information.
    const coding = getExtension(resource, 'brand').coding
    return {
      concepts: [{ coding, type: 'brand' }],
      relationships: [
        {
          source: codingToSnomedCode(subjectConcept.coding),
          target: codingToSnomedCode(coding),
          type: relationshipTypeFor(subjectConcept.type, 'brand'),
        },
      ],
    }
  } catch (error) {
    return emptyConcepts()
  }
}

// Get concepts that replace the source concept, from within the supplied
// resource.
// function* getReplacedByConcepts(resource, subjectConcept) {
//   try {
//     for (const ext of getAllExtensions(resource, 'isReplacedByResources')) {
//       const replacedByResource = getExtension(ext, 'isReplacedBy')
//       const replacementDate = getExtension(ext, 'replacementDate')
//       yield {
//         concepts: [
//           {
//             coding: referenceToSnomedCoding(replacedByResource),
//             // FIXME: These are guesses, waiting on type and status to be added
//             // so that we can put the correct values here.
//             type: subjectConcept.type,
//             status: 'active',
//           },
//         ],
//         relationships: [
//           {
//             source: codingToSnomedCode(subjectConcept.coding),
//             target: referenceToId(replacedByResource.reference),
//             type: 'replaced-by',
//             replacementDate,
//           },
//         ],
//       }
//     }
//   } catch (error) {
//     return emptyConcepts()
//   }
// }

// Get concepts that the source concept replaces, from within the supplied
// extension.
// function* getReplacesConcepts(resource, subjectConcept) {
//   try {
//     for (const replacesResources of getAllExtensions(
//       resource,
//       'replacesResources',
//     )) {
//       const replacesResource = getExtension(
//         replacesResources,
//         'replacesResource',
//       )
//       const replacementDate = getExtension(replacesResources, 'replacementDate')
//       yield {
//         concepts: [
//           {
//             coding: referenceToSnomedCoding(replacesResource),
//             // FIXME: These are guesses, waiting on type and status to be added
//             // so that we can put the correct values here.
//             type: subjectConcept.type,
//             status: 'entered-in-error',
//           },
//         ],
//         relationships: [
//           {
//             source: codingToSnomedCode(subjectConcept.coding),
//             target: referenceToId(replacesResource.reference),
//             type: 'replaces',
//             replacementDate,
//           },
//         ],
//       }
//     }
//   } catch (error) {
//     return emptyConcepts()
//   }
// }

const getExtension = (element, extensionName, { valueOnly = true } = {}) => {
  if (!(element && element.extension)) throw new Error('Extension not found.')
  const extension = element.extension.find(
    ext => ext.url === urlForExtension(extensionName),
  )
  if (!extension) throw new Error(`Extension not found: ${extensionName}`)
  const type = typeForExtension(extensionName)
  // If the extension is of type `extension`, just give it back rather than its
  // child extension. This allows us to properly walk the extension hierarchy
  // using this same function. Otherwise, give the value back.
  return type === 'extension' || valueOnly === false
    ? extension
    : extension[typeForExtension(extensionName)]
}

const getAllExtensions = (
  element,
  extensionName,
  { valueOnly = true } = {},
) => {
  if (!(element && element.extension)) return []
  const extensions = element.extension.filter(
    ext => ext.url === urlForExtension(extensionName),
  )
  const type = typeForExtension(extensionName)
  return extensions.map(
    ext => (type === 'extension' || valueOnly === false ? ext : ext[type]),
  )
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
    isReplacedByResources:
      'http://medserve.online/fhir/StructureDefinition/isReplacedByResources',
    isReplacedBy:
      'http://medserve.online/fhir/StructureDefinition/isReplacedBy',
    replacesResources:
      'http://medserve.online/fhir/StructureDefinition/replacesResources',
    replacesResource:
      'http://medserve.online/fhir/StructureDefinition/replacesResource',
    replacementType:
      'http://medserve.online/fhir/StructureDefinition/replacementType',
    replacementDate:
      'http://medserve.online/fhir/StructureDefinition/replacementDate',
  }[name])

const typeForExtension = name =>
  ({
    medicationResourceType: 'valueCoding',
    medicationResourceReferenceStatus: 'valueCode',
    sourceCodeSystem: 'extension',
    sourceCodeSystemUri: 'valueUri',
    sourceCodeSystemVersion: 'valueString',
    parentMedication: 'valueReference',
    parentMedicationResources: 'extension',
    brand: 'valueCodeableConcept',
    isReplacedByResources: 'extension',
    isReplacedBy: 'valueReference',
    replacesResources: 'extension',
    replacesResource: 'valueReference',
    replacementType: 'valueCoding',
    replacementDate: 'valueDate',
  }[name])

export const urlForArtgId = id =>
  `http://search.tga.gov.au/s/search.html?collection=tga-artg&profile=record&meta_i=${id}`

// Inferred relationship types for different combinations of concept types.
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
    // MP -> substance
    // Unbranded product with strengths and form -> Substance
    case 'UPD-substance':
      return 'has-ingredient'
    // MPUU -> substance
    // Unbranded product with strengths and form -> Substance
    case 'UPDSF-substance':
      return 'has-boss'
    // TPUU -> substance
    // Branded product with strengths and form -> Substance
    case 'BPSF-substance':
      return 'has-boss'
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
        'replaced-by': 'are replaced by',
        'has-ingredient': 'have ingredient',
        'has-boss': 'have ingredient',
        replaces: 'replace',
        unknown: null,
      }[type]
    : {
        'is-a': 'is a subtype of',
        'has-updsf': 'has unit of use',
        'has-component': 'has component',
        'has-brand': 'has brand',
        'has-bpsf': 'has unit of use',
        'replaced-by': 'is replaced by',
        'has-ingredient': 'has ingredient',
        'has-boss': 'has ingredient',
        replaces: 'replaces',
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

// Conversion from `Medication/[id]` to id.
const referenceToId = reference => {
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

// Takes a `Reference` element and returns a `coding` element, containing a
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
const referenceToSnomedCoding = valueReference => {
  if (!valueReference) throw new Error('Missing valueReference.')
  return [
    {
      system: snomedUri,
      code: referenceToId(valueReference.reference),
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
