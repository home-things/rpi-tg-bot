const bindAll = require('lodash.bindall')
const { UserError, exec } = require('../src/common')

module.exports = () => bindAll({
  async set(volume) {
    checkVolumeLimit(volume)
    return await exec(`vol2 ${ volume }`)
  },
  async delta(dx) {
    const volume = await this.get()
    const volume_ = volume + dx
    checkVolumeLimit(volume_)

    return await this.set(volume_)
  },
  async upTo(vol_) {
    const vol = await this.get()
    if (!checkVolumeIntent(vol, vol_, 'up')) return
    return await this.set(vol_)
  },
  async downTo(vol_) {
    const vol = await this.get()
    if (!checkVolumeIntent(vol, vol_, 'down')) return
    return await this.set(vol_)
  },
  async get() {
    return await exec('vol-get')
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

function checkVolumeIntent(vol, vol_, intent) {
  if (intent === 'up' && vol_ <= vol || intent === 'down' && vol_ >= vol) {
    console.warn('vol_unchanged', 'vol\'', vol_, 'vol', vol, 'intent', intent)
    return false
  }
  return true
}
