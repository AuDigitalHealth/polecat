import verhoeff from 'verhoeff'

export const isValidSctid = sctid => {
  let int
  try {
    int = parseInt(sctid)
  } catch (e) {
    return false
  }
  if (int <= 10 ** 5 || int > 10 ** 18) return false
  const partitionId = sctid.slice(-3, -1)
  if (!['00', '01', '02', '10', '11', '12'].includes(partitionId)) return false
  return verhoeff.validate(sctid)
}
