const config =
  process.env.NODE_ENV === 'test'
    ? require('./config.json')
    : require('../public/config.json')

export default config
