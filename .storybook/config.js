import { configure, addDecorator } from '@storybook/react'
import StoryRouter from 'storybook-router'
import { setOptions } from '@storybook/addon-options'

addDecorator(StoryRouter())

const req = require.context('../test', true, /\.stories\.js$/)
const loadStories = () => req.keys().forEach(filename => req(filename))

setOptions({ name: 'Polecat' })
configure(loadStories, module)
