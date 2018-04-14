import React, { Component } from 'react'
import PropTypes from 'prop-types'

import Concept from './Concept.js'
import CopyToClipboard from './CopyToClipboard.js'
import Icon from './Icon.js'
import PBSDetails from './PBSDetails.js'
import {
  codingToSnomedCode,
  codingToSnomedDisplay,
  codingToArtgIds,
  urlForArtgId,
  fhirConceptTypes,
} from './fhir/medication.js'
import { humanisedStatus } from './amt/concept.js'
import { humaniseUri, humaniseVersion } from './snomed/core.js'
import { capitalise } from './util.js'

import './css/SubjectConceptDetails.css'

class SubjectConceptDetails extends Component {
  static propTypes = {
    coding: Concept.propTypes.coding,
    type: PropTypes.oneOf(fhirConceptTypes),
    sourceCodeSystemUri: PropTypes.string,
    sourceCodeSystemVersion: PropTypes.string,
    status: Concept.propTypes.status,
    lastModified: PropTypes.string,
    subsidy: PropTypes.array,
  }

  shrimpLink(code, system, version) {
    return `https://ontoserver.csiro.au/shrimp?concept=${code}&system=${system}&version=${version}`
  }

  wikipediaLink(display) {
    return `https://en.wikipedia.org/wiki/${capitalise(display)}`
  }

  render() {
    const {
        coding,
        sourceCodeSystemUri,
        sourceCodeSystemVersion,
        type,
        status,
        lastModified,
        subsidy,
      } = this.props,
      snomedCode = codingToSnomedCode(coding),
      snomedDisplay = codingToSnomedDisplay(coding),
      sourceCodeSystem = `${humaniseUri(
        sourceCodeSystemUri,
      )}, ${humaniseVersion(sourceCodeSystemUri, sourceCodeSystemVersion)}`,
      artgIds = codingToArtgIds(coding),
      shrimpLink = this.shrimpLink(
        snomedCode,
        sourceCodeSystemUri,
        sourceCodeSystemVersion,
      ),
      wikipediaLink = this.wikipediaLink(snomedDisplay)
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
        {artgIds.length > 0 ? (
          <div className="row">
            <div className="field-name">ARTG ID</div>
            <div className="field-value">
              {artgIds.map(artgId => (
                <div key={artgId}>
                  <a
                    href={urlForArtgId(artgId)}
                    title={`ARTG ID ${artgId} on the TGA website`}
                    target="_blank"
                  >
                    {artgId}
                    <Icon type="external-link" width={11} height={11} />
                  </a>
                  <CopyToClipboard
                    copyText={artgId}
                    title="Copy ARTG ID to clipboard"
                  />
                </div>
              ))}
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
            <div>
              <a href={shrimpLink} target="_blank">
                View it on Shrimp<Icon
                  type="external-link"
                  width={11}
                  height={11}
                />
              </a>
            </div>
            <div>
              {type === 'substance' ? (
                <a href={wikipediaLink} target="_blank">
                  {`\u201C${capitalise(snomedDisplay)}\u201D on Wikipedia`}
                  <Icon type="external-link" width={11} height={11} />
                </a>
              ) : null}
            </div>
          </div>
        </div>
        {subsidy.length > 0 ? <PBSDetails subsidy={subsidy} /> : null}
      </div>
    )
  }
}

export default SubjectConceptDetails
