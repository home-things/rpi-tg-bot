const bindAll = require('lodash.bindall')
const { randFromList, exec } = require('../src/common')
// const { getLightStatus } = require('./light')

module.exports = ({ config }) => bindAll({
  list: config.commands.list.home.data.homemates.list,
  get (key, field) { return this.list[key.toLowerCase()] && this.list[key.toLowerCase()][field] },
  set (key, field, val) { return this.list[key][field] = val },
  setAll (field, object) { Object.keys(this.list).forEach((key) => { this.set(key, field, object[key]); }) },
  empty () { return Object.keys(this.list).every(key => !this.get(key, 'presense')) },
  full () { return Object.keys(this.list).every(key => this.get(key, 'presense')) },
  isMember (id) { return Object.keys(this.list).some(key => this.get(key, 'id') === id) },
  format () { return format(this) },
})

async function format (homemates) {
  const status = await whoAtHome()

  const name = (key) => homemates.get(key, 'name')
  const here = (key) => randFromList(['дома ', 'тута', 'где-то здесь'])
  const outside = (key) => randFromList(['не дома', 'отсутствует', 'шляется'])
  const outside_ = (key) => key === 'lenya' ? randFromList(['— по бабам', '— опять по бабам']) : outside(key)
  const hereStatus = (key) => `✅ ${ name(key) } ${ here(key) }`
  const outsideStatus = (key) => `🔴 ${ name(key) } ${ outside_(key) }`
  const getStatus = (key) => status[key] ? hereStatus(key) : outsideStatus(key)

  return Object.keys(homemates.list).map((key) => getStatus(key)).join('\n')
}
module.exports.format = format

async function whoAtHomeRequest () {
  const stdout = await exec('who-at-home2')
  const j = JSON.parse(stdout)
  console.log('whoAtHome info', stdout, j)
  return j
}

async function whoAtHome () {
  try {
    return await whoAtHomeRequest()
  } catch(e) {
    console.error('whoAtHome error', e)
    return await whoAtHomeRequest() // try once again
  }
}
module.exports.whoAtHome = whoAtHome

// todo
// const reportHomematesPresenseChange = async () => {
  // if ((new Date()).getHours() < 9) return;
  // console.log('poll homemates presense');
  // const diff = await getHomematesPresenseChange();
  // if (diff.length) {
  //   sendHomematesDiff(diff);
  //   onChange('home', 'presense', diff);
  // }
// };

// const sendHomematesDiff = debounce((diff) => {
//   console.log('diff', diff);
//   app.telegram.sendMessage(VIGVAM_ID, '🏠↘︎↖︎\n'
//   + diff.map(item => homemates.get(item.who, 'name') + (item.before ? ' вернулся' : (Math.random() > .5 ? ' ушёл' : ' свалил'))));
// }, 1000 * 60 * consts.HOME_DIFF_DELAY, true);

// const getHomematesPresenseChange = () => {
//   const diff = whoAtHome().then(actualPresense => {
//     const diff = Object.keys(homemates.list).filter(key => {
//       return (homemates.get(key, 'presense') !== undefined && homemates.get(key, 'presense') !== null) && homemates.get(key, 'presense') !== actualPresense[key];
//     })
//     .map(key => {
//       return { who: key, after: homemates.get(key, 'presense'), before: actualPresense[key] };
//     });
//     homemates.setAll('presense', actualPresense);
//     return diff;
//   });
//   return diff;
// };

// const onChange = (type, signal, data) => {
//   switch (type) {
//     case ('home'):
//       switch (signal) {
//         case ('presense'):
//           if (data.sasha && data.sasha.before) getLightStatus().then(v => { if (v.trim()) throw 'y' }).then(() => exec('light on')).then(() => {
//             app.telegram.sendMessage(homemates.get('sasha', 'id'), 'Sasha came back ==> Light turned on')
//           }).catch(() => { })
//           if (data.sasha && !data.sasha.before) getLightStatus().then(v => { if (!v.trim()) throw 'n' }).then(() => exec('light off')).then(() => {
//             app.telegram.sendMessage(homemates.get('sasha', 'id'), 'Sasha left ==> Light turned off')
//           }).catch(() => { })
//           if (homemates.empty()) exec('has-music').then(v => { if (!v.trim()) throw 'none' }).then(() => exec('stop-music')).then(() => {
//             app.telegram.sendMessage(consts.VIGVAM_ID, 'Nobody at home ==> Music stopped')
//           }).catch(() => { })
//           if (homemates.full()) app.telegram.sendMessage(consts.VIGVAM_ID, randFromList(['С возвращением!', 'all in the home.']) + '\n\n 😇 p.s. I don`t notify more often than every 30 minutes');
//           break;
//       }
//       break;
//   }
// }
