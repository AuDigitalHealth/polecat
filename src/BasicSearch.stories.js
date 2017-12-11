import React from 'react'
import { storiesOf } from '@storybook/react'

import BasicSearch from './BasicSearch.js'
import { results1 } from './QuickSearchResults.stories.js'

storiesOf('BasicSearch', module)
  .add('With routed query but no results', () => (
    <BasicSearch routedQuery='para' />
  ))
  .add('With routed query but no results, loading', () => (
    <BasicSearch routedQuery='para' loading />
  ))
  .add('With routed query and results', () => (
    <BasicSearch routedQuery='para' results={results1} bundle={{ total: 8 }} />
  ))
  .add('With current query', () => (
    <BasicSearch
      routedQuery='para'
      results={results1}
      bundle={{ total: 8 }}
      currentQuery='parac'
    />
  ))
