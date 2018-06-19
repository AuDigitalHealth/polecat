import React from 'react'
import { storiesOf } from '@storybook/react'

import FullSearchResults from '../src/FullSearchResults.js'
import { results1 } from './QuickSearchResults.stories.js'

storiesOf('FullSearchResults', module)
  .add('With full range of types', () => (
    <FullSearchResults
      results={results1}
      totalResults={8}
      onRequireMoreResults={jest.fn()}
    />
  ))
  .add('With a query and empty results', () => (
    <FullSearchResults
      query="dog"
      results={[]}
      totalResults={0}
      onRequireMoreResults={jest.fn()}
    />
  ))
  .add('With no query and empty results', () => (
    <FullSearchResults
      results={[]}
      totalResults={0}
      onRequireMoreResults={jest.fn()}
    />
  ))
  .add('With no query and no results', () => (
    <FullSearchResults onRequireMoreResults={jest.fn()} />
  ))
