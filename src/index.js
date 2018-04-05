import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { Router as ReactRouter } from 'react-router-dom'
import { createBrowserHistory } from 'history'
import bowser from 'bowser'
import Raven from 'raven-js'
import ga from 'react-ga'

import { getResolvedConfig, createConfigStore } from './config.js'
import Router from './Router'

import './css/index.css'

// Deregister any service workers. This is to make sure that service workers
// that were installed within previous versions of the code are now removed from
// all clients. This was causing some problems with caching of the JS bundle.
if (navigator.serviceWorker) {
  navigator.serviceWorker
    .getRegistrations()
    .then(registrations => {
      for (let registration of registrations) {
        registration.unregister()
      }
      return registrations
    })
    .catch(error => console.error(error)) // eslint-disable-line no-console
}

const trackPageView = location => {
  ga.set({ location: location.toString() })
  ga.pageview(location.pathname + location.search)
}

// Block browsers that are known to be incompatible with the application.
if (
  (bowser.msie && bowser.version <= 11) ||
  (bowser.firefox && bowser.version < 45)
) {
  document.write(
    '<div class="incompatible-browser"><p>&#x1f625&#x1f625&#x1f625</p><p>You appear to be running a very old web browser, which does not have the necessary features to run this application...</p><p>&#x1f625&#x1f625&#x1f625</p></div>',
  )
} else {
  // Get the resolved configuration values from the configuration file and the contents of local storage.
  getResolvedConfig()
    // Load Google Analytics if a tracking ID has been configured.
    .then(config => {
      if (config.googleAnalyticsTrackingId) {
        ga.initialize(config.googleAnalyticsTrackingId)
        trackPageView(window.location)
      }
      return config
    })
    // Initialise Sentry reporting if a DSN has been configured.
    .then(config => {
      if (config.sentryDsn) {
        Raven.config(config.sentryDsn, { release: config.version }).install()
      }
      return config
    })
    // Load configuration into a Redux store.
    .then(config => createConfigStore(config))
    // Initialise the React app, and pass in the Redux store.
    .then(store => {
      const history = createBrowserHistory(),
        config = store.getState()
      // eslint-disable-next-line react/no-render-return-value
      ReactDOM.render(
        <Provider store={store}>
          <ReactRouter history={history}>
            <Router />
          </ReactRouter>
        </Provider>,
        document.getElementById('root'),
      )
      // If a Google Analytics tracking ID is configured, set up a listener to
      // track a virtual page view each time the URL changes.
      if (config.googleAnalyticsTrackingId) {
        history.listen(() => trackPageView(window.location))
      }
      return true
    })
    .catch(error => {
      // If for some reason there is an error in the load process, display a
      // rudimentary error message on the page and write the error to the console.
      document.write(
        '<p>Unexpected error occurred when loading configuration.</p>',
      )
      console.error(error) // eslint-disable-line no-console
    })
}
