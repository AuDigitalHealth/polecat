import React, { Component } from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import PropTypes from 'prop-types'

import RemoteFhirMedication from './RemoteFhirMedication.js'

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
                  <RemoteFhirMedication
                    path={location.pathname}
                    query={location.search}
                    {...config}
                  />}
              />
              <Route
                render={() =>
                  <p>
                    Please provide a path to a valid FHIR resource within the
                    URL.
                  </p>}
              />
            </Switch>
          </Router>
        </main>
      </div>
    )
  }
}

export default App
