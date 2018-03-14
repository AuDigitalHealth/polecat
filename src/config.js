import { createStore, applyMiddleware } from 'redux'
import http from 'axios'

// List of available concept visibility settings, along with the mapping to the
// internal filtering function that is used.
export const visibilityConfig = {
  // Inactive
  // TODO: Simplify configuration logic by giving inactive concepts a full set
  // of settings to themselves.
  'visibility.inactive.notReplacedBy': 'not-replaced-by',
  'visibility.inactive.substance': 'substance',
  'visibility.inactive.parentOfMp': 'parent-of-mp',
  'visibility.inactive.mp': 'mp',
  'visibility.inactive.parentOfMpuu': 'parent-of-mpuu',
  'visibility.inactive.mpuu': 'mpuu',
  'visibility.inactive.parentOfMpp': 'parent-of-mpp',
  'visibility.inactive.mpp': 'mpp',
  'visibility.inactive.tp': 'tp',
  'visibility.inactive.tpuu': 'tpuu',
  'visibility.inactive.tpp': 'tpp',
  'visibility.inactive.componentPack': 'component-pack',
  'visibility.inactive.replaces': 'replaces',
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
  // MPP
  'visibility.mpp.parentOfMp': 'parent-of-mp',
  'visibility.mpp.mp': 'mp',
  'visibility.mpp.parentOfMpuu': 'parent-of-mpuu',
  'visibility.mpp.mpuu': 'mpuu',
  'visibility.mpp.parentOfMpp': 'parent-of-mpp',
  'visibility.mpp.tpp': 'tpp',
  'visibility.mpp.replaces': 'replaces',
  // MPUU
  'visibility.mpuu.substance': 'substance',
  'visibility.mpuu.parentOfMp': 'parent-of-mp',
  'visibility.mpuu.mp': 'mp',
  'visibility.mpuu.parentOfMpuu': 'parent-of-mpuu',
  'visibility.mpuu.mpuu': 'mpuu',
  'visibility.mpuu.mpp': 'mpp',
  'visibility.mpuu.tpuu': 'tpuu',
  'visibility.mpuu.replaces': 'replaces',
  // MP
  'visibility.mp.substance': 'substance',
  'visibility.mp.parentOfMp': 'parent-of-mp',
  'visibility.mp.mp': 'mp',
  'visibility.mp.mpuu': 'mpuu',
  'visibility.mp.tpuu': 'tpuu',
  'visibility.mp.replaces': 'replaces',
  // Substance
  'visibility.substance.mp': 'mp',
  'visibility.substance.mpuu': 'mpuu',
  'visibility.substance.tpuu': 'tpuu',
}

// List of all valid configuration keys.
const availableConfig = ['fhirServer', 'version', 'sentryDsn'].concat(
  Object.keys(visibilityConfig),
)

// Default configuration settings that act as a fallback if no other value is specified.
const defaultConfig = {
  fhirServer: 'https://medserve.online/fhir',
  // Inactive
  'visibility.inactive.notReplacedBy': false,
  'visibility.inactive.substance': false,
  'visibility.inactive.parentOfMp': false,
  'visibility.inactive.mp': false,
  'visibility.inactive.parentOfMpuu': false,
  'visibility.inactive.mpuu': false,
  'visibility.inactive.parentOfMpp': false,
  'visibility.inactive.mpp': false,
  'visibility.inactive.tp': false,
  'visibility.inactive.tpuu': false,
  'visibility.inactive.tpp': false,
  'visibility.inactive.componentPack': false,
  'visibility.inactive.replaces': false,
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
  'visibility.ctpp.componentPack': false,
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
  // MPP
  'visibility.mpp.parentOfMp': true,
  'visibility.mpp.mp': true,
  'visibility.mpp.parentOfMpuu': true,
  'visibility.mpp.mpuu': true,
  'visibility.mpp.parentOfMpp': true,
  'visibility.mpp.tpp': true,
  'visibility.mpp.replaces': false,
  // MPUU
  'visibility.mpuu.substance': false,
  'visibility.mpuu.parentOfMp': true,
  'visibility.mpuu.mp': true,
  'visibility.mpuu.parentOfMpuu': true,
  'visibility.mpuu.mpuu': true,
  'visibility.mpuu.mpp': true,
  'visibility.mpuu.tpuu': true,
  'visibility.mpuu.replaces': false,
  // MP
  'visibility.mp.substance': false,
  'visibility.mp.parentOfMp': true,
  'visibility.mp.mp': true,
  'visibility.mp.mpuu': true,
  'visibility.mp.tpuu': true,
  'visibility.mp.replaces': false,
  // Substance
  'visibility.substance.mp': true,
  'visibility.substance.mpuu': true,
  'visibility.substance.tpuu': true,
}

const configValueImplications = {
  // Inactive
  'visibility.inactive.notReplacedBy': [
    {},
    {
      'visibility.inactive.substance': false,
      'visibility.inactive.parentOfMp': false,
      'visibility.inactive.mp': false,
      'visibility.inactive.parentOfMpuu': false,
      'visibility.inactive.mpuu': false,
      'visibility.inactive.parentOfMpp': false,
      'visibility.inactive.mpp': false,
      'visibility.inactive.tp': false,
      'visibility.inactive.tpuu': false,
      'visibility.inactive.tpp': false,
      'visibility.inactive.componentPack': false,
      'visibility.inactive.replaces': false,
    },
  ],
  'visibility.inactive.substance': [
    { 'visibility.inactive.notReplacedBy': true },
    {},
  ],
  'visibility.inactive.parentOfMp': [
    { 'visibility.inactive.notReplacedBy': true },
    {},
  ],
  'visibility.inactive.mp': [{ 'visibility.inactive.notReplacedBy': true }, {}],
  'visibility.inactive.parentOfMpuu': [
    { 'visibility.inactive.notReplacedBy': true },
    {},
  ],
  'visibility.inactive.mpuu': [
    { 'visibility.inactive.notReplacedBy': true },
    {},
  ],
  'visibility.inactive.parentOfMpp': [
    { 'visibility.inactive.notReplacedBy': true },
    {},
  ],
  'visibility.inactive.mpp': [
    { 'visibility.inactive.notReplacedBy': true },
    {},
  ],
  'visibility.inactive.tp': [{ 'visibility.inactive.notReplacedBy': true }, {}],
  'visibility.inactive.tpuu': [
    { 'visibility.inactive.notReplacedBy': true },
    {},
  ],
  'visibility.inactive.tpp': [
    { 'visibility.inactive.notReplacedBy': true },
    {},
  ],
  'visibility.inactive.componentPack': [
    { 'visibility.inactive.notReplacedBy': true },
    {},
  ],
  'visibility.inactive.replaces': [
    { 'visibility.inactive.notReplacedBy': true },
    {},
  ],
  // CTPP
  'visibility.ctpp.parentOfMp': [
    {
      'visibility.ctpp.mp': true,
      'visibility.ctpp.mpuu': true,
      'visibility.ctpp.mpp': true,
      'visibility.ctpp.tpp': true,
    },
    {},
  ],
  'visibility.ctpp.mp': [
    {
      'visibility.ctpp.mpuu': true,
      'visibility.ctpp.mpp': true,
      'visibility.ctpp.tpp': true,
    },
    { 'visibility.ctpp.parentOfMp': false },
  ],
  'visibility.ctpp.parentOfMpuu': [
    { 'visibility.ctpp.mpuu': true, 'visibility.ctpp.mpp': true },
    {},
  ],
  'visibility.ctpp.mpuu': [
    { 'visibility.ctpp.mpp': true, 'visibility.ctpp.tpp': true },
    {
      'visibility.ctpp.parentOfMp': false,
      'visibility.ctpp.mp': false,
      'visibility.ctpp.parentOfMpuu': false,
    },
  ],
  'visibility.ctpp.parentOfMpp': [{ 'visibility.ctpp.mpp': true }, {}],
  'visibility.ctpp.mpp': [
    { 'visibility.ctpp.tpp': true },
    {
      'visibility.ctpp.parentOfMp': false,
      'visibility.ctpp.mp': false,
      'visibility.ctpp.parentOfMpuu': false,
      'visibility.ctpp.mpuu': false,
      'visibility.ctpp.parentOfMpp': false,
    },
  ],
  'visibility.ctpp.tp': [{ 'visibility.ctpp.tpp': true }, {}],
  'visibility.ctpp.tpuu': [{ 'visibility.ctpp.tpp': true }, {}],
  'visibility.ctpp.tpp': [
    {},
    {
      'visibility.ctpp.parentOfMp': false,
      'visibility.ctpp.mp': false,
      'visibility.ctpp.parentOfMpuu': false,
      'visibility.ctpp.mpuu': false,
      'visibility.ctpp.parentOfMpp': false,
      'visibility.ctpp.mpp': false,
      'visibility.ctpp.tp': false,
      'visibility.ctpp.tpuu': false,
    },
  ],
  'visibility.ctpp.componentPack': [{}, {}],
  'visibility.ctpp.replaces': [{}, {}],
  // TPP
  'visibility.tpp.parentOfMp': [
    {
      'visibility.tpp.mp': true,
      'visibility.tpp.mpuu': true,
      'visibility.tpp.mpp': true,
    },
    {},
  ],
  'visibility.tpp.mp': [
    { 'visibility.tpp.mpuu': true, 'visibility.tpp.mpp': true },
    { 'visibility.tpp.parentOfMp': false },
  ],
  'visibility.tpp.parentOfMpuu': [{ 'visibility.tpp.mpuu': true }, {}],
  'visibility.tpp.mpuu': [
    {},
    {
      'visibility.tpp.parentOfMp': false,
      'visibility.tpp.mp': false,
      'visibility.tpp.parentOfMpuu': false,
    },
  ],
  'visibility.tpp.parentOfMpp': [{ 'visibility.tpp.mpp': true }, {}],
  'visibility.tpp.mpp': [
    {},
    {
      'visibility.tpp.parentOfMp': false,
      'visibility.tpp.mp': false,
      'visibility.tpp.parentOfMpuu': false,
      'visibility.tpp.mpuu': false,
      'visibility.tpp.parentOfMpp': false,
    },
  ],
  'visibility.tpp.tp': [{}, {}],
  'visibility.tpp.tpuu': [{}, {}],
  'visibility.tpp.ctpp': [{}, {}],
  'visibility.tpp.replaces': [{}, {}],
  // TPUU
  'visibility.tpuu.substance': [{}, {}],
  'visibility.tpuu.parentOfMp': [
    { 'visibility.tpuu.mp': true, 'visibility.tpuu.mpuu': true },
    {},
  ],
  'visibility.tpuu.mp': [
    { 'visibility.tpuu.mpuu': true },
    { 'visibility.tpuu.parentOfMp': false },
  ],
  'visibility.tpuu.parentOfMpuu': [{ 'visibility.tpuu.mpuu': true }, {}],
  'visibility.tpuu.mpuu': [
    {},
    {
      'visibility.tpuu.parentOfMp': false,
      'visibility.tpuu.mp': false,
      'visibility.tpuu.parentOfMpuu': false,
    },
  ],
  'visibility.tpuu.tp': [{}, {}],
  'visibility.tpuu.tpp': [{}, {}],
  'visibility.tpuu.replaces': [{}, {}],
  // MPP
  'visibility.mpp.parentOfMp': [
    {
      'visibility.mpp.mp': true,
      'visibility.mpp.mpuu': true,
    },
    {},
  ],
  'visibility.mpp.mp': [
    { 'visibility.mpp.mpuu': true },
    { 'visibility.mpp.parentOfMp': false },
  ],
  'visibility.mpp.parentOfMpuu': [
    {
      'visibility.mpp.mpuu': true,
    },
    {},
  ],
  'visibility.mpp.mpuu': [
    {},
    {
      'visibility.mpp.parentOfMp': false,
      'visibility.mpp.mp': false,
      'visibility.mpp.parentOfMpuu': false,
    },
  ],
  'visibility.mpp.parentOfMpp': [{}, {}],
  'visibility.mpp.tpp': [{}, {}],
  'visibility.mpp.replaces': [{}, {}],
  // MPUU
  'visibility.mpuu.substance': [{}, {}],
  'visibility.mpuu.parentOfMp': [{ 'visibility.mpuu.mp': true }, {}],
  'visibility.mpuu.mp': [{}, { 'visibility.mpuu.parentOfMp': false }],
  'visibility.mpuu.parentOfMpuu': [{ 'visibility.mpuu.mpuu': true }, {}],
  'visibility.mpuu.mpuu': [{}, { 'visibility.mpuu.parentOfMpuu': false }],
  'visibility.mpuu.mpp': [{}, {}],
  'visibility.mpuu.tpuu': [{}, {}],
  'visibility.mpuu.replaces': [{}, {}],
  // MP
  'visibility.mp.substance': [{}, {}],
  'visibility.mp.parentOfMp': [{ 'visibility.mp.mp': true }, {}],
  'visibility.mp.mp': [{}, { 'visibility.mp.parentOfMp': false }],
  'visibility.mp.mpuu': [{}, {}],
  'visibility.mp.tpuu': [{}, {}],
  'visibility.mp.replaces': [{}, {}],
  // Substance
  'visibility.substance.mp': [{}, {}],
  'visibility.substance.mpuu': [{}, {}],
  'visibility.substance.tpuu': [{}, {}],
}

// Accepts a configuration value and returns an object containing all other
// configuration values that this implies, e.g. hiding MPUUs on a CTPP model
// implies that MPs will also be hidden.
export const configValueImplies = (key, value) =>
  value ? configValueImplications[key][0] : configValueImplications[key][1]

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
      // Values need to be deserialised on the way out of local storage, as it
      // only stores strings.
      const value = JSON.parse(window.localStorage.getItem(c))
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
    applyMiddleware(localConfigMiddleware),
  )
}

const configReducer = (state = {}, action) => {
  switch (action.type) {
    // {
    //   type: 'SET_CONFIG',
    //   config: {...},
    // }
    case 'SET_CONFIG':
      return {
        ...state,
        ...action.config,
      }
    default:
      return state
  }
}

export const configActions = {
  setConfig: config => {
    return {
      type: 'SET_CONFIG',
      config,
    }
  },
}

// Redux middleware that intercepts `SET_CONFIG` actions and writes the values
// to local storage.
const localConfigMiddleware = () => next => action => {
  if (action.type === 'SET_CONFIG')
    for (const key in action.config) {
      // Values need to be serialised on the way in to local storage, as it only
      // stores strings.
      window.localStorage.setItem(key, JSON.stringify(action.config[key]))
    }
  return next(action)
}
