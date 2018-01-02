import React from 'react'
import { storiesOf } from '@storybook/react'
import { host } from 'storybook-host'

import AmtBrowser from './AmtBrowser.js'
import config from '../test/config.js'

const width = 800
const height = 800

storiesOf('AmtBrowser', module)
  .addDecorator(
    host({ width: '802px', height: '802px', border: '1px solid #ccc' })
  )
  .add('Lorapaed 1 mg/mL oral liquid solution, 150 mL, bottle (CTPP)', () => (
    <AmtBrowser
      id='60009011000036108'
      config={config}
      viewport={{ width, height }}
    />
  ))
  .add('Lorapaed 1 mg/mL oral liquid solution, 150 mL (TPP)', () => (
    <AmtBrowser
      id='55971011000036104'
      config={config}
      viewport={{ width, height }}
    />
  ))
  .add('Lorapaed 1 mg/mL oral liquid solution (TPUU)', () => (
    <AmtBrowser
      id='53743011000036103'
      config={config}
      viewport={{ width, height }}
    />
  ))
  .add('loratadine 1 mg/mL oral liquid, 150 mL (MPP)', () => (
    <AmtBrowser
      id='63589011000036105'
      config={config}
      viewport={{ width, height }}
    />
  ))
  .add('loratadine 1 mg/mL oral liquid (MPUU)', () => (
    <AmtBrowser
      id='62022011000036104'
      config={config}
      viewport={{ width, height }}
    />
  ))
  .add('loratadine (MP)', () => (
    <AmtBrowser
      id='21701011000036106'
      config={config}
      viewport={{ width, height }}
    />
  ))
  .add('loratadine (substance)', () => (
    <AmtBrowser
      resourceType='Substance'
      id='2292011000036106'
      config={config}
      viewport={{ width, height }}
    />
  ))
  .add('Search', () => (
    <AmtBrowser
      query='esomeprazole'
      config={config}
      viewport={{ width, height }}
    />
  ))
