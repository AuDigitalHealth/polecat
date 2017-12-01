import React from 'react'
import { storiesOf } from '@storybook/react'

import SearchForm from './SearchForm.js'
import config from '../public/config.json'

storiesOf('SearchForm', module).add('With a query', () => (
  <SearchForm
    fhirServer={config.fhirServer}
    query='varicella id:959031000168106'
  />
))
