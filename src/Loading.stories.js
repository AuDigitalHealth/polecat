import React from 'react'
import { storiesOf } from '@storybook/react'

import Loading from './Loading.js'

storiesOf('Loading', module)
  .add('Not loading', () => <Loading loading={false} />)
  .add('Loading', () => <Loading loading />)
  .add('Loading, delay 2 seconds', () => <Loading loading delay={2000} />)
