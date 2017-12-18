import React, { Component } from 'react'
import { configure, addDecorator } from '@storybook/react'
import StoryRouter from 'storybook-router'
import { withKnobs } from '@storybook/addon-knobs'
import { withSmartKnobs } from 'storybook-addon-smart-knobs'
import { setOptions } from '@storybook/addon-options'

addDecorator(withSmartKnobs)
addDecorator(withKnobs)
addDecorator(StoryRouter())

const req = require.context('../src', true, /\.stories\.js$/)
const loadStories = () => req.keys().forEach(filename => req(filename))

setOptions({ name: 'Polecat' })
configure(loadStories, module)
