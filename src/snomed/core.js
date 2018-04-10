import { parseUri } from '../util.js'

export const snomedUri = 'http://snomed.info/sct'

export const auEditionId = '32506021000036107'
export const internationalEditionId = '900000000000207008'

export const humaniseUri = uri => {
  return uri === snomedUri ? 'SNOMED CT' : uri
}

export const humaniseVersion = (uri, version) => {
  if (uri !== snomedUri) return version
  const parsed = parseUri(version),
    versionUri = decodeURIComponent(parsed.queryKey.version),
    path = versionUri.split(snomedUri + '/')[1],
    [edition, release] = path.split('/version/'),
    editionDisplay = {
      [auEditionId]: 'Australian',
      [internationalEditionId]: 'International',
    }[edition]
  if (!edition) return versionUri
  return `${editionDisplay} Edition (${release})`
}
