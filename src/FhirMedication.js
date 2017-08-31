import React, { Component } from 'react'
import PropTypes from 'prop-types'
import isEqual from 'lodash.isequal'

import AmtProductModel from './AmtProductModel.js'
import { getResource, getRelatedResources } from './fhir/medication.js'

class FhirMedication extends Component {
  static propTypes = {
    resource: PropTypes.object,
    relatedResources: PropTypes.object,
    onRequireRelatedResource: PropTypes.func,
  }

  constructor(props) {
    super(props)
    this.state = {}
  }

  parseResources(props) {
    const { resource } = props
    if (resource) {
      const focused = getResource(resource)
      focused.focused = true
      const {
        concepts,
        relationships,
      } = getRelatedResources(resource, focused.code, focused.type, [
        'BPGC',
        'BPG',
        'BPSF',
        'brand',
        'UPG',
        'UBDSF',
        'UPD',
      ])
      concepts.push(focused)
      // TODO: Loop through relatedResources and merge data with data from
      // primary resource.
      this.setState(() => ({ concepts, relationships }))
    }
  }

  componentWillMount() {
    this.parseResources(this.props)
  }

  componentWillReceiveProps(nextProps) {
    if (!isEqual(this.props.resource, nextProps.resource)) {
      this.parseResources(nextProps)
    }
  }

  render() {
    const { concepts, relationships } = this.state
    return <AmtProductModel nodes={concepts} links={relationships} />
  }
}

export default FhirMedication
