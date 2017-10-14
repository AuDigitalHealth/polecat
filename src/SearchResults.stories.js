import React from 'react'
import { storiesOf } from '@storybook/react'

import SearchResults from './SearchResults.js'

const results1 = [
  {
    code: '933216161000036101',
    display:
      'Polyvalent Snake Antivenom (Australia and Papua New Guinea) (CSL) intravenous infusion injection, 1 vial',
    type: 'CTPP',
  },
  {
    code: '933205801000036102',
    display:
      'Polyvalent Snake Antivenom (Australia and Papua New Guinea) (CSL) intravenous infusion injection, 1 vial',
    type: 'TPP',
  },
  {
    code: '933196831000036102',
    display:
      'Polyvalent Snake Antivenom (Australia and Papua New Guinea) (CSL) intravenous infusion injection, vial',
    type: 'TPUU',
  },
  {
    code: '22131000168107',
    display:
      'Polyvalent Snake Antivenom (Australia and Papua New Guinea) (CSL)',
    type: 'TP',
  },
  {
    code: '75498011000036101',
    display: 'death adder antivenom 6000 units injection, 1 vial',
    type: 'MPP',
  },
  {
    code: '75096011000036105',
    display: 'king brown snake antivenom 18 000 units injection, vial',
    type: 'MPUU',
  },
  {
    code: '74983011000036101',
    display: 'taipan snake antivenom',
    type: 'MP',
  },
  {
    code: '2610011000036105',
    display: 'sumatriptan',
    type: 'substance',
  },
]

storiesOf('SearchResults', module).add('With full range of types', () => (
  <SearchResults results={results1} />
))
