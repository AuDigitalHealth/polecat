import React from 'react'
import { storiesOf } from '@storybook/react'
import { host } from 'storybook-host'
import { withKnobs } from '@storybook/addon-knobs'
import { withSmartKnobs } from 'storybook-addon-smart-knobs'

import Expand from './Expand.js'

storiesOf('Expand', module)
  .addDecorator(withSmartKnobs)
  .addDecorator(withKnobs)
  .addDecorator(host({ width: '300px', height: '300px' }))
  .add('Inactive', () => <Expand />)
  .add('Active', () => <Expand active />)
