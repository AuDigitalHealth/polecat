import React from 'react'
import { storiesOf } from '@storybook/react'

import FullSearchResults from './FullSearchResults.js'
import { results1 } from './QuickSearchResults.stories.js'

storiesOf('FullSearchResults', module)
  .add('With full range of types', () => (
    <FullSearchResults results={results1} />
  ))
  .add('With a query and empty results', () => (
    <FullSearchResults query='dog' results={[]} />
  ))
  .add('With no query and empty results', () => (
    <FullSearchResults results={[]} />
  ))
  .add('With no query and no results', () => <FullSearchResults />)
