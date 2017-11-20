import React from 'react'
import { storiesOf } from '@storybook/react'

import SearchForm from './SearchForm.js'

storiesOf('SearchForm', module).add('With a query', () => (
  <SearchForm query='varicella id:959031000168106' />
))
