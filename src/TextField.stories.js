import React from 'react'
import { storiesOf } from '@storybook/react'
import { host } from 'storybook-host'

import TextField from './TextField.js'

storiesOf('TextField', module)
  .addDecorator(host({ width: '300px' }))
  .add('With value', () => <TextField value="Some value" />)
  .add('With no value', () => <TextField />)
  .add('With placeholder', () => <TextField placeholder="Type here" />)
  .add('With focus on mount', () => (
    <TextField value="Some value" focusUponMount />
  ))
