import React from 'react'
import { storiesOf } from '@storybook/react'

import FocusedConcept from './FocusedConcept.js'

const width = 166
const height = 116
const top = 20
const left = 20

storiesOf('FocusedConcept', module)
  .add('CTPP', () => (
    <FocusedConcept
      sctid='933216161000036101'
      display='Polyvalent Snake Antivenom (Australia and Papua New Guinea) (CSL) intravenous infusion injection, 1 vial'
      type='CTPP'
      width={width}
      height={height}
      top={top}
      left={left}
    />
  ))
  .add('TPP', () => (
    <FocusedConcept
      sctid='933205801000036102'
      display='Polyvalent Snake Antivenom (Australia and Papua New Guinea) (CSL) intravenous infusion injection, 1 vial'
      type='TPP'
      width={width}
      height={height}
      top={top}
      left={left}
    />
  ))
  .add('TPUU', () => (
    <FocusedConcept
      sctid='933196831000036102'
      display='Polyvalent Snake Antivenom (Australia and Papua New Guinea) (CSL) intravenous infusion injection, vial'
      type='TPUU'
      width={width}
      height={height}
      top={top}
      left={left}
    />
  ))
  .add('TP', () => (
    <FocusedConcept
      sctid='22131000168107'
      display='Polyvalent Snake Antivenom (Australia and Papua New Guinea) (CSL)'
      type='TP'
      width={width}
      height={height}
      top={top}
      left={left}
    />
  ))
  .add('MPP', () => (
    <FocusedConcept
      sctid='75498011000036101'
      display='death adder antivenom 6000 units injection, 1 vial'
      type='MPP'
      width={width}
      height={height}
      top={top}
      left={left}
    />
  ))
  .add('MPUU', () => (
    <FocusedConcept
      sctid='75096011000036105'
      display='king brown snake antivenom 18 000 units injection, vial'
      type='MPUU'
      width={width}
      height={height}
      top={top}
      left={left}
    />
  ))
  .add('MP', () => (
    <FocusedConcept
      sctid='74983011000036101'
      display='taipan snake antivenom'
      type='MP'
      width={width}
      height={height}
      top={top}
      left={left}
    />
  ))
  .add('substance', () => (
    <FocusedConcept
      sctid='2610011000036105'
      display='sumatriptan'
      type='substance'
      width={width}
      height={height}
      top={top}
      left={left}
    />
  ))
