import React from 'react'
import { storiesOf } from '@storybook/react'
import { host } from 'storybook-host'

import ConceptTypeToggle from './ConceptTypeToggle.js'
import { amtConceptTypes } from './fhir/medication.js'

const types1 = amtConceptTypes.filter(t => t !== 'substance' && t !== 'TP')
const types2 = ['active', 'inactive', 'entered-in-error']

storiesOf('ConceptTypeToggle', module)
  .addDecorator(host({ width: '300px' }))
  .add('With label and no value', () => (
    <ConceptTypeToggle types={types1} label="Concept type" />
  ))
  .add('With value', () => (
    <ConceptTypeToggle types={types1} value={['CTPP', 'TPP', 'MPP']} />
  ))
  .add('With label and value', () => (
    <ConceptTypeToggle
      types={types1}
      label="Concept type"
      value={['CTPP', 'TPP', 'MPP']}
    />
  ))
  .add('Statuses', () => (
    <ConceptTypeToggle types={types2} label="Concept status" />
  ))
