import React, { Component } from 'react'
import { Route, Switch } from 'react-router-dom'
import PropTypes from 'prop-types'
import throttle from 'lodash.throttle'
import queryString from 'query-string'

import AmtBrowser from './AmtBrowser.js'
import { codingToSnomedDisplay } from './fhir/medication.js'

export const rootPath = () => '/'
export const searchPathFromQuery = query => `/?q=${encodeURIComponent(query)}`

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
    this.handleLoadSubjectConcept = this.handleLoadSubjectConcept.bind(this)
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

  handleLoadSubjectConcept(concept) {
    if (concept) {
      const display = codingToSnomedDisplay(concept.coding)
      document.title = display ? `${display} - Polecat` : 'Polecat'
    } else {
      document.title = 'Polecat'
    }
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleWindowResize)
  }

  render() {
    const { config } = this.props
    const { viewport } = this.state
    return (
      <div className="app">
        <main>
          <Switch>
            <Route
              path="/Medication/:id"
              render={({ location, match }) => (
                <AmtBrowser
                  id={match.params.id}
                  query={this.getQueryFromLocation(location)}
                  viewport={viewport}
                  config={config}
                  onLoadSubjectConcept={this.handleLoadSubjectConcept}
                />
              )}
            />
            <Route
              path="/Substance/:id"
              render={({ location, match }) => (
                <AmtBrowser
                  resourceType="Substance"
                  id={match.params.id}
                  query={this.getQueryFromLocation(location)}
                  viewport={viewport}
                  config={config}
                  onLoadSubjectConcept={this.handleLoadSubjectConcept}
                />
              )}
            />
            <Route
              path="/"
              render={({ location }) => {
                this.handleLoadSubjectConcept()
                return (
                  <AmtBrowser
                    query={this.getQueryFromLocation(location)}
                    viewport={viewport}
                    config={config}
                  />
                )
              }}
            />
            <Route
              render={() => <AmtBrowser viewport={viewport} config={config} />}
            />
          </Switch>
        </main>
      </div>
    )
  }
}

export default Router
