import React from 'react'
import ReactDOM from 'react-dom'
import http from 'axios'
import bowser from 'bowser'
import Raven from 'raven-js'

import Router from './Router'

import './css/index.css'

if (
  (bowser.msie && bowser.version <= 11) ||
  (bowser.firefox && bowser.version < 50)
) {
  document.write(
    '<div class="incompatible-browser"><p>&#x1f625&#x1f625&#x1f625</p><p>You appear to be running a very old web browser, which does not have the necessary features to run this application...</p><p>&#x1f625&#x1f625&#x1f625</p></div>',
  )
} else {
  http
    .get('/config.json')
    .then(response => {
      const config = response.data
      if (config.sentryDsn) {
        Raven.config(config.sentryDsn, { release: config.version }).install()
      }
      ReactDOM.render(
        <Router config={config} />,
        document.getElementById('root'),
      )
    })
    .catch(error => {
      // eslint-disable-next-line no-console
      console.error(error)
      ReactDOM.render(<Router />, document.getElementById('root'))
    })
}
