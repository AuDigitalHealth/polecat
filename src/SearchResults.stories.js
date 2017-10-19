import React from 'react'
import { storiesOf } from '@storybook/react'

import SearchResults from './SearchResults.js'

const results1 = [
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
  },
]

storiesOf('SearchResults', module).add('With full range of types', () => (
  <SearchResults results={results1} />
))
