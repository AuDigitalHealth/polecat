import React from 'react'
import { storiesOf } from '@storybook/react'

import Search from './Search.js'
import config from '../public/config.json'

storiesOf('Search', module)
  .add('As configured', () => <Search fhirServer={config.fhirServer} />)
  .add('With minimum request frequency of 2 seconds', () => (
    <Search fhirServer={config.fhirServer} minRequestFrequency={2000} />
  ))
  .add('With focus on mount', () => (
    <Search fhirServer={config.fhirServer} focusUponMount />
  ))
