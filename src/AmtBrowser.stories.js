import React from 'react'
import { storiesOf } from '@storybook/react'

import AmtBrowser from './AmtBrowser.js'
import config from '../public/config.json'

const width = 800
const height = 800

storiesOf('AmtBrowser', module)
  .add('Lorapaed 1 mg/mL oral liquid solution, 150 mL, bottle (CTPP)', () => (
    <AmtBrowser
      location={{ pathname: '/Medication/60009011000036108' }}
      config={config}
      viewport={{ width, height }}
    />
  ))
  .add('Lorapaed 1 mg/mL oral liquid solution, 150 mL (TPP)', () => (
    <AmtBrowser
      location={{ pathname: '/Medication/55971011000036104' }}
      config={config}
      viewport={{ width, height }}
    />
  ))
  .add('Lorapaed 1 mg/mL oral liquid solution (TPUU)', () => (
    <AmtBrowser
      location={{ pathname: '/Medication/53743011000036103' }}
      config={config}
      viewport={{ width, height }}
    />
  ))
  .add('loratadine 1 mg/mL oral liquid, 150 mL (MPP)', () => (
    <AmtBrowser
      location={{ pathname: '/Medication/63589011000036105' }}
      config={config}
      viewport={{ width, height }}
    />
  ))
  .add('loratadine 1 mg/mL oral liquid (MPUU)', () => (
    <AmtBrowser
      location={{ pathname: '/Medication/62022011000036104' }}
      config={config}
      viewport={{ width, height }}
    />
  ))
  .add('loratadine (MP)', () => (
    <AmtBrowser
      location={{ pathname: '/Medication/21701011000036106' }}
      config={config}
      viewport={{ width, height }}
    />
  ))
  .add('loratadine (substance)', () => (
    <AmtBrowser
      location={{ pathname: '/Substance/2292011000036106' }}
      config={config}
      viewport={{ width, height }}
    />
  ))
