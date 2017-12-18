import initStoryshots from '@storybook/addon-storyshots'
import Enzyme, { shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

const shallowSnapshot = ({ story, context }) => {
  // This is required to exclude the story router from the rendering of the
  // snapshot.
  const element = story.render(context).props.story()
  let result = shallow(element)
  // This moves us one more component down the tree in cases where we use an
  // additional `host` decorator.
  if (result.prop('story')) result = shallow(result.prop('story')())
  expect(result).toMatchSnapshot()
}

Enzyme.configure({ adapter: new Adapter() })
initStoryshots({ test: options => shallowSnapshot(options) })
