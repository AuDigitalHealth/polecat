import React from 'react'
import { shallow } from 'enzyme'

import { AmtProductModel } from '../src/AmtProductModel.js'

import nodesLinks from './fixtures/nodesLinks-61765011000036100.json'

describe('AmtProductModel', () => {
  it('should not fix the focused node when updating to a two node graph', () => {
    const props = {
      ...nodesLinks,
      viewport: { width: 1024, height: 768 },
    }
    const wrapper = shallow(<AmtProductModel {...props} />)
    return new Promise(resolve => {
      setTimeout(() => {
        expect(wrapper.state('nodes')).toHaveLength(10)
        // Give the mounted state a chance to resolve itself, then push through
        // a change to the `filters` prop.
        wrapper.setProps({ filters: ['not-replaced-by'] })
        setTimeout(() => {
          // Once the change to the prop has finished, check that the graph has
          // been reduced to two nodes.
          wrapper.update()
          const nodes = wrapper.state('nodes')
          expect(nodes).toHaveLength(2)
          // Check that neither of the nodes have a fixed position.
          for (const node of nodes) {
            expect(node.fx).toBe(undefined)
            expect(node.fy).toBe(undefined)
          }
          resolve()
        }, 50)
      }, 50)
    })
  })
})
