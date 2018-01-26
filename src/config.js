const getLocalConfigPath = () => '../config'
const getGlobalConfigPath = () => '/home/pi/.config/tg-bot.json'

const globalConfig = tryRequire(getGlobalConfigPath()) || {}
const localConfig = tryRequire(getLocalConfigPath()) || {}

const configs = {}
function tryRequire (modulePath) {
  if (configs[modulePath]) return configs[modulePath]
  try {
    configs[modulePath] = require(modulePath) // eslint-disable-line import/no-dynamic-require
    return configs[modulePath]
  } catch (e) {
    console.error('no config file', modulePath, e)
    return null
  }
}

module.exports = { globalConfig, localConfig }
