import React from 'react'
import { storiesOf } from '@storybook/react'

import ConceptType from './ConceptType.js'
import { amtConceptTypes } from './fhir/medication.js'

const stories = storiesOf('ConceptType', module)

for (const type of amtConceptTypes.concat([
  'active',
  'inactive',
  'entered-in-error',
])) {
  stories.add(`${type}`, () => <ConceptType type={type} />)
}

for (const status of ['active', 'inactive', 'entered-in-error']) {
  stories.add(`CTPP (${status})`, () => (
    <ConceptType type="CTPP" status={status} />
  ))
}

stories
  .add('MPP (disabled)', () => <ConceptType type="MPP" enabled={false} />)
  .add('active (disabled)', () => <ConceptType type="active" enabled={false} />)
