import React from 'react'
import { storiesOf } from '@storybook/react'

import SearchSummary from '../src/SearchSummary.js'

storiesOf('SearchSummary', module)
  .add('With total results', () => <SearchSummary totalResults={5345} />)
  .add('With no total results', () => <SearchSummary />)
  .add('With next link', () => (
    <SearchSummary totalResults={350} nextLink="something" />
  ))
  .add('With previous link', () => (
    <SearchSummary totalResults={350} previousLink="something" />
  ))
  .add('With next and previous links', () => (
    <SearchSummary
      totalResults={350}
      previousLink="something"
      nextLink="something-else"
    />
  ))
