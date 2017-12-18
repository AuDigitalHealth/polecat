import React from 'react'
import { storiesOf } from '@storybook/react'
import { host } from 'storybook-host'
import { withKnobs } from '@storybook/addon-knobs'
import { withSmartKnobs } from 'storybook-addon-smart-knobs'

import TextField from './TextField.js'

storiesOf('TextField', module)
  .addDecorator(withSmartKnobs)
  .addDecorator(withKnobs)
  .addDecorator(host({ width: '300px' }))
  .add('With value', () => <TextField value='Some value' />)
  .add('With no value', () => <TextField />)
  .add('With placeholder', () => <TextField placeholder='Type here' />)
  .add('With focus on mount', () => (
    <TextField value='Some value' focusUponMount />
  ))
