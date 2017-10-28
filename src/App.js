import React, { Component } from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import PropTypes from 'prop-types'
import throttle from 'lodash.throttle'

import AmtBrowser from './AmtBrowser.js'

class App extends Component {
  static propTypes = {
    config: PropTypes.object,
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
                  <AmtBrowser
                    location={location}
                    viewport={viewport}
                    config={config}
                  />
                )}
              />
              <Route
                render={() => (
                  <AmtBrowser viewport={viewport} config={config} />
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
