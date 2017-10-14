import { configure, addDecorator } from '@storybook/react'
import StoryRouter from 'storybook-router'
import { withKnobsOptions } from '@storybook/addon-knobs'
import { withSmartKnobs } from 'storybook-addon-smart-knobs'

addDecorator(withSmartKnobs)
addDecorator(withKnobsOptions({ debounce: { wait: 350 } }))
addDecorator(StoryRouter())

const req = require.context('../src', true, /\.stories\.js$/)

function loadStories() {
  req.keys().forEach(filename => req(filename))
}

configure(loadStories, module)
