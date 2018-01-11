import {
  getSubjectConcept,
  codingToSnomedCode,
  relationshipTypeFor,
  amtConceptTypeFor,
  groupUri,
  emptyConcepts,
} from './medication.js'
import { queryFromSearchObject } from './search.js'
import { sha256 } from '../util.js'

// Get concepts from the supplied bundle, relating them to the subject concept.
export async function getBundleConcepts(subject, bundle, options = {}) {
  const { groupingThreshold = 3, groupRelationshipType = 'is-a' } = options
  if (!bundle || bundle.total === 0) return emptyConcepts()
  if (bundle.total <= groupingThreshold) {
    return bundle.entry.reduce((acc, e) => {
      const child = getSubjectConcept(e.resource)
      acc.concepts.push(child)
      acc.relationships.push({
        source: codingToSnomedCode(child.coding),
        target: codingToSnomedCode(subject.coding),
        type: relationshipTypeFor(child.type, subject.type),
      })
      return acc
    }, emptyConcepts())
  } else {
    const concepts = bundle.entry
      .slice(0, groupingThreshold)
      .map(e => getSubjectConcept(e.resource))
    // The group's code is a hash of the concept data within the group.
    const groupCode = await sha256(JSON.stringify(concepts))
    const query = queryForGrouping(
      subject.coding,
      groupRelationshipType,
      concepts[0].type,
    )
    return {
      concepts: [
        {
          coding: [{ system: groupUri, code: groupCode }],
          type: 'group',
          total: bundle.total,
          query,
          concepts,
        },
      ],
      relationships: [
        {
          // A `group-` prefix is added to the group code within the
          // relationships so that it can be discerned when drawing curves and
          // arrows.
          source: `group-${groupCode}`,
          target: codingToSnomedCode(subject.coding),
          type: groupRelationshipType,
        },
      ],
    }
  }
}

const queryForGrouping = (coding, relationshipType, childType) => {
  switch (relationshipType) {
    case `has-component`:
      return queryFromSearchObject({
        package: coding,
        type: amtConceptTypeFor(childType),
      })
    default:
      return queryFromSearchObject({
        parent: coding,
        type: amtConceptTypeFor(childType),
      })
  }
}

export const nextLinkFromBundle = bundle => {
  if (!bundle || !bundle.link) return null
  const next = bundle.link.find(l => l.relation === 'next')
  if (!next || !next.url) return null
  return next.url
}

export const previousLinkFromBundle = bundle => {
  if (!bundle || !bundle.link) return null
  const previous = bundle.link.find(l => l.relation === 'previous')
  if (!previous || !previous.url) return null
  return previous.url
}
