const { UserError, exec, openRpi3, unindent } = require('../src/common')

module.exports = () => ({
  async search (query) {
    return JSON.parse(await exec(`search-rutracker ${ query }`)) || []
  },

  printable: (torrent) => unindent`
    📕 ${ torrent.category }.
    <b>${ torrent.size_h }</b>. seeds: <b>${ torrent.seeds }</b> / leechs: ${ torrent.leechs }
    ${ torrent.title } <b> # ${ torrent.id }</b>
  `,

  download: (id) => exec(`download-rutracker ${ id }`),

  downloading: async () => {
    return Boolean(await this.info())
  },

  status: async () => {
    return info_ ? `${ await this.info() }\nОстальное скачалось` : 'Всё скачалось, господа'
  },

  info: async () => {
    const info = await openRpi3('deluge-console info -s Downloading --sort=time_added')
    return info.replace(/^(ID|State|Seeds|Seed time|Tracker status|Size):.+\n/gm, "").trim()
  },

  awaitDownloaded: async () => {
    if (this.isDownloadedPending) return this.isDownloadedPending

    this.isDownloadedPending = new Promise((res) => {
      if (!(await this.downloading())) return res(true)
      setTimeout(() => { check(); }, 10000)
    })

    const del = () => delete this.isDownloadedPending
    this.isDownloadedPending.then(del).catch(del)
    return this.isDownloadedPending
  },
})
