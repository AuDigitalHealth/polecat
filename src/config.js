import { createStore } from 'redux'
import http from 'axios'

const availableConfig = ['fhirServer', 'version', 'sentryDsn']

const defaultConfig = { fhirServer: 'https://medserve.online/fhir' }

// Get a config object that contains the resolved values determined by getting
// the configuration from `config.json`, then overriding that with any values
// set within local storage.
export async function getResolvedConfig() {
  const serverConfig = await getServerConfig(),
    localConfig = getLocalConfig()
  // Local configuration values override default values from the server, which
  // override the inbuilt defaults.
  return { ...defaultConfig, ...serverConfig, ...localConfig }
}

// Get the `config.json` file from the server, and return the parsed object.
async function getServerConfig() {
  const response = await http.get('/config.json')
  return response.data
}

// Get the configuration values from local storage, based on the keys
// whitelisted within the `availableConfig` constant at the top of this file.
const getLocalConfig = () => {
  try {
    const config = {}
    for (const c of availableConfig) {
      const value = window.localStorage.getItem(c)
      if (value !== null) config[c] = value
    }
    return config
  } catch (error) {
    return {}
  }
}

// Create a Redux store initialised with the supplied config object, using the
// config reducer and config middleware.
export async function createConfigStore(config) {
  return createStore(
    configReducer,
    config,
    // applyMiddleware(localConfigMiddleware),
  )
}

const configReducer = (state = {}, action) => {
  switch (action.type) {
    // {
    //   type: 'SET_CONFIG',
    //   key: '[key]',
    //   value: '[value]'
    // }
    case 'SET_CONFIG':
      return {
        ...state,
        ...{ [action.key]: action.value },
      }
    default:
      return state
  }
}

// Redux middleware that intercepts `SET_CONFIG` actions and writes the values
// to local storage.
// const localConfigMiddleware = store => next => action => {
//   console.log(store.getState())
//   return next(action)
// }
