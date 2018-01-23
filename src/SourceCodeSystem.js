import React, { Component } from 'react'
import PropTypes from 'prop-types'

import {
  snomedUri,
  auEditionId,
  internationalEditionId,
} from './snomed/core.js'
import { parseUri } from './util.js'
import './css/SourceCodeSystem.css'

class SourceCodeSystem extends Component {
  static propTypes = {
    uri: PropTypes.string.isRequired,
    version: PropTypes.string.isRequired,
  }

  humaniseUri(uri) {
    return uri === snomedUri ? 'SNOMED CT' : uri
  }

  humaniseVersion(uri, version) {
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

  render() {
    const { uri, version } = this.props
    return (
      <div className="source-code-system">
        Source: {this.humaniseUri(uri)}, {this.humaniseVersion(uri, version)}
      </div>
    )
  }
}

export default SourceCodeSystem
