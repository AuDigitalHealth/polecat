import React from 'react'
import { storiesOf } from '@storybook/react'

import AmtProductModel from './AmtProductModel.js'
import nodesLinks1 from '../test/nodesLinks-813191000168107.json'

const { nodes: nodes1, links: links1 } = nodesLinks1
const width = 800
const height = 800

const twoNodes = {
  nodes: [
    {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '21415011000036100',
          display: 'amoxicillin',
        },
      ],
      type: 'UPD',
    },
    {
      type: 'UPD',
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '21360011000036101',
          display: 'amoxicillin + clavulanic acid',
        },
      ],
      focused: true,
    },
  ],
  links: [
    { source: '21360011000036101', target: '21415011000036100', type: 'is-a' },
  ],
}

storiesOf('AmtProductModel', module)
  .add('With nodes and links', () => (
    <AmtProductModel
      nodes={nodes1}
      links={links1}
      viewport={{ width, height }}
    />
  ))
  .add('Two nodes', () => (
    <AmtProductModel
      nodes={twoNodes.nodes}
      links={twoNodes.links}
      viewport={{ width, height }}
    />
  ))
