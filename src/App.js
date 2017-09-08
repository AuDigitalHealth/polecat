import React, { Component } from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import PropTypes from 'prop-types'

import RemoteFhirMedication from './RemoteFhirMedication.js'
import Search from './Search.js'

class App extends Component {
  static propTypes = {
    config: PropTypes.object,
  }

  static defaultProps = {
    config: { fhirServer: 'http://medserve.online/fhir' },
  }

  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    const { config } = this.props

    return (
      <div className='app'>
        <main>
          <Router>
            <Switch>
              <Route
                path='/:path'
                render={({ location }) =>
                  <div className='medication-result'>
                    <Search fhirServer={config.fhirServer} />
                    <RemoteFhirMedication
                      path={location.pathname}
                      query={location.search}
                      {...config}
                    />
                  </div>}
              />
              <Route
                render={() =>
                  <div className='no-result'>
                    <Search />
                  </div>}
              />
            </Switch>
          </Router>
        </main>
      </div>
    )
  }
}

export default App
