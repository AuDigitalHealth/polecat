import {
  amtConceptTypeFor,
  fhirMedicationTypeFor,
  relationshipTypeFor,
  codingToSnomedCode,
} from './medication.js'

// Cleans up relationships in service of presenting a legible graph that
// resembles the AMT product model.
export const translateToAmt = concepts => {
  const tpsResolved = resolveTp(concepts)
  const tpuusResolved = resolveTpuu(tpsResolved)
  return resolveMpuu(tpuusResolved)
  // return concepts
}

// Removes any relationships between CTPPs and TPs, relocating them to be
// between the TPP and the TP instead.
const resolveTp = concepts => {
  let newRelationships = concepts.relationships
  const ctppTps = concepts.relationships.filter(r =>
    relationshipMatchesTypes(r, 'CTPP', 'TP', concepts.concepts)
  )
  ctppTps.forEach(ctppTp => {
    const ctpp = ctppTp.source
    const ctppTpp = concepts.relationships.find(r =>
      relationshipMatchesIdAndType(r, ctpp, 'TPP', concepts.concepts)
    )
    if (ctppTpp) {
      const tpp = ctppTpp.target
      const tp = ctppTp.target
      const tppTp = concepts.relationships.find(r =>
        relationshipMatchesIds(r, tpp, tp)
      )
      if (!tppTp) {
        newRelationships = newRelationships.concat([
          {
            source: tpp,
            target: tp,
            type: relationshipTypeFor(
              fhirMedicationTypeFor('TPP'),
              fhirMedicationTypeFor('TP')
            ),
          },
        ])
      }
      newRelationships = newRelationships.filter(
        r => !relationshipMatchesIds(r, ctpp, tp)
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
    relationshipMatchesTypes(r, 'CTPP', 'TPUU', concepts.concepts)
  )
  ctppTpuus.forEach(ctppTpuu => {
    const ctpp = ctppTpuu.source
    const ctppTpp = concepts.relationships.find(r =>
      relationshipMatchesIdAndType(r, ctpp, 'TPP', concepts.concepts)
    )
    if (ctppTpp) {
      const tpp = ctppTpp.target
      const tpuu = ctppTpuu.target
      const tppTpuu = concepts.relationships.find(r =>
        relationshipMatchesIds(r, tpp, tpuu)
      )
      if (!tppTpuu) {
        newRelationships = newRelationships.concat([
          {
            source: tpp,
            target: tpuu,
            type: relationshipTypeFor(
              fhirMedicationTypeFor('TPP'),
              fhirMedicationTypeFor('TPUU')
            ),
          },
        ])
      }
      newRelationships = newRelationships.filter(
        r => !relationshipMatchesIds(r, ctpp, tpuu)
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
    relationshipMatchesTypes(r, 'TPP', 'TPUU', concepts.concepts)
  )
  tppTpuus.forEach(tppTpuu => {
    const tpuu = tppTpuu.target
    const tpp = tppTpuu.source
    const tpuuMpuu = concepts.relationships.find(r =>
      relationshipMatchesIdAndType(r, tpuu, 'MPUU', concepts.concepts)
    )
    const tppMpp = concepts.relationships.find(r =>
      relationshipMatchesIdAndType(r, tpp, 'MPP', concepts.concepts)
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
            fhirMedicationTypeFor('MPUU')
          ),
        },
      ])
      newRelationships = newRelationships.filter(
        r => !relationshipMatchesIds(r, tpuu, mpuu, concepts.concepts)
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

const relationshipMatchesTypes = (
  relationship,
  matchSource,
  matchTarget,
  concepts
) => {
  const source = concepts.find(
    c => codingToSnomedCode(c.coding) === relationship.source
  )
  if (!source) return false
  const target = concepts.find(
    c => codingToSnomedCode(c.coding) === relationship.target
  )
  if (!target) return false
  return (
    amtConceptTypeFor(source.type) === matchSource &&
    amtConceptTypeFor(target.type) === matchTarget
  )
}

const relationshipMatchesIdAndType = (
  relationship,
  matchSource,
  matchTarget,
  concepts
) => {
  const target = concepts.find(
    c => codingToSnomedCode(c.coding) === relationship.target
  )
  if (!target) return false
  return (
    relationship.source === matchSource &&
    amtConceptTypeFor(target.type) === matchTarget
  )
}
