/* eslint-disable no-console */

import React from 'react'
import { storiesOf } from '@storybook/react'

import CopyToClipboard from '../src/CopyToClipboard.js'

storiesOf('CopyToClipboard', module).add('With some text', () => (
  <CopyToClipboard
    copyText="The quick brown fox jumps over the lazy dog."
    onClick={event => console.log('Clicked!', event)}
  />
))
