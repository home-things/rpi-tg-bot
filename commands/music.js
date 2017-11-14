const bindAll = require('lodash.bindall')
const { exec } = require('../src/common')

module.exports = () => bindAll({
  stop:   () => action('stop'),
  pause:  () => action('pause'),
  resume: () => action('resume'),
  play:   async (link) => {
    await exec(`pause-music || :`)
    await exec(`mplayer "${ link.trim() }"`)
    await exec(`resume-music || :`)
  }
})

async function action(kind) {
  const hasMusic = await exec('has-music')
  if (!hasMusic) throw new UserError('no_music. No music detected. You can ask /quieter')

  await exec(`${ kind }-music`)
}
