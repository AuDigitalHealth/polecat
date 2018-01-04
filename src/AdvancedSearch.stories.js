import React from 'react'
import { storiesOf } from '@storybook/react'

import AdvancedSearch from './AdvancedSearch.js'
import { results1 } from './QuickSearchResults.stories.js'
import config from '../test/config.js'

storiesOf('AdvancedSearch', module)
  .add('With routed query but no results', () => (
    <AdvancedSearch routedQuery="para" fhirServer={config.fhirServer} />
  ))
  .add('With routed query but no results, loading', () => (
    <AdvancedSearch routedQuery="para" fhirServer={config.fhirServer} loading />
  ))
  .add('With routed query and results', () => (
    <AdvancedSearch
      routedQuery="para"
      fhirServer={config.fhirServer}
      results={results1}
      bundle={{ total: 8 }}
    />
  ))
  .add('With current query', () => (
    <AdvancedSearch
      routedQuery="para"
      fhirServer={config.fhirServer}
      results={results1}
      bundle={{ total: 8 }}
      currentQuery="parac"
    />
  ))
