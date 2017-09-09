import {
  amtConceptTypeFor,
  fhirMedicationTypeFor,
  relationshipTypeFor,
} from './medication.js'

export const translateToAmt = concepts => {
  const tpsResolved = resolveTP(concepts)
  return resolveTPUU(tpsResolved)
}

const resolveTP = concepts => {
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

const resolveTPUU = concepts => {
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
  const source = concepts.find(c => c.code === relationship.source)
  if (!source) return false
  const target = concepts.find(c => c.code === relationship.target)
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
  const target = concepts.find(c => c.code === relationship.target)
  if (!target) return false
  return (
    relationship.source === matchSource &&
    amtConceptTypeFor(target.type) === matchTarget
  )
}