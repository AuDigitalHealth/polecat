import React from 'react'
import { storiesOf } from '@storybook/react'

import Concept from '../src/Concept.js'

const width = 166
const height = 116
const top = 20
const left = 20

storiesOf('Concept', module)
  .add('Focused', () => (
    <Concept
      coding={[
        {
          system: 'http://snomed.info/sct',
          code: '933216161000036101',
          display:
            'Polyvalent Snake Antivenom (Australia and Papua New Guinea) (CSL) intravenous infusion injection, 1 vial',
        },
        {
          system:
            'https://www.tga.gov.au/australian-register-therapeutic-goods',
          code: '74899',
        },
      ]}
      type="CTPP"
      focused
      width={width}
      height={height}
      top={top}
      left={left}
    />
  ))
  .add('CTPP', () => (
    <Concept
      coding={[
        {
          system: 'http://snomed.info/sct',
          code: '933216161000036101',
          display:
            'Polyvalent Snake Antivenom (Australia and Papua New Guinea) (CSL) intravenous infusion injection, 1 vial',
        },
        {
          system:
            'https://www.tga.gov.au/australian-register-therapeutic-goods',
          code: '74899',
        },
      ]}
      type="CTPP"
      width={width}
      height={height}
      top={top}
      left={left}
    />
  ))
  .add('TPP', () => (
    <Concept
      coding={[
        {
          system: 'http://snomed.info/sct',
          code: '933205801000036102',
          display:
            'Polyvalent Snake Antivenom (Australia and Papua New Guinea) (CSL) intravenous infusion injection, 1 vial',
        },
      ]}
      type="TPP"
      width={width}
      height={height}
      top={top}
      left={left}
    />
  ))
  .add('TPUU', () => (
    <Concept
      coding={[
        {
          system: 'http://snomed.info/sct',
          code: '933196831000036102',
          display:
            'Polyvalent Snake Antivenom (Australia and Papua New Guinea) (CSL) intravenous infusion injection, vial',
        },
      ]}
      type="TPUU"
      width={width}
      height={height}
      top={top}
      left={left}
    />
  ))
  .add('TP', () => (
    <Concept
      coding={[
        {
          system: 'http://snomed.info/sct',
          code: '22131000168107',
          display:
            'Polyvalent Snake Antivenom (Australia and Papua New Guinea) (CSL)',
        },
      ]}
      type="TP"
      width={width}
      height={height}
      top={top}
      left={left}
    />
  ))
  .add('MPP', () => (
    <Concept
      coding={[
        {
          system: 'http://snomed.info/sct',
          code: '75498011000036101',
          display: 'death adder antivenom 6000 units injection, 1 vial',
        },
      ]}
      type="MPP"
      width={width}
      height={height}
      top={top}
      left={left}
    />
  ))
  .add('MPUU', () => (
    <Concept
      coding={[
        {
          system: 'http://snomed.info/sct',
          code: '75096011000036105',
          display: 'king brown snake antivenom 18 000 units injection, vial',
        },
      ]}
      type="MPUU"
      width={width}
      height={height}
      top={top}
      left={left}
    />
  ))
  .add('MP', () => (
    <Concept
      coding={[
        {
          system: 'http://snomed.info/sct',
          code: '74983011000036101',
          display: 'taipan snake antivenom',
        },
      ]}
      type="MP"
      width={width}
      height={height}
      top={top}
      left={left}
    />
  ))
  .add('substance', () => (
    <Concept
      coding={[
        {
          system: 'http://snomed.info/sct',
          code: '2610011000036105',
          display: 'sumatriptan',
        },
      ]}
      type="substance"
      width={width}
      height={height}
      top={top}
      left={left}
    />
  ))
  .add('With ARTG ID', () => (
    <Concept
      coding={[
        {
          system: 'http://snomed.info/sct',
          code: '95431000036109',
          display: 'Xifaxan 550 mg film-coated tablet, 56, blister pack',
        },
        {
          system:
            'https://www.tga.gov.au/australian-register-therapeutic-goods',
          code: '183411',
        },
      ]}
      type="CTPP"
      width={width}
      height={height}
      top={top}
      left={left}
    />
  ))
  .add('Entered in error', () => (
    <Concept
      coding={[
        {
          system: 'http://snomed.info/sct',
          code: '61765011000036100',
          display: 'dexchlorpheniramine + paracetamol + pseudoephedrine',
        },
      ]}
      type="MP"
      status="entered-in-error"
      width={width}
      height={height}
      top={top}
      left={left}
    />
  ))
  .add('Inactive', () => (
    <Concept
      coding={[
        {
          system: 'http://snomed.info/sct',
          code: '42148011000036101',
          display: 'Metvix 200 mg/g cream, 2 g',
        },
      ]}
      type="TPP"
      status="inactive"
      width={width}
      height={height}
      top={top}
      left={left}
    />
  ))
