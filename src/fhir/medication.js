// Get `{ code, display, type }` for the subject concept of a Medication
// resource.
export const getSubjectConcept = parsed => {
  const code = getSctCode(parsed)
  const resourceType = parsed.extension.find(
    extensionFilterFor('medicationResourceType')
  )
  validateMedicationResourceType(resourceType)
  const type = resourceType.valueCoding.code
  return { type, ...code }
}

export const getRelatedConcepts = (parsed, sourceConcept, sourceType) => {
  // Call the generator function and merge together the results into a single
  // object with all concepts and all relationships.
  const result = [
    ...getExtensionConcepts(parsed, sourceConcept, sourceType),
    ...getPackageConcepts(parsed, sourceConcept, sourceType),
  ].reduce(mergeConcepts, emptyConcepts())
  return result
}

function * getExtensionConcepts(node, sourceConcept, sourceType) {
  // Handle root of Medication resource being passed in.
  if (node.resourceType === 'Medication' && node.extension) {
    yield * getExtensionConcepts(node.extension, sourceConcept, sourceType)
  } else {
    // Get parent medication.
    const parentMedication = getParentMedication(
      node,
      sourceConcept,
      sourceType
    )
    yield parentMedication
    const parentConcept = parentMedication.concepts[0]
    const newSourceConcept = parentConcept ? parentConcept.code : sourceConcept
    const newSourceType = parentConcept ? parentConcept.type : sourceType
    // Get brand.
    yield getBrand(node, sourceConcept, sourceType)
    // Recurse into each "parents" array to extract the data from each level
    // of the hierarchy.
    for (const parents of node.filter(
      extensionFilterFor('parentMedicationResources')
    )) {
      yield * getExtensionConcepts(
        parents.extension,
        newSourceConcept,
        newSourceType
      )
    }
  }
}

function * getPackageConcepts(node, sourceConcept, sourceType) {
  // Handle root of Medication resource being passed in.
  if (node.resourceType === 'Medication' && node.package) {
    yield * getPackageConcepts(node.package, sourceConcept, sourceType)
  } else {
    try {
      for (const c of node.content) {
        const content = validatePackageContent(c)
        const code = referenceToCode(content.itemReference.reference)
        const display = content.itemReference.display
        yield {
          concepts: [{ code, display }],
          relationships: [
            {
              source: sourceConcept,
              target: code,
              type: 'contains',
            },
          ],
        }
      }
    } catch (error) {
      return emptyConcepts()
    }
  }
}

// Get code and display for the SNOMED code within the `code` element.
const getSctCode = node => {
  if (!node.code) throw new Error('Missing code element.')
  validateCoding(node.code.coding)
  const coding = node.code.coding.find(c => c.system === snomedUri)
  return { code: coding.code, display: coding.display }
}

// Get the code and type of a parent medication, and work out its relationship
// to a given source code.
const getParentMedication = (node, sourceConcept, sourceType) => {
  try {
    // Get the extension which provides the parent code itself.
    const parentMedication = node.find(extensionFilterFor('parentMedication'))
    validateParentMedication(parentMedication)
    // Get the extension which describes the resource type of the parent code.
    const resourceType = node.find(extensionFilterFor('medicationResourceType'))
    validateMedicationResourceType(resourceType)
    const reference = parentMedication.valueReference.reference
    // Convert the reference (Medication/[code]) to a code.
    const code = referenceToCode(reference)
    const display = parentMedication.valueReference.display
    const type = resourceType.valueCoding.code
    // Yield a structure with an array of concepts, and an array of
    // relationships. This will be merged with data found elsewhere in the
    // resource, and in other resources, later on.
    return {
      concepts: [{ type, code, display }],
      relationships: [
        {
          source: sourceConcept,
          target: code,
          type: relationshipTypeFor(sourceType, type),
        },
      ],
    }
  } catch (error) {
    // If `parentMedication` or `resourceType` are missing or malformed, don't
    // add anything to the result.
    return emptyConcepts()
  }
}

// Get brand information from within the extension.
const getBrand = (node, sourceConcept, sourceType) => {
  try {
    // Get the extension which provides the brand information.
    const brand = node.find(extensionFilterFor('brand'))
    validateBrand(brand)
    const coding = brand.valueCodeableConcept.coding.find(
      c => c.system === snomedUri
    )
    validateCoding(brand.valueCodeableConcept.coding)
    const code = coding.code
    const display = coding.display
    return {
      concepts: [{ type: 'brand', code, display }],
      relationships: [
        {
          source: sourceConcept,
          target: code,
          type: relationshipTypeFor(sourceType, 'brand'),
        },
      ],
    }
  } catch (error) {
    return { concepts: [], relationships: [] }
  }
}

const validateParentMedication = parentMedication => {
  if (!parentMedication) throw new Error('Missing parentMedication value.')
  if (!parentMedication.valueReference) {
    throw new Error('Missing parentMedication.valueReference.')
  }
  if (!parentMedication.valueReference.reference) {
    throw new Error('Missing parentMedication.valueReference.reference')
  }
  if (!parentMedication.valueReference.display) {
    throw new Error('Missing parentMedication.valueReference.display')
  }
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

const validateBrand = brand => {
  if (!brand) throw new Error('Missing brand value.')
  if (!brand.valueCodeableConcept) {
    throw new Error('Missing brand.valueCodeableConcept.')
  }
  return brand
}

const validateCoding = coding => {
  if (!coding) throw new Error('Missing coding.')
  for (const c of coding.filter(c => c.system === snomedUri)) {
    if (!c.code) throw new Error('Missing coding.code value.')
    if (!c.display) throw new Error('Missing coding.display value.')
  }
  return coding
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
  return content
}

const snomedUri = 'http://snomed.info/sct'

// Filter functions for finding different types of information within the
// extension.
const extensionFilterFor = key =>
  ({
    medicationResourceType: ext =>
      ext.url ===
      'http://medserve.online/fhir/StructureDefinition/medicationResourceType',
    parentMedication: ext =>
      ext.url ===
      'http://medserve.online/fhir/StructureDefinition/parentMedication',
    parentMedicationResources: ext =>
      ext.url ===
        'http://medserve.online/fhir/StructureDefinition/parentMedicationResources' &&
      ext.extension,
    brand: ext =>
      ext.url === 'http://medserve.online/fhir/StructureDefinition/brand',
  }[key])

// Relationship types for different combinations of concept types.
const relationshipTypeFor = (sourceType, targetType) => {
  switch (`${sourceType}-${targetType}`) {
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
    // TPP -> MPP
    // Branded package with no container -> Unbranded package with no container
    case 'BPG-UPG':
      return 'is-a'
    // MPP -> MPUU
    // Unbranded package with no container ->
    //   Unbranded product with strengths and form
    case 'UPG-UPDSF':
      return 'has-updsf'
    // MPUU -> MP
    // Unbranded product with strengths and form ->
    //   Unbranded product with no strengths or form
    case 'UPDSF-UBD':
      return 'is-a'
    default:
      return 'unknown'
  }
}

// Settings that control the set of resources requested for each given concept
// type.
export const resourceRequirementsFor = sourceType =>
  ({
    // CTPP requires retrieval of TPUU to get MPUU and MP.
    BPGC: ['BPSF'],
    // TPP requires retrieval of TPUU to get MPUU and MP.
    BPG: ['BPSF'],
    BPSF: [],
    // MPP requires retrieval of MPUU to get MP.
    UPG: ['UPDSF'],
    UPDSF: [],
    UPD: [],
  }[sourceType])

// Mapping from FHIR Medication type to AMT concept type.
export const amtConceptTypeFor = fhirType =>
  ({
    BPGC: 'CTPP',
    BPG: 'TPP',
    BPSF: 'TPUU',
    brand: 'TP',
    UPG: 'MPP',
    UPDSF: 'MPUU',
    UPD: 'MP',
  }[fhirType])

// Conversion from `Medication/[code]` to code.
const referenceToCode = reference => reference.split('/').slice(-1)[0]

// Merges a concept object `{ concepts: [], relationships: [] }` into an array
// of concept objects, minding uniqueness of concepts and relationships. If a
// concept or relationship is already existing, the values of its keys are
// assigned over the existing object.
export const mergeConcepts = (merged, object) => {
  let found
  for (const concept of object.concepts) {
    found = merged.concepts.findIndex(c => conceptHasCode(c, concept.code))
    if (found !== -1) {
      merged.concepts[found] = { ...merged.concepts[found], ...concept }
    } else merged.concepts.push(concept)
  }
  for (const relationship of object.relationships) {
    found = merged.relationships.findIndex(r =>
      relationshipHasSourceTarget(r, relationship.source, relationship.target)
    )
    if (found !== -1) {
      merged.relationships[found] = {
        ...merged.relationships[found],
        ...relationship,
      }
    } else merged.relationships.push(relationship)
  }
  return merged
}

// A concept's uniqueness is defined by its code.
const conceptHasCode = (concept, code) => concept.code === code

// A relationship's uniqueness is defined by its source and target codes.
const relationshipHasSourceTarget = (relationship, source, target) =>
  relationship.source === source && relationship.target === target

export const emptyConcepts = () => {
  return { concepts: [], relationships: [] }
}
