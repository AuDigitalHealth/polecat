import React from 'react'
import { storiesOf } from '@storybook/react'

import AmtProductModel from './AmtProductModel.js'
import nodesLinks1 from '../test/nodes-links-813191000168107.json'

const { nodes: nodes1, links: links1 } = nodesLinks1
const width = 800
const height = 800

storiesOf('AmtProductModel', module).add('With nodes and links', () => (
  <AmtProductModel nodes={nodes1} links={links1} viewport={{ width, height }} />
))
