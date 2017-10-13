import React from 'react'
import { storiesOf } from '@storybook/react'

import TextField from './TextField.js'

storiesOf('TextField', module)
  .add('With value', () => <TextField value='Some value' />)
  .add('With no value', () => <TextField />)
  .add('With placeholder', () => <TextField placeholder='Type here' />)
