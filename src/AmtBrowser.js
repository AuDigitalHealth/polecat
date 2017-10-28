import React, { Component } from 'react'
import PropTypes from 'prop-types'

import RemoteFhirMedication from './RemoteFhirMedication.js'
import Search from './Search.js'
import Loading from './Loading.js'
import ErrorMessage from './ErrorMessage.js'

import './css/AmtBrowser.css'

class AmtBrowser extends Component {
  static propTypes = {
    location: PropTypes.object,
    viewport: PropTypes.object.isRequired,
    config: PropTypes.object,
  }
  static defaultProps = {
    config: { fhirServer: 'http://medserve.online/fhir' },
  }

  constructor(props) {
    super(props)
    this.state = { loading: false }
    this.handleLoadingChange = this.handleLoadingChange.bind(this)
    this.handleError = this.handleError.bind(this)
  }

  handleLoadingChange(loading) {
    this.setState(() => ({ loading }))
  }

  handleError(error) {
    this.setState(
      () => ({ error, loading: false }),
      () => {
        console.error(error)
      }
    )
  }

  reset() {
    this.setState(() => ({ loading: false, error: null }))
  }

  componentWillReceiveProps(nextProps) {
    const { location } = this.props
    const { location: nextLocation } = nextProps
    if (!location || !nextLocation) return
    // Reset the error state when the location changes.
    if (
      nextLocation.pathname !== location.pathname ||
      nextLocation.search !== location.search
    ) {
      this.reset()
    }
  }

  render() {
    const { location, viewport, config } = this.props
    const { loading, error } = this.state
    return (
      <div
        className='amt-browser'
        style={{ width: viewport.width, height: viewport.height }}
      >
        {location ? (
          <RemoteFhirMedication
            path={location.pathname}
            query={location.search}
            viewport={viewport}
            onLoadingChange={this.handleLoadingChange}
            onError={this.handleError}
            {...config}
          />
        ) : null}
        <Search
          fhirServer={config.fhirServer}
          onLoadingChange={this.handleLoadingChange}
          onError={this.handleError}
        />
        <Loading loading={loading} />
        {error ? (
          <div className='errors'>
            <ErrorMessage error={error} />
          </div>
        ) : null}
      </div>
    )
  }
}

export default AmtBrowser
