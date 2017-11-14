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

  status: async () => {
    const info = await openRpi3('deluge-console info -s Downloading --sort=time_added')
    const info_ = info.replace(/^(ID|State|Seeds|Seed time|Tracker status|Size):.+\n/gm, "").trim()

    return info_ ? `${ info_ }\nОстальное скачалось` : 'Всё скачалось, господа'
  },
})
