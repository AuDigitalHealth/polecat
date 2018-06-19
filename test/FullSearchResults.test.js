import React from 'react'
import { shallow, mount } from 'enzyme'
import { InfiniteLoader } from 'react-virtualized/dist/commonjs/InfiniteLoader'

import FullSearchResults from '../src/FullSearchResults.js'
import { results1 } from './SearchSummary.test.js'

describe('FullSearchResults', () => {
  it('should render', () => {
    shallow(<FullSearchResults />)
  })

  it('should call onRequireMoreResults callback', () => {
    const onRequireMoreResults = jest.fn(),
      props = {
        query:
          'type:CTPP status:active brand-text:dutran ingredient:2108011000036105|fentanyl',
        results: results1,
        totalResults: 2,
        onRequireMoreResults,
      },
      wrapper = mount(<FullSearchResults {...props} />),
      infiniteLoader = wrapper.find(InfiniteLoader),
      loadMoreRows = infiniteLoader.prop('loadMoreRows')
    expect(infiniteLoader.exists()).toBe(true)
    loadMoreRows({ startIndex: 203, stopIndex: 274 })
    expect(onRequireMoreResults).toHaveBeenCalledWith({ stopIndex: 274 })
  })
})
