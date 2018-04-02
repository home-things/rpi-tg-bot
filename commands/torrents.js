const bindAll = require('lodash.bindall')
const { exec, openRpi3, unindent } = require('../src/common')

const COMPLETE_DELUGE_STATUSES = ['Downloading', 'Active', 'Allocating', 'Checking']

// TODO: Create abstract torrent client SDK

module.exports = () => bindAll({
  async search (query) {
    return JSON.parse(await exec(`search-rutracker ${ query }`)) || []
  },

  printable (torrent) {
    return unindent`
    📕 ${ torrent.category }.
    <b>${ torrent.size_h }</b>. seeds: <b>${ torrent.seeds }</b> / leechs: ${ torrent.leechs }
    ${ torrent.title } <b> # ${ torrent.id }</b>
  `
  },

  download (id) {
    return exec(`download-rutracker ${ id }`)
  },

  async downloading () {
    return Boolean(await this.info())
  },

  async complete () {
    const checkCompleteCmd = COMPLETE_DELUGE_STATUSES.map(s => `deluge-console info -s ${ s }`).join('; ')
    return Boolean((await openRpi3(checkCompleteCmd)).trim())
  },

  async status () {
    const info = await this.info()
    return info ? `${ info }\nОстальное скачалось` : 'Всё скачалось, господа'
  },

  async info () {
    const info = await openRpi3('deluge-console info -s Downloading --sort=time_added')
    return info.replace(/^(ID|State|Seeds|Seed time|Tracker status|Size):.+\n/gm, '').trim()
  },

  async awaitDownloaded () {
    if (this.isDownloadedPending) return this.isDownloadedPending

    this.isDownloadedPending = new Promise(async (res) => {
      const check = async () => {
        if (await this.complete()) return res(true)
        setTimeout(check, 10000)
      }
      setTimeout(check, 10000)
    })

    const del = () => delete this.isDownloadedPending
    this.isDownloadedPending.then(del).catch(del)
    return this.isDownloadedPending
  },
})
