import React from 'react'
import { storiesOf } from '@storybook/react'

import AdvancedSearch from '../src/AdvancedSearch.js'
import { results1 } from './QuickSearchResults.stories.js'
import config from './config.js'

storiesOf('AdvancedSearch', module)
  .add('With routed query but no results', () => (
    <AdvancedSearch
      routedQuery="para"
      fhirServer={config.fhirServer}
      history={{}}
    />
  ))
  .add('With routed query but no results, loading', () => (
    <AdvancedSearch
      routedQuery="para"
      fhirServer={config.fhirServer}
      history={{}}
      loading
    />
  ))
  .add('With routed query and results', () => (
    <AdvancedSearch
      routedQuery="para"
      fhirServer={config.fhirServer}
      results={results1}
      bundle={{ total: 8 }}
      history={{}}
    />
  ))
  .add('With current query', () => (
    <AdvancedSearch
      routedQuery="para"
      fhirServer={config.fhirServer}
      results={results1}
      bundle={{ total: 8 }}
      history={{}}
      currentQuery="parac"
    />
  ))
