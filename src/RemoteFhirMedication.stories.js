import React from 'react'
import { storiesOf } from '@storybook/react'
import StoryRouter from 'storybook-router'

import RemoteFhirMedication from './RemoteFhirMedication.js'
import config from '../public/config.json'

const width = 800
const height = 800

storiesOf('RemoteFhirMedication', module)
  .addDecorator(StoryRouter())
  .add('Lorapaed 1 mg/mL oral liquid solution, 150 mL, bottle (CTPP)', () => (
    <RemoteFhirMedication
      path='/Medication/60009011000036108'
      fhirServer={config.fhirServer}
      viewport={{ width, height }}
    />
  ))
  .add('Lorapaed 1 mg/mL oral liquid solution, 150 mL (TPP)', () => (
    <RemoteFhirMedication
      path='/Medication/55971011000036104'
      fhirServer={config.fhirServer}
      viewport={{ width, height }}
    />
  ))
  .add('Lorapaed 1 mg/mL oral liquid solution (TPUU)', () => (
    <RemoteFhirMedication
      path='/Medication/53743011000036103'
      fhirServer={config.fhirServer}
      viewport={{ width, height }}
    />
  ))
  .add('loratadine 1 mg/mL oral liquid, 150 mL (MPP)', () => (
    <RemoteFhirMedication
      path='/Medication/63589011000036105'
      fhirServer={config.fhirServer}
      viewport={{ width, height }}
    />
  ))
  .add('loratadine 1 mg/mL oral liquid (MPUU)', () => (
    <RemoteFhirMedication
      path='/Medication/62022011000036104'
      fhirServer={config.fhirServer}
      viewport={{ width, height }}
    />
  ))
  .add('loratadine (MP)', () => (
    <RemoteFhirMedication
      path='/Medication/21701011000036106'
      fhirServer={config.fhirServer}
      viewport={{ width, height }}
    />
  ))
  .add('loratadine (substance)', () => (
    <RemoteFhirMedication
      path='/Substance/2292011000036106'
      fhirServer={config.fhirServer}
      viewport={{ width, height }}
    />
  ))
