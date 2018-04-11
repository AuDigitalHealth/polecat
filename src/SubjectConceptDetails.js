import React, { Component } from 'react'
import PropTypes from 'prop-types'

import Concept from './Concept.js'
import CopyToClipboard from './CopyToClipboard.js'
import {
  codingToSnomedCode,
  codingToSnomedDisplay,
  codingToArtgId,
  urlForArtgId,
} from './fhir/medication.js'
import { humanisedStatus } from './amt/concept.js'
import { humaniseUri, humaniseVersion } from './snomed/core.js'

import './css/SubjectConceptDetails.css'

class SubjectConceptDetails extends Component {
  static propTypes = {
    coding: Concept.propTypes.coding,
    sourceCodeSystemUri: PropTypes.string,
    sourceCodeSystemVersion: PropTypes.string,
    status: Concept.propTypes.status,
    lastModified: PropTypes.string,
  }

  render() {
    const {
        coding,
        sourceCodeSystemUri,
        sourceCodeSystemVersion,
        status,
        lastModified,
      } = this.props,
      snomedCode = codingToSnomedCode(coding),
      snomedDisplay = codingToSnomedDisplay(coding),
      sourceCodeSystem = `${humaniseUri(
        sourceCodeSystemUri,
      )}, ${humaniseVersion(sourceCodeSystemUri, sourceCodeSystemVersion)}`,
      artgId = codingToArtgId(coding),
      shrimpLink = `https://ontoserver.csiro.au/shrimp?concept=${snomedCode}&system=${sourceCodeSystemUri}&version=${sourceCodeSystemVersion}`
    return (
      <div className="subject-concept-details">
        {snomedCode ? (
          <div className="row">
            <div className="field-name">SCTID</div>
            <div className="field-value">
              {snomedCode}
              <CopyToClipboard
                copyText={snomedCode}
                title="Copy SCTID to clipboard"
              />
            </div>
          </div>
        ) : null}
        {snomedDisplay ? (
          <div className="row">
            <div className="field-name">Preferred term</div>
            <div className="field-value">
              {snomedDisplay}
              <CopyToClipboard
                copyText={snomedDisplay}
                title="Copy preferred term to clipboard"
              />
            </div>
          </div>
        ) : null}
        {sourceCodeSystemUri && sourceCodeSystemVersion ? (
          <div className="row">
            <div className="field-name" title="Source code system">
              Source
            </div>
            <div className="field-value">
              {sourceCodeSystem}
              <CopyToClipboard
                copyText={sourceCodeSystem}
                title="Copy source code system to clipboard"
              />
            </div>
          </div>
        ) : null}
        {status ? (
          <div className="row">
            <div className="field-name">Status</div>
            <div className="field-value">{humanisedStatus(status)}</div>
          </div>
        ) : null}
        {artgId ? (
          <div className="row">
            <div className="field-name">ARTG ID</div>
            <div className="field-value">
              <a
                href={urlForArtgId(artgId)}
                title={`ARTG ID ${artgId} on the TGA website`}
                target="_blank"
              >
                {artgId}
              </a>
              <CopyToClipboard
                copyText={artgId}
                title="Copy ARTG ID to clipboard"
              />
            </div>
          </div>
        ) : null}
        {lastModified ? (
          <div className="row">
            <div className="field-name">Last modified</div>
            <div className="field-value">
              {lastModified}
              <CopyToClipboard
                copyText={lastModified}
                title="Copy last modified date to clipboard"
              />
            </div>
          </div>
        ) : null}
        <div className="row">
          <div className="field-name">Links</div>
          <div className="field-value">
            <a href={shrimpLink} target="_blank">
              View it on Shrimp
            </a>
          </div>
        </div>
      </div>
    )
  }
}

export default SubjectConceptDetails
