import React from 'react'
import { storiesOf } from '@storybook/react'

import Expand from './Expand.js'

storiesOf('Expand', module)
  .add('Inactive', () => <Expand />)
  .add('Active', () => <Expand active />)
