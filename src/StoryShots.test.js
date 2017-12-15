import initStoryshots from '@storybook/addon-storyshots'
import Enzyme, { shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

const shallowSnapshot = ({ story, context }) => {
  const element = story.render(context).props.story()
  const result = shallow(element)
  expect(result).toMatchSnapshot()
}

Enzyme.configure({ adapter: new Adapter() })
initStoryshots({ test: options => shallowSnapshot(options) })
