import React, { Component } from 'react'
import PropTypes from 'prop-types'

import spinner from './img/spinner.svg'

class Loading extends Component {
  static propTypes = {
    loading: PropTypes.bool,
    delay: PropTypes.number,
    children: PropTypes.any,
  }
  static defaultProps = {
    loading: false,
    delay: 350,
  }

  constructor(props) {
    super(props)
    this.state = { loading: false }
    this.setLoadingAfterDelay = this.setLoadingAfterDelay.bind(this)
    this.unsetLoading = this.unsetLoading.bind(this)
  }

  setLoadingAfterDelay() {
    // Unset any pending timeout.
    this.unsetLoading()
    let func = function() {
      this.setState({ loading: true })
    }
    func = func.bind(this)
    const timeoutId = setTimeout(func, this.props.delay)
    this.setState(() => ({ timeoutId }))
  }

  unsetLoading() {
    const { timeoutId } = this.state
    if (timeoutId) clearTimeout(timeoutId)
    this.setState(() => ({ loading: false, timeoutId: null }))
  }

  componentWillMount() {
    const { loading } = this.props
    if (loading) {
      this.setLoadingAfterDelay()
    }
  }

  componentWillUnmount() {
    this.unsetLoading()
  }

  componentWillReceiveProps(nextProps) {
    const { loading } = nextProps
    const loadingState = this.state.loading
    if (loading && !loadingState) {
      this.setLoadingAfterDelay()
    } else if (!loading) {
      this.unsetLoading()
    }
  }

  render() {
    const { children } = this.props
    const { loading } = this.state
    return (
      <div className="loading">
        {loading ? (
          <img src={spinner} width="20" height="20" alt="Loading" />
        ) : (
          children
        )}
      </div>
    )
  }
}

export default Loading
