import initStoryshots from '@storybook/addon-storyshots'
import Enzyme, { shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import WrapStory from '@storybook/addon-knobs/dist/react/WrapStory'
import { Route } from 'react-router'

const shallowSnapshot = ({ story, context }) => {
  const element = story
    .render(context)
    .props.story()
    .props.storyFn()
  const options = { disableLifecycleMethods: true }
  let result = shallow(element, options)
  const wrapStory = result.find(WrapStory)
  if (wrapStory.exists()) result = shallow(wrapStory.prop('storyFn')(), options)
  const route = result.find(Route)
  if (route.exists()) result = shallow(route.prop('render')(), options)
  expect(result).toMatchSnapshot()
}

Enzyme.configure({ adapter: new Adapter() })
initStoryshots({ test: options => shallowSnapshot(options) })
