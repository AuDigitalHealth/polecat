import React from 'react'
import { storiesOf } from '@storybook/react'
import { host } from 'storybook-host'

import Expand from '../src/Expand.js'

storiesOf('Expand', module)
  .addDecorator(host({ width: '300px', height: '300px' }))
  .add('Inactive', () => <Expand />)
  .add('Active', () => <Expand active />)
