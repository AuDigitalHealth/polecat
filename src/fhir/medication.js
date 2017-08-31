import difference from 'lodash.difference'
import uniq from 'lodash.uniq'

const snomedUri = 'http://snomed.info/sct'

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

const resourceRequirementsFor = sourceType =>
  ({
    // CTPP requires retrieval of TPUU to get MPUU and MP.
    BPGC: {
      UPDSF: 'BPSF',
      UPD: 'BPSF',
    },
    // TPP requires retrieval of TPUU to get MPUU and MP.
    BPG: {
      UPDSF: 'BPSF',
      UPD: 'BPSF',
    },
    BPSF: {},
    UPG: {
      UPD: 'UPDSF',
    },
    UPDSF: {},
    UPD: {},
  }[sourceType])

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

export const getResource = parsed => {
  const code = getSctCode(parsed)
  const resourceType = parsed.extension.find(
    extensionFilterFor('medicationResourceType')
  )
  validateMedicationResourceType(resourceType)
  const type = resourceType.valueCoding.code
  return { type, ...code }
}

const getSctCode = node => {
  if (!node.code) throw new Error('Missing code element.')
  validateCoding(node.code.coding)
  const coding = node.code.coding.find(c => c.system === snomedUri)
  return { code: coding.code, display: coding.display }
}

export const getRelatedResources = (
  parsed,
  sourceConcept,
  sourceType,
  requiredResourceTypes,
  initialRelatedResources = { concepts: [], relationships: [] }
) => {
  console.log('getRelatedResources', {
    parsed,
    sourceConcept,
    sourceType,
    requiredResourceTypes,
    initialRelatedResources,
  })
  // Call the generator function and merge together the results into a single
  // object with all concepts and all relationships.
  const result = [
    ...generateRelatedResources(parsed, sourceConcept, sourceType),
  ].reduce((merged, item, initialRelatedResources) => {
    item.concepts = merged.concepts.concat(item.concepts)
    item.relationships = merged.relationships.concat(item.relationships)
    return item
  })
  // Calculate the resources that still need to be parsed in order to get all of
  // the related concept types that are required.
  result.resourcesStillNeeded = uniq(
    difference(requiredResourceTypes, result.concepts.map(obj => obj.type))
      .reduce(
        (acc, item) => acc.concat([resourceRequirementsFor(sourceType)[item]]),
        []
      )
      .filter(item => item)
  )
  return result
}

function * generateRelatedResources(node, sourceConcept, sourceType) {
  console.log('generateRelatedResources', { node, sourceConcept, sourceType })
  // Handle root of Medication resource being passed in.
  if (node.resourceType === 'Medication' && node.extension) {
    yield * generateRelatedResources(node.extension, sourceConcept, sourceType)
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
      yield * generateRelatedResources(
        parents.extension,
        newSourceConcept,
        newSourceType
      )
    }
  }
}

const getParentMedication = (node, sourceConcept, sourceType) => {
  console.log('getParentMedication', { node, sourceConcept, sourceType })
  try {
    // Get the extension which provides the parent code itself.
    const parentMedication = node.find(extensionFilterFor('parentMedication'))
    validateParentMedication(parentMedication)
    // Get the extension which describes the resource type of the parent code.
    const resourceType = node.find(extensionFilterFor('medicationResourceType'))
    validateMedicationResourceType(resourceType)
    const reference = parentMedication.valueReference.reference
    // Convert the reference (Medication/[code]) to a code.
    const code = reference.split('/').slice(-1)[0]
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
    return { concepts: [], relationships: [] }
  }
}

const getBrand = (node, sourceConcept, sourceType) => {
  console.log('getBrand', { node, sourceConcept, sourceType })
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
}

const validateBrand = brand => {
  if (!brand) throw new Error('Missing brand value.')
  if (!brand.valueCodeableConcept) {
    throw new Error('Missing brand.valueCodeableConcept.')
  }
}

const validateCoding = coding => {
  if (!coding) throw new Error('Missing coding.')
  for (const c of coding.filter(c => c.system === snomedUri)) {
    if (!c.code) throw new Error('Missing coding.code value.')
    if (!c.display) throw new Error('Missing coding.display value.')
  }
}
