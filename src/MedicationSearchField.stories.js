import React from 'react'
import { storiesOf } from '@storybook/react'
import { host } from 'storybook-host'
import { withKnobs } from '@storybook/addon-knobs'
import { withSmartKnobs } from 'storybook-addon-smart-knobs'

import MedicationSearchField from './MedicationSearchField.js'
import config from '../test/config.js'

storiesOf('MedicationSearchField', module)
  .addDecorator(withSmartKnobs)
  .addDecorator(withKnobs)
  .addDecorator(host({ width: '300px' }))
  .add('Searching TPPs', () => (
    <MedicationSearchField
      fhirServer={config.fhirServer}
      label='Select product'
      searchPath={text =>
        `/Medication?_text=${text}&medication-resource-type=BPG`
      }
      focusUponMount
    />
  ))
  .add('With text value', () => (
    <MedicationSearchField
      fhirServer={config.fhirServer}
      label='Select product'
      textValue='oxy'
      searchPath={text =>
        `/Medication?_text=${text}&medication-resource-type=BPG`
      }
      focusUponMount
    />
  ))
  .add('With coding value (code only)', () => (
    <MedicationSearchField
      fhirServer={config.fhirServer}
      label='Select product'
      codingValue='49333011000036108'
      searchPath={text =>
        `/Medication?_text=${text}&medication-resource-type=BPG`
      }
      focusUponMount
    />
  ))
  .add('With coding value (code and display)', () => (
    <MedicationSearchField
      fhirServer={config.fhirServer}
      label='Select product'
      codingValue='49333011000036108|Proguide (66000782) green 28 cm to 32 cm two layer bandage, 1'
      searchPath={text =>
        `/Medication?_text=${text}&medication-resource-type=BPG`
      }
      focusUponMount
    />
  ))
