import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Clipboard from 'clipboard'

import Icon from './Icon.js'

import './css/CopyToClipboard.css'

class CopyToClipboard extends Component {
  static propTypes = {
    copyText: PropTypes.string,
    title: PropTypes.string,
  }

  constructor(props) {
    super(props)
    this.state = { status: 'ready' }
    this.handleCopySuccess = this.handleCopySuccess.bind(this)
  }

  handleCopySuccess() {
    if (this.state.timeoutId) clearTimeout(this.state.timeoutId)
    const timeoutId = setTimeout(
      () => this.setState(() => ({ status: 'ready', timeoutId: null })),
      1000,
    )
    this.setState(() => ({ status: 'success', timeoutId }))
  }

  componentDidMount() {
    // eslint-disable-next-line no-new
    new Clipboard('.copy-to-clipboard')
  }

  componentWillUnmount() {
    if (this.state.timeoutId) clearTimeout(this.state.timeoutId)
  }

  render() {
    const { copyText, title } = this.props
    const { status } = this.state
    return (
      <div
        className="copy-to-clipboard"
        data-clipboard-text={copyText}
        onClick={this.handleCopySuccess}
      >
        <Icon
          type={status === 'success' ? 'tick' : 'clipboard'}
          hoverType={status === 'ready' ? 'clipboard-active' : null}
          width={17}
          alt={title}
          title={title}
        />
      </div>
    )
  }
}

export default CopyToClipboard
