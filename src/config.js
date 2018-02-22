import { createStore } from 'redux'
import http from 'axios'

// List of available concept visibility settings, along with the mapping to the
// internal filtering function that is used.
export const visibilityConfig = {
  // CTPP
  'visibility.ctpp.parentOfMp': 'parent-of-mp',
  'visibility.ctpp.mp': 'mp',
  'visibility.ctpp.parentOfMpuu': 'parent-of-mpuu',
  'visibility.ctpp.mpuu': 'mpuu',
  'visibility.ctpp.parentOfMpp': 'parent-of-mpp',
  'visibility.ctpp.mpp': 'mpp',
  'visibility.ctpp.tp': 'tp',
  'visibility.ctpp.tpuu': 'tpuu',
  'visibility.ctpp.tpp': 'tpp',
  'visibility.ctpp.componentPack': 'component-pack',
  'visibility.ctpp.replaces': 'replaces',
  // TPP
  'visibility.tpp.parentOfMp': 'parent-of-mp',
  'visibility.tpp.mp': 'mp',
  'visibility.tpp.parentOfMpuu': 'parent-of-mpuu',
  'visibility.tpp.mpuu': 'mpuu',
  'visibility.tpp.parentOfMpp': 'parent-of-mpp',
  'visibility.tpp.mpp': 'mpp',
  'visibility.tpp.tp': 'tp',
  'visibility.tpp.tpuu': 'tpuu',
  'visibility.tpp.ctpp': 'ctpp',
  'visibility.tpp.replaces': 'replaces',
  // TPUU
  'visibility.tpuu.substance': 'substance',
  'visibility.tpuu.parentOfMp': 'parent-of-mp',
  'visibility.tpuu.mp': 'mp',
  'visibility.tpuu.parentOfMpuu': 'parent-of-mpuu',
  'visibility.tpuu.mpuu': 'mpuu',
  'visibility.tpuu.tp': 'tp',
  'visibility.tpuu.tpp': 'tpp',
  'visibility.tpuu.replaces': 'replaces',
  // MPUU
  'visibility.mpuu.substance': 'substance',
  'visibility.mpuu.parentOfMp': 'parent-of-mp',
  'visibility.mpuu.mp': 'mp',
  'visibility.mpuu.parentOfMpuu': 'parent-of-mpuu',
  'visibility.mpuu.mpp': 'mpp',
  'visibility.mpuu.tpuu': 'tpuu',
  'visibility.mpuu.replaces': 'replaces',
  // MP
  'visibility.mp.substance': 'substance',
  'visibility.mp.parentOfMp': 'parent-of-mp',
  'visibility.mp.mpuu': 'mpuu',
  'visibility.mp.tpuu': 'tpuu',
  'visibility.mp.replaces': 'replaces',
  // Substance
  'visibility.substance.mp': 'mp',
  'visibility.substance.mpuu': 'mpuu',
  'visibility.substance.tpuu': 'tpuu',
  // Inactive
  'visibility.inactive.hideAllExceptReplacedBy': 'not-replaced-by',
}

// List of all valid configuration keys.
const availableConfig = ['fhirServer', 'version', 'sentryDsn'].concat(
  Object.keys(visibilityConfig),
)

// Default configuration settings that act as a fallback if no other value is specified.
const defaultConfig = {
  fhirServer: 'https://medserve.online/fhir',
  // CTPP
  'visibility.ctpp.parentOfMp': false,
  'visibility.ctpp.mp': true,
  'visibility.ctpp.parentOfMpuu': false,
  'visibility.ctpp.mpuu': true,
  'visibility.ctpp.parentOfMpp': true,
  'visibility.ctpp.mpp': true,
  'visibility.ctpp.tp': true,
  'visibility.ctpp.tpuu': true,
  'visibility.ctpp.tpp': true,
  'visibility.ctpp.componentPack': true,
  'visibility.ctpp.replaces': false,
  // TPP
  'visibility.tpp.parentOfMp': false,
  'visibility.tpp.mp': true,
  'visibility.tpp.parentOfMpuu': false,
  'visibility.tpp.mpuu': true,
  'visibility.tpp.parentOfMpp': true,
  'visibility.tpp.mpp': true,
  'visibility.tpp.tp': true,
  'visibility.tpp.tpuu': true,
  'visibility.tpp.ctpp': true,
  'visibility.tpp.replaces': false,
  // TPUU
  'visibility.tpuu.substance': false,
  'visibility.tpuu.parentOfMp': false,
  'visibility.tpuu.mp': true,
  'visibility.tpuu.parentOfMpuu': true,
  'visibility.tpuu.mpuu': true,
  'visibility.tpuu.tp': true,
  'visibility.tpuu.tpp': true,
  'visibility.tpuu.replaces': false,
  // MPUU
  'visibility.mpuu.substance': false,
  'visibility.mpuu.parentOfMp': true,
  'visibility.mpuu.mp': true,
  'visibility.mpuu.parentOfMpuu': true,
  'visibility.mpuu.mpp': true,
  'visibility.mpuu.tpuu': true,
  'visibility.mpuu.replaces': false,
  // MP
  'visibility.mp.substance': true,
  'visibility.mp.parentOfMp': true,
  'visibility.mp.mpuu': true,
  'visibility.mp.tpuu': true,
  'visibility.mp.replaces': false,
  // Substance
  'visibility.substance.mp': true,
  'visibility.substance.mpuu': true,
  'visibility.substance.tpuu': true,
  // Inactive
  'visibility.inactive.hideAllExceptReplacedBy': true,
}

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
