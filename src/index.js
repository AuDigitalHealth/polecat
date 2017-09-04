import React from 'react'
import ReactDOM from 'react-dom'
import http from 'axios'

import App from './App'
import registerServiceWorker from './registerServiceWorker'

import './css/index.css'

http
  .get('/config.json')
  .then(response => {
    const config = response.data
    ReactDOM.render(<App config={config} />, document.getElementById('root'))
  })
  .catch(error => console.error(error))
registerServiceWorker()
