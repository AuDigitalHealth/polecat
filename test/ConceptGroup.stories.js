import React from 'react'
import { storiesOf } from '@storybook/react'

import ConceptGroup from '../src/ConceptGroup.js'

const width = 166
const height = 116
const concepts1 = [
  {
    coding: [
      {
        system: 'http://snomed.info/sct',
        code: '81302011000036105',
        display:
          'zinc oxide 15% + dimeticone-350 15% + light liquid paraffin 10% cream',
      },
    ],
    type: 'MPUU',
  },
  {
    coding: [
      {
        system: 'http://snomed.info/sct',
        code: '931852011000036109',
        display: 'dimeticone-350 1.04% + zinc oxide 12.5% spray',
      },
    ],
    type: 'MPUU',
  },
  {
    coding: [
      {
        system: 'http://snomed.info/sct',
        code: '61101000036107',
        display:
          'aluminium chlorohydrate 2% + benzoin Sumatra 1.2% + dimeticone-350 10% + liquid paraffin 5% + zinc oxide 20% paste',
      },
    ],
    type: 'MPUU',
  },
]

storiesOf('ConceptGroup', module).add(
  'With parent medication search result',
  () => (
    <ConceptGroup
      concepts={concepts1}
      linkPath="/?q=some-search"
      total={549}
      width={width}
      height={height}
      top={20}
      left={20}
    />
  ),
)
