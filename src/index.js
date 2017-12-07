import React from 'react'
import ReactDOM from 'react-dom'
import http from 'axios'

import Router from './Router'
import addResourceHints from './resourceHints.js'
import registerServiceWorker from './registerServiceWorker'

import './css/index.css'

http
  .get('/config.json')
  .then(response => {
    const config = response.data
    ReactDOM.render(<Router config={config} />, document.getElementById('root'))
  })
  .catch(error => {
    console.error(error)
    ReactDOM.render(<Router />, document.getElementById('root'))
  })
addResourceHints()
registerServiceWorker()
