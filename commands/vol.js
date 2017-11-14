const bindAll = require('lodash.bindall')
const { UserError, exec } = require('../src/common')

module.exports = () => bindAll({
  set(volume) {
    checkVolumeLimit(volume)
    return exec(`vol ${ volume }`)
  },
  async delta(dx) {
    const volume = await this.get()
    const volume_ = volume + dx
    checkVolumeLimit(volume_)

    return await this.set(volume_)
  },
  get() {
    return exec('vol-get')
  },
})

const MIN = 60
const MAX = 100

function isCorrectVolume(volume) {
  return volume >= MIN && volume <= MAX
}

function checkVolumeLimit(volume) {
  if (isCorrectVolume()) return true
  throw new UserError(`vol_limit. vol unchanged. new: ${ volume }. limits: ${ MIN }–${ MAX }`)
}
