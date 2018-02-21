import { codingToSnomedCode, codingToGroupCode } from '../fhir/medication.js'

export const idForNode = node => {
  return node.type === 'group'
    ? `group-${codingToGroupCode(node.coding)}`
    : codingToSnomedCode(node.coding)
}
