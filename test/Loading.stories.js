import React from 'react'
import { storiesOf } from '@storybook/react'
import { host } from 'storybook-host'

import Loading from '../src/Loading.js'

storiesOf('Loading', module)
  .addDecorator(host({ width: '300px', height: '300px' }))
  .add('Not loading', () => <Loading loading={false} />)
  .add('Loading', () => <Loading loading />)
  .add('Loading, delay 2 seconds', () => <Loading loading delay={2000} />)
