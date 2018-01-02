import initStoryshots from '@storybook/addon-storyshots'
import Enzyme, { shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import { Route } from 'react-router'

const shallowSnapshot = ({ story, context }) => {
  const element = story.render(context)
  const options = { disableLifecycleMethods: true }
  let result = element
  // Skip any wrapper elements added by decorators.
  while (result.props.story) result = result.props.story()
  result = shallow(result, options)
  const route = result.find(Route)
  // Skip any `Route` element added by story-router.
  if (route.exists()) result = shallow(route.prop('render')(), options)
  expect(result).toMatchSnapshot()
}

Enzyme.configure({ adapter: new Adapter() })
initStoryshots({ test: options => shallowSnapshot(options) })
