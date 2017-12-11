import React from 'react'
import { storiesOf } from '@storybook/react'

import AdvancedSearch from './AdvancedSearch.js'
import { results1 } from './QuickSearchResults.stories.js'

storiesOf('AdvancedSearch', module)
  .add('With routed query but no results', () => (
    <AdvancedSearch routedQuery='para' />
  ))
  .add('With routed query but no results, loading', () => (
    <AdvancedSearch routedQuery='para' loading />
  ))
  .add('With routed query and results', () => (
    <AdvancedSearch
      routedQuery='para'
      results={results1}
      bundle={{ total: 8 }}
    />
  ))
  .add('With current query', () => (
    <AdvancedSearch
      routedQuery='para'
      results={results1}
      bundle={{ total: 8 }}
      currentQuery='parac'
    />
  ))
