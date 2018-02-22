import initStoryshots from '@storybook/addon-storyshots'
import Enzyme, { shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import { Route } from 'react-router'
import React from 'react'

const fakeStore = {
  getState: () => {},
  dispatch: () => null,
  subscribe: () => null,
  replaceReducer: () => null,
}

const shallowSnapshot = ({ story, context }) => {
  const element = story.render(context)
  const options = { disableLifecycleMethods: true }
  let result = element
  // Skip any wrapper elements added by decorators.
  while (result.props.story) result = result.props.story()
  // If component wants to be connected to a Redux store, give it a fake one.
  if (result.type.displayName && result.type.displayName.match(/^Connect/)) {
    result = React.cloneElement(result, { store: fakeStore })
    result = shallow(result, options)
  } else {
    result = shallow(result, options)
  }
  // Skip any `Route` element added by story-router.
  const route = result.find(Route)
  if (route.exists()) result = shallow(route.prop('render')(), options)
  expect(result).toMatchSnapshot()
}

Enzyme.configure({ adapter: new Adapter() })
initStoryshots({ test: options => shallowSnapshot(options) })
