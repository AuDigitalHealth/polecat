import React from 'react'
import { storiesOf } from '@storybook/react'

import FullSearchResults from '../src/FullSearchResults.js'
import { results1 } from './QuickSearchResults.stories.js'

storiesOf('FullSearchResults', module)
  .add('With full range of types', () => (
    <FullSearchResults results={results1} onRequireMoreResults={jest.fn()} />
  ))
  .add('With a query and empty results', () => (
    <FullSearchResults
      query="dog"
      results={[]}
      onRequireMoreResults={jest.fn()}
    />
  ))
  .add('With no query and empty results', () => (
    <FullSearchResults results={[]} onRequireMoreResults={jest.fn()} />
  ))
  .add('With no query and no results', () => (
    <FullSearchResults onRequireMoreResults={jest.fn()} />
  ))
