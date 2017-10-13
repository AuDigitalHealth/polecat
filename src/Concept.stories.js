import React from 'react'
import { storiesOf } from '@storybook/react'
import StoryRouter from 'storybook-router'

import Concept from './Concept.js'

const width = 166
const height = 116
const top = 20
const left = 20

storiesOf('Concept', module)
  .addDecorator(StoryRouter())
  .add('CTPP', () => (
    <Concept
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
    <Concept
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
    <Concept
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
    <Concept
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
    <Concept
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
    <Concept
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
    <Concept
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
    <Concept
      sctid='2610011000036105'
      display='sumatriptan'
      type='substance'
      width={width}
      height={height}
      top={top}
      left={left}
    />
  ))
