const { randRange } = require('./common')

// const { reportHomematesPresenseChange } = require('../plugins/home');

const cron = (...args) => new (require('cron').CronJob)(...args, null, 'Russia/Moscow')
const HOUR = 1000 * 60 * 60
const DAY = HOUR * 24 // eslint-disable-line no-unused-vars


// const cronTasks = (strings) => {
//   strings[0].split(/\n/)
//   .map(line => line.trim())
//   .filter(line => lint)
//   .map(task => {
//     const [s, m, h, dom, mon, dow, ...cmd] = task.split(/\s+/);
//     cron([s, m, h, dom, mon, dow].join(' '), exec(cmd.join(' ')));
//   });
// };

// setInterval(reportHomematesPresenseChange, 1000 * 60 * 1);

// todo: rpi3 vol
// todo: alex presense ifttt signal => light schedule

module.exports = ({ commands }) => {
  //    ss mm hh dom mon dow
  cron('00 00  1 *   *   *  ', () => commands.runSys('light', 'off'))
  cron('00 00 12 *   *   *  ', () => commands.runSys('light', 'on'))
  cron('00 10 14 *   *   *  ', () => commands.runSys('light', 'off'))

  cron('00 30 10 *   *   *  ', () => commands.runSys('vol', 'upTo', 70))
  cron('00 30 12 *   *   *  ', () => commands.runSys('vol', 'upTo', 80))
  cron('00 30 13 *   *   *  ', () => commands.runSys('vol', 'upTo', 90))
  cron('00 00 23 *   *   *  ', () => commands.runSys('vol', 'downTo', 80))
  cron('00 00 01 *   *   *  ', () => commands.runSys('vol', 'downTo', 70))
  cron('00 00 02 *   *   *  ', () => commands.runSys('vol', 'downTo', 60))

  cron('00 28 09 *   *   *  ', () => commands.runSys('weather', 'forecast'))

  cron('00 00 09 *   *   *  ', () => randomize(() => commands.runSys('jokes', 'joke')))

  cron('00 00 14 *   *   mon', () => commands.runSys('delivery', 'water')) // TODO: sync with vacancy schedule

  cron('00 00 12 *   *   *  ', () => commands.runSys('music', 'podcast')) // TODO: sync with presense
}

function randomize (cb) {
  if (Math.random() > .5) return
  setTimeout(cb, randRange(HOUR, 8 * HOUR))
}
