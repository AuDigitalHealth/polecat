import React, { Component } from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import PropTypes from 'prop-types'
import throttle from 'lodash.throttle'
import queryString from 'query-string'

import AmtBrowser from './AmtBrowser.js'

class Router extends Component {
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

  getQueryFromLocation(location) {
    if (!location.search) return null
    const parsed = queryString.parse(location.search)
    return parsed.q ? parsed.q : null
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
          <BrowserRouter>
            <Switch>
              <Route
                path='/Medication/:id'
                render={({ location, match }) => (
                  <AmtBrowser
                    id={match.params.id}
                    query={this.getQueryFromLocation(location)}
                    viewport={viewport}
                    config={config}
                  />
                )}
              />
              <Route
                path='/Substance/:id'
                render={({ location, match }) => (
                  <AmtBrowser
                    resourceType='Substance'
                    id={match.params.id}
                    query={this.getQueryFromLocation(location)}
                    viewport={viewport}
                    config={config}
                  />
                )}
              />
              <Route
                path='/'
                render={({ location, match }) => (
                  <AmtBrowser
                    query={this.getQueryFromLocation(location)}
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
          </BrowserRouter>
        </main>
      </div>
    )
  }
}

export const rootPath = () => '/'
export const searchPathFromQuery = query => `/?q=${encodeURIComponent(query)}`

export default Router
