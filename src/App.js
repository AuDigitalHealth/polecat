import React, { Component } from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import PropTypes from 'prop-types'
import throttle from 'lodash.throttle'

import RemoteFhirMedication from './RemoteFhirMedication.js'
import Search from './Search.js'

import './css/App.css'

class App extends Component {
  static propTypes = {
    config: PropTypes.object,
  }

  static defaultProps = {
    config: { fhirServer: 'http://medserve.online/fhir' },
  }

  constructor(props) {
    super(props)
    this.state = {
      viewport: { width: window.innerWidth, height: window.innerHeight },
    }
    this.handleWindowResize = throttle(this.handleWindowResize.bind(this), 50)
  }

  handleWindowResize() {
    this.setState(() => ({
      viewport: { width: window.innerWidth, height: window.innerHeight },
    }))
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleWindowResize)
  }

  render() {
    const { config } = this.props
    const { viewport } = this.state
    return (
      <div className='app'>
        <main>
          <Router>
            <Switch>
              <Route
                path='/:path'
                render={({ location }) => (
                  <div className='medication-result'>
                    <Search fhirServer={config.fhirServer} />
                    <RemoteFhirMedication
                      path={location.pathname}
                      query={location.search}
                      viewport={viewport}
                      {...config}
                    />
                  </div>
                )}
              />
              <Route
                render={() => (
                  <div className='no-result'>
                    <Search fhirServer={config.fhirServer} />
                  </div>
                )}
              />
            </Switch>
          </Router>
        </main>
      </div>
    )
  }
}

export default App
