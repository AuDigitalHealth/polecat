import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import bowser from 'bowser'
import Raven from 'raven-js'

import { getResolvedConfig, createConfigStore } from './config.js'
import Router from './Router'

import './css/index.css'

// Deregister any service workers. This is to make sure that service workers
// that were installed within previous versions of the code are now removed from
// all clients. This was causing some problems with caching of the JS bundle.
if (navigator.serviceWorker) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for (let registration of registrations) {
      registration.unregister()
    }
  })
}

if (
  (bowser.msie && bowser.version <= 11) ||
  (bowser.firefox && bowser.version < 45)
) {
  document.write(
    '<div class="incompatible-browser"><p>&#x1f625&#x1f625&#x1f625</p><p>You appear to be running a very old web browser, which does not have the necessary features to run this application...</p><p>&#x1f625&#x1f625&#x1f625</p></div>',
  )
} else {
  getResolvedConfig()
    .then(config => {
      if (config.sentryDsn) {
        Raven.config(config.sentryDsn, { release: config.version }).install()
      }
      return config
    })
    .then(config => {
      createConfigStore(config).then(store =>
        // eslint-disable-next-line react/no-render-return-value
        ReactDOM.render(
          <Provider store={store}>
            <BrowserRouter>
              <Router />
            </BrowserRouter>
          </Provider>,
          document.getElementById('root'),
        ),
      )
    })
    .catch(error => {
      document.write(
        '<p>Unexpected error occurred when loading configuration.</p>',
      )
      console.error(error) // eslint-disable-line no-console
    })
}
