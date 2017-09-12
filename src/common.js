const Telegraf = require('telegraf');
const { Extra, Markup } = require('telegraf');
const config = require('../config');
const consts = require('../consts')(config);
const TOKEN = null;
const token = process.env.BOT_TOKEN || TOKEN;
const util = require('util');
const fs = require('fs');
  const read = (name, content) => util.promisify(fs.readFile)(name, 'utf8');
  const write = (name, content) => util.promisify(fs.writeFile)(name, typeof content === 'string' ? content : JSON.stringify(content, null, '\t'), 'utf8');
const child_process = require('child_process');
  const exec = util.promisify(child_process.exec.bind(child_process));
const getLightStatus = () => exec('gpio -1 read 22').then(l => parseInt(l, 10));
const throttle = require('lodash.throttle');
const debounce = require('just-debounce-it');
const inflect = require('cyrillic-inflector');
const randList = (list) => list[Math.floor(Math.random() * list.length)];
const fetch = require('isomorphic-fetch');
  const open = (uri) => fetch(uri).then(r => r.status >= 400 ? thrw (r.status) : r.text());
  const parse = html => new (require('jsdom').JSDOM)(html);
const decode = (str) => (new require('html-entities').XmlEntities).decode(str);

const reportHomematesPresenseChange = async () => {
  if ((new Date()).getHours() < 9) return;
  console.log('poll homemates presense');
  const diff = await getHomematesPresenseChange();
  if (diff.length) {
    sendHomematesDiff(diff);
    onChange('home', 'presense', diff);
  }
};

const sendHomematesDiff = debounce((diff) => {
  console.log('diff', diff);
  app.telegram.sendMessage(VIGVAM_ID, '🏠↘︎↖︎\n'
  + diff.map(item => homemates.get(item.who, 'name') + (item.before ? ' вернулся' : (Math.random() > .5 ? ' ушёл' : ' свалил'))));
}, 1000 * 60 * consts.HOME_DIFF_DELAY, true);

const getHomematesPresenseChange = () => {
  const diff = whoAtHome().then(actualPresense => {
    const diff = Object.keys(homemates.list).filter(key => {
      return (homemates.get(key, 'presense') !== undefined && homemates.get(key, 'presense') !== null) && homemates.get(key, 'presense') !== actualPresense[key];
    })
    .map(key => {
      return { who: key, after: homemates.get(key, 'presense'), before: actualPresense[key] };
    });
    homemates.setAll('presense', actualPresense);
    return diff;
  });
  return diff;
};

// weirdTag`1${ 2 }3` --> '123'
const weirdTag = (strings, ...values) =>
  strings.reduce((res, str, i) => res + values[i - 1] + str);

  // unindent`
//  123
//` ---> '\n123\n'
const unindent = (strings, ...values) =>
  weirdTag(strings, ...values).split(/\n/).map(s=>s.trim()).join('\n');


module.exports = {
  Telegraf,
  Extra, Markup,
  token,
  util,
  fs,
  read,
  write,
  child_process,
  exec,
  getLightStatus,
  throttle,
  debounce,
  inflect,
  randList,
  fetch,
  open,
  parse,
  decode,
	config,
  consts,
  unindent,

  reportHomematesPresenseChange,
};
