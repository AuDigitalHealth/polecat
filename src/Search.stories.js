import React from 'react'
import { storiesOf } from '@storybook/react'
import StoryRouter from 'storybook-router'

import Search from './Search.js'
import config from '../public/config.json'

storiesOf('Search', module)
  .addDecorator(StoryRouter())
  .add('As configured', () => <Search fhirServer={config.fhirServer} />)
  .add('With minimum request frequency of 2 seconds', () => (
    <Search fhirServer={config.fhirServer} minRequestFrequency={2000} />
  ))
