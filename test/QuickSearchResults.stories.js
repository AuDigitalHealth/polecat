import React from 'react'
import { storiesOf } from '@storybook/react'
import omit from 'lodash.omit'

import QuickSearchResults from '../src/QuickSearchResults.js'

export const results1 = [
  {
    coding: [
      {
        system: 'http://snomed.info/sct',
        code: '933216161000036101',
        display:
          'Polyvalent Snake Antivenom (Australia and Papua New Guinea) (CSL) intravenous infusion injection, 1 vial',
      },
      {
        system: 'https://www.tga.gov.au/australian-register-therapeutic-goods',
        code: '74899',
      },
    ],
    type: 'CTPP',
    link: '/Medication/933216161000036101',
  },
  {
    coding: [
      {
        system: 'http://snomed.info/sct',
        code: '933205801000036102',
        display:
          'Polyvalent Snake Antivenom (Australia and Papua New Guinea) (CSL) intravenous infusion injection, 1 vial',
      },
    ],
    type: 'TPP',
    link: '/Medication/933205801000036102',
  },
  {
    coding: [
      {
        system: 'http://snomed.info/sct',
        code: '933196831000036102',
        display:
          'Polyvalent Snake Antivenom (Australia and Papua New Guinea) (CSL) intravenous infusion injection, vial',
      },
    ],
    type: 'TPUU',
    link: '/Medication/933196831000036102',
  },
  {
    coding: [
      {
        system: 'http://snomed.info/sct',
        code: '22131000168107',
        display:
          'Polyvalent Snake Antivenom (Australia and Papua New Guinea) (CSL)',
      },
    ],
    type: 'TP',
    link: '/Medication/22131000168107',
  },
  {
    coding: [
      {
        system: 'http://snomed.info/sct',
        code: '75498011000036101',
        display: 'death adder antivenom 6000 units injection, 1 vial',
      },
    ],
    type: 'MPP',
    link: '/Medication/75498011000036101',
  },
  {
    coding: [
      {
        system: 'http://snomed.info/sct',
        code: '75096011000036105',
        display: 'king brown snake antivenom 18 000 units injection, vial',
      },
    ],
    type: 'MPUU',
    link: '/Medication/75096011000036105',
  },
  {
    coding: [
      {
        system: 'http://snomed.info/sct',
        code: '74983011000036101',
        display: 'taipan snake antivenom',
      },
    ],
    type: 'MP',
    link: '/Medication/74983011000036101',
  },
  {
    coding: [
      {
        system: 'http://snomed.info/sct',
        code: '2610011000036105',
        display: 'sumatriptan',
      },
    ],
    type: 'substance',
    link: '/Substance/2610011000036105',
  },
]

storiesOf('QuickSearchResults', module)
  .add('All types, with links', () => <QuickSearchResults results={results1} />)
  .add('All types, without links', () => {
    const resultsWithoutLinks = results1.map(r => omit(r, 'link'))
    return <QuickSearchResults results={resultsWithoutLinks} />
  })
  .add('With more link', () => {
    const resultsWithMore = results1.concat([
      { type: 'more', link: '/?q=something', total: 45983 },
    ])
    return <QuickSearchResults results={resultsWithMore} />
  })
  .add('With a selected row', () => {
    const resultsWithSelected = results1.map(
      r => (r.type === 'TPUU' ? { ...r, selected: true } : r),
    )
    return <QuickSearchResults results={resultsWithSelected} />
  })
  .add('With a query and empty results', () => (
    <QuickSearchResults query="dog" results={[]} />
  ))
  .add('With no query and empty results', () => (
    <QuickSearchResults results={[]} />
  ))
  .add('With no query and no results', () => <QuickSearchResults />)
