import React from 'react'
import { storiesOf } from '@storybook/react'

import SourceCodeSystem from '../src/SourceCodeSystem.js'

storiesOf('SourceCodeSystem', module)
  .add('With SNOMED CT-AU', () => (
    <SourceCodeSystem
      uri="http://snomed.info/sct"
      version="http://snomed.info/sct?version=http%3A%2F%2Fsnomed.info%2Fsct%2F32506021000036107%2Fversion%2F20171231"
    />
  ))
  .add('With non-SNOMED system', () => (
    <SourceCodeSystem uri="http://pbs.gov.au/item/code" version="20171201" />
  ))
  .add('With SNOMED international edition', () => (
    <SourceCodeSystem
      uri="http://snomed.info/sct"
      version="http://snomed.info/sct?version=http%3A%2F%2Fsnomed.info%2Fsct%2F900000000000207008%2Fversion%2F20170731"
    />
  ))
