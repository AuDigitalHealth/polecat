import React from 'react'
import { storiesOf } from '@storybook/react'

import SearchSummary from './SearchSummary.js'

storiesOf('SearchSummary', module)
  .add('With total results', () => <SearchSummary totalResults={5345} />)
  .add('With no total results', () => <SearchSummary />)
