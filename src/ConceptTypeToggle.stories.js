import React from 'react'
import { storiesOf } from '@storybook/react'
import { host } from 'storybook-host'

import ConceptTypeToggle from './ConceptTypeToggle.js'

storiesOf('ConceptTypeToggle', module)
  .addDecorator(host({ width: '300px' }))
  .add('With label and no value', () => (
    <ConceptTypeToggle label='Concept type' />
  ))
  .add('With value', () => <ConceptTypeToggle value={[ 'CTPP', 'TPP', 'MPP' ]} />)
  .add('With label and value', () => (
    <ConceptTypeToggle label='Concept type' value={[ 'CTPP', 'TPP', 'MPP' ]} />
  ))
