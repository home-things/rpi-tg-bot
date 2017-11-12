const {
  exec,
  isDefined,
  getRandList,
  consts,
  config,
} = require('../common');

const { getLightStatus } = require('./light');

const homemates = {
  list: config.commands.list.home.data.homemates.list,
  get(key, field) { return this.list[key.toLowerCase()] && this.list[key.toLowerCase()][field]; },
  set(key, field, val) { this.list[key][field] = val; return val; },
  setAll(field, object) { Object.keys(this.list).forEach((key) => { this.set(key, field, object[key]); }); },
  empty() { return Object.keys(this.list).every(key => !this.get(key, 'presense')); },
  full() { return Object.keys(this.list).every(key => this.get(key, 'presense')); },
  isMember(id) { return Object.keys(this.list).some(key => this.get(key, 'id') === id); },
};

const onChange = (type, signal, data) => {
  switch (type) {
    case ('home'):
      switch (signal) {
        case ('presense'):
          if (data.sasha && data.sasha.before) {
            getLightStatus().then((v) => { if (v.trim()) throw 'y'; }).then(() => exec('light on')).then(() => {
              app.telegram.sendMessage(homemates.get('sasha', 'id'), 'Sasha came back ==> Light turned on');
            })
              .catch(() => { });
          }
          if (data.sasha && !data.sasha.before) {
            getLightStatus().then((v) => { if (!v.trim()) throw 'n'; }).then(() => exec('light off')).then(() => {
              app.telegram.sendMessage(homemates.get('sasha', 'id'), 'Sasha left ==> Light turned off');
            })
              .catch(() => { });
          }
          if (homemates.empty()) {
            exec('has-music').then((v) => { if (!v.trim()) throw 'none'; }).then(() => exec('stop-music')).then(() => {
              app.telegram.sendMessage(consts.VIGVAM_ID, 'Nobody at home ==> Music stopped');
            })
              .catch(() => { });
          }
          if (homemates.full()) {
            app.telegram.sendMessage(consts.VIGVAM_ID, `${getRandList(['С возвращением!', 'all in the home.'])}\n\n 😇 p.s. I don\`t notify more often than every 30 minutes`);
          }
          break;
        default: break;
      }
      break;
    default: break;
  }
};

const whoAtHomeRequest = () => exec('who-at-home2')
  .then((stdout) => {
    const j = JSON.parse(stdout);
    console.info('whoAtHome info', stdout, j);
    return j;
  });

const whoAtHome = () => whoAtHomeRequest()
  .catch((e) => {
    console.error('whoAtHome error', e);
    return whoAtHomeRequest(); // try once again
  });

const sendHomematesDiff = debounce((diff) => {
  console.log('diff', diff);
  app.telegram.sendMessage(VIGVAM_ID, `🏠↘︎↖︎\n${
    diff.map(item => homemates.get(item.who, 'name') + (item.before ? ' вернулся' : (Math.random() > 0.5 ? ' ушёл' : ' свалил'))) }`);
}, 1000 * 60 * consts.HOME_DIFF_DELAY, true);

const reportHomematesPresenseChange = async () => {
  if ((new Date()).getHours() < 9) return;
  console.log('poll homemates presense');
  const diff = await getHomematesPresenseChange();
  if (diff.length) {
    sendHomematesDiff(diff);
    onChange('home', 'presense', diff);
  }
};

function getHomematesPresenseChange() {
  const diff = whoAtHome().then((actualPresense) => {
    const diff = Object.keys(homemates.list)
      .filter((key) => {
        return isDefined(homemates.get(key, 'presense')) && homemates.get(key, 'presense') !== actualPresense[key];
      })
      .map(key => ({ who: key, after: homemates.get(key, 'presense'), before: actualPresense[key] }));
    homemates.setAll('presense', actualPresense);
    return diff;
  });
  return diff;
}

module.exports = whoAtHome;
