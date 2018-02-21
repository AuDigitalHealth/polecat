import {
  amtConceptTypeFor,
  fhirMedicationTypeFor,
  relationshipTypeFor,
  codingToSnomedCode,
  conceptsHaveSameCoding,
} from '../fhir/medication.js'
import { idForNode } from '../graph/common.js'

// Cleans up relationships in service of presenting a legible graph that
// resembles the AMT product model.
export const translateToAmt = (concepts, { filters = [] } = {}) => {
  const tpsResolved = resolveTp(concepts)
  const tpuusResolved = resolveTpuu(tpsResolved)
  const mpuusResolved = resolveMpuu(tpuusResolved)
  return applyFilters(mpuusResolved, filters)
}

// Pre-defined filters for use in screening out classes of concepts within an
// AMT product model.
const filters = {
  substance: concept => concept.type !== fhirMedicationTypeFor('substance'),
  mp: concept => concept.type !== fhirMedicationTypeFor('MP'),
  'parent-of-mp': (concept, concepts) =>
    // Filter any concept that is an MP that has a child MP.
    !(
      concept.type === fhirMedicationTypeFor('MP') &&
      concepts.relationships.find(r =>
        relationshipMatchesTargetIdAndType(
          r,
          'MP',
          idForNode(concept),
          concepts.concepts,
        ),
      )
    ),
  mpuu: concept => concept.type !== fhirMedicationTypeFor('MPUU'),
  'parent-of-mpuu': (concept, concepts) =>
    // Filter any concept that is an MPUU that has a child MPUU.
    !(
      concept.type === fhirMedicationTypeFor('MPUU') &&
      concepts.relationships.find(r =>
        relationshipMatchesTargetIdAndType(
          r,
          'MPUU',
          idForNode(concept),
          concepts.concepts,
        ),
      )
    ),
  mpp: concept => concept.type !== fhirMedicationTypeFor('MPP'),
  'parent-of-mpp': (concept, concepts) =>
    // Filter any concept that is an MPP that has a child MPP.
    !(
      concept.type === fhirMedicationTypeFor('MPP') &&
      concepts.relationships.find(r =>
        relationshipMatchesTargetIdAndType(
          r,
          'MPP',
          idForNode(concept),
          concepts.concepts,
        ),
      )
    ),
  tp: concept => concept.type !== fhirMedicationTypeFor('TP'),
  tpuu: concept => concept.type !== fhirMedicationTypeFor('TPUU'),
  tpp: concept => concept.type !== fhirMedicationTypeFor('TPP'),
  'component-pack': (concept, concepts) =>
    // Filter any concept that is the target of a `has-component` relationship.
    !concepts.relationships.find(
      r => r.type === 'has-component' && r.target === idForNode(concept),
    ),
  replaces: (concept, concepts) =>
    // Filter any concept that is the target of a `replaces` relationship.
    !concepts.relationships.find(
      r => r.type === 'replaces' && r.target === idForNode(concept),
    ),
  'replaced-by': (concept, concepts) =>
    // Filter any concept that is the target of a `replaces` relationship.
    !concepts.relationships.find(
      r => r.type === 'replaced-by' && r.target === idForNode(concept),
    ),
}

// Filters a concepts object ({ concepts, relationships }) using a set of
// pre-defined filters.
const applyFilters = (concepts, filtersToApply) => {
  let filteredConcepts = concepts.concepts
  for (const filter of filtersToApply) {
    if (filters[filter]) {
      // Never filter the focused concept.
      filteredConcepts = filteredConcepts.filter(
        c => c.focused || filters[filter](c, concepts),
      )
    }
  }
  if (filtersToApply.length > 0) {
    let result = {
      concepts: filteredConcepts,
      relationships: concepts.relationships,
    }
    result = cleanUpOrphanedConcepts(result)
    return cleanUpHangingRelationships(result)
  } else return concepts
}

// Takes a concepts object ({ concepts, relationships }) and filters out any
// relationships for which either the source or the target don't exist.
const cleanUpHangingRelationships = concepts => {
  const conceptIds = concepts.concepts.map(c => idForNode(c))
  return {
    concepts: concepts.concepts,
    relationships: concepts.relationships.filter(
      r => conceptIds.includes(r.source) && conceptIds.includes(r.target),
    ),
  }
}

// Takes a concepts object ({ concepts, relationships }) and filters out any
// concepts that are not connected to the subject concept.
const cleanUpOrphanedConcepts = concepts => {
  const subjectConcept = concepts.concepts.find(c => c.focused)
  return {
    // We need to walk the graph both ways, relationships pointing to the
    // concept and relationships pointing away from it.
    concepts: concepts.concepts.filter(
      c =>
        pathBetweenConcepts(subjectConcept, c, concepts) ||
        pathBetweenConcepts(c, subjectConcept, concepts),
    ),
    relationships: concepts.relationships,
  }
}

// Tests whether a path can be walked between two concepts, traversing
// relationships from source to target.
const pathBetweenConcepts = (origin, destination, concepts) => {
  if (conceptsHaveSameCoding(origin, destination)) return true
  const relationships = concepts.relationships.filter(
    r => r.source === idForNode(origin),
  )
  for (const rel of relationships) {
    const newOrigin = concepts.concepts.find(c => idForNode(c) === rel.target)
    if (!newOrigin) continue
    const result = pathBetweenConcepts(newOrigin, destination, concepts)
    // If we get to a dead end, we keep seeking along other paths.
    if (result) return result
    else continue
  }
  return false
}

// Removes any relationships between CTPPs and TPs, relocating them to be
// between the TPP and the TP instead.
const resolveTp = concepts => {
  let newRelationships = concepts.relationships
  const ctppTps = concepts.relationships.filter(r =>
    relationshipMatchesTypes(r, 'CTPP', 'TP', concepts.concepts),
  )
  ctppTps.forEach(ctppTp => {
    const ctpp = ctppTp.source
    const ctppTpp = concepts.relationships.find(r =>
      relationshipMatchesSourceIdAndType(r, ctpp, 'TPP', concepts.concepts),
    )
    if (ctppTpp) {
      const tpp = ctppTpp.target
      const tp = ctppTp.target
      const tppTp = concepts.relationships.find(r =>
        relationshipMatchesIds(r, tpp, tp),
      )
      if (!tppTp) {
        newRelationships = newRelationships.concat([
          {
            source: tpp,
            target: tp,
            type: relationshipTypeFor(
              fhirMedicationTypeFor('TPP'),
              fhirMedicationTypeFor('TP'),
            ),
          },
        ])
      }
      newRelationships = newRelationships.filter(
        r => !relationshipMatchesIds(r, ctpp, tp),
      )
    }
  })
  return { ...concepts, relationships: newRelationships }
}

// Removes any relationships between CTPPs and TPUUs, relocating them to be
// between the TPP and the TPUU instead.
const resolveTpuu = concepts => {
  let newRelationships = concepts.relationships
  const ctppTpuus = concepts.relationships.filter(r =>
    relationshipMatchesTypes(r, 'CTPP', 'TPUU', concepts.concepts),
  )
  ctppTpuus.forEach(ctppTpuu => {
    const ctpp = ctppTpuu.source
    const ctppTpp = concepts.relationships.find(r =>
      relationshipMatchesSourceIdAndType(r, ctpp, 'TPP', concepts.concepts),
    )
    if (ctppTpp) {
      const tpp = ctppTpp.target
      const tpuu = ctppTpuu.target
      const tppTpuu = concepts.relationships.find(r =>
        relationshipMatchesIds(r, tpp, tpuu),
      )
      if (!tppTpuu) {
        newRelationships = newRelationships.concat([
          {
            source: tpp,
            target: tpuu,
            type: relationshipTypeFor(
              fhirMedicationTypeFor('TPP'),
              fhirMedicationTypeFor('TPUU'),
            ),
          },
        ])
      }
      newRelationships = newRelationships.filter(
        r => !relationshipMatchesIds(r, ctpp, tpuu),
      )
    }
  })
  return { ...concepts, relationships: newRelationships }
}

// Filters out the TPUU-MPUU relationship, where there is already a relationship
// between the TPP and MPP represented on the graph.
const resolveMpuu = concepts => {
  let newRelationships = concepts.relationships
  const tppTpuus = concepts.relationships.filter(r =>
    relationshipMatchesTypes(r, 'TPP', 'TPUU', concepts.concepts),
  )
  tppTpuus.forEach(tppTpuu => {
    const tpuu = tppTpuu.target
    const tpp = tppTpuu.source
    const tpuuMpuu = concepts.relationships.find(r =>
      relationshipMatchesSourceIdAndType(r, tpuu, 'MPUU', concepts.concepts),
    )
    const tppMpp = concepts.relationships.find(r =>
      relationshipMatchesSourceIdAndType(r, tpp, 'MPP', concepts.concepts),
    )
    if (tpuuMpuu && tppMpp) {
      const mpp = tppMpp.target
      const mpuu = tpuuMpuu.target
      newRelationships = newRelationships.concat([
        {
          source: mpp,
          target: mpuu,
          type: relationshipTypeFor(
            fhirMedicationTypeFor('MPP'),
            fhirMedicationTypeFor('MPUU'),
          ),
        },
      ])
      newRelationships = newRelationships.filter(
        r => !relationshipMatchesIds(r, tpuu, mpuu, concepts.concepts),
      )
    }
  })
  return { ...concepts, relationships: newRelationships }
}

const relationshipMatchesIds = (relationship, matchSource, matchTarget) => {
  return (
    relationship.source === matchSource && relationship.target === matchTarget
  )
}

// Returns true if the supplied relationship matches the types specified for the
// source and the target. Requires the concepts array also, so that it can look
// up the types.
const relationshipMatchesTypes = (
  relationship,
  matchSource,
  matchTarget,
  concepts,
) => {
  const source = concepts.find(
    c => codingToSnomedCode(c.coding) === relationship.source,
  )
  if (!source) return false
  const target = concepts.find(
    c => codingToSnomedCode(c.coding) === relationship.target,
  )
  if (!target) return false
  return (
    amtConceptTypeFor(source.type) === matchSource &&
    amtConceptTypeFor(target.type) === matchTarget
  )
}

// Returns true if the supplied relationship has a source concept with an ID
// matching that in the `matchSource` argument, and has a target concept with
// the type supplied in the `matchTarget` argument. Requires the concepts array
// so that it can look up the type of the target.
const relationshipMatchesSourceIdAndType = (
  relationship,
  matchSource,
  matchTarget,
  concepts,
) => {
  const target = concepts.find(
    c => codingToSnomedCode(c.coding) === relationship.target,
  )
  if (!target) return false
  return (
    relationship.source === matchSource &&
    amtConceptTypeFor(target.type) === matchTarget
  )
}

// Returns true if the supplied relationship has a target concept with an ID
// matching that in the `matchTarget` argument, and has a source concept with
// the type supplied in the `matchSource` argument. Requires the concepts array
// so that it can look up the type of the target.
const relationshipMatchesTargetIdAndType = (
  relationship,
  matchSource,
  matchTarget,
  concepts,
) => {
  const source = concepts.find(
    c => codingToSnomedCode(c.coding) === relationship.source,
  )
  if (!source) return false
  return (
    relationship.target === matchTarget &&
    amtConceptTypeFor(source.type) === matchSource
  )
}
