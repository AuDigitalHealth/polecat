import React from 'react'
import { storiesOf } from '@storybook/react'
import StoryRouter from 'storybook-router'

import FhirMedication from './FhirMedication.js'
import ctpp1 from '../test/ctpp-19481011000036105.json'
import tpuu1 from '../test/tpuu-6052011000036107.json'
import mp1 from '../test/mp-21360011000036101.json'
import childBundle1 from '../test/childBundle-21360011000036101.json'

const width = 800
const height = 800

storiesOf('FhirMedication', module)
  .addDecorator(StoryRouter())
  .add('With related resources', () => (
    <FhirMedication
      resource={ctpp1}
      relatedResources={{ '6052011000036107': tpuu1 }}
      viewport={{ width, height }}
    />
  ))
  .add('With child concepts', () => (
    <FhirMedication
      resource={mp1}
      childBundle={childBundle1}
      viewport={{ width, height }}
    />
  ))
