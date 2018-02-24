import React from 'react'
import { storiesOf } from '@storybook/react'

import SearchForm from '../src/SearchForm.js'
import config from './config.js'

storiesOf('SearchForm', module).add('With a query', () => (
  <SearchForm
    fhirServer={config.fhirServer}
    query="varicella id:959031000168106"
  />
))
