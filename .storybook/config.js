import React, { Component } from 'react'
import { configure, addDecorator } from '@storybook/react'
import StoryRouter from 'storybook-router'
import { withKnobsOptions } from '@storybook/addon-knobs'
import { withSmartKnobs } from 'storybook-addon-smart-knobs'
import { setOptions } from '@storybook/addon-options'

addDecorator(withSmartKnobs)
addDecorator(withKnobsOptions({ debounce: { wait: 350 } }))
addDecorator(StoryRouter())

const req = require.context('../src', true, /\.stories\.js$/)
const loadStories = () => req.keys().forEach(filename => req(filename))

setOptions({ name: 'Polecat' })
configure(loadStories, module)
