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

// weirdTag`1${ 2 }3` --> '123'
const weirdTag = (strings, ...values) =>
  strings.reduce((res, str, i) => res + values[i - 1] + str);

  // unindent`
//  123
//` ---> '\n123\n'
const unindent = (strings, ...values) =>
  weirdTag(strings, ...values).split(/\n/).map(s=>s.trim()).join('\n');


class UserError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UserError';
    this.uniqId =`${ + new Date() }.${ Math.floor(Math.random() * Math.pow(2, 16)) }`;
  }
}

function join(...args) {
  return args
    .filter(p => p !== undefined && p !== null && (typeof p === 'string' ? p.length : true))
    .map(p => p instanceof Array ? join(...p) : p)
    .join('')
}

function getOkIcon() {
  return randList(['✅', '👌', '🆗', '🤖👍', '👏', '🤘', '💪', '😺', '👻', '🙏', '✨'])
}

const getIntro = (() => {
  const getIntro_ = debounce(() => {
    return randList(['ааааа', 'вигв+аме', 'кар+оч', 'сл+ушайте', 'эт с+амое']) + ', ... &&& ... — '
  }, config.commands.list.voice.list.say.intro_delay * 1000, true)
  return () => getIntro_() || ''
})()

function openRpi3(cmd, isX11) {
  return exec(`ssh pi@rpi3 '${ isX11 ? 'DISPLAY=:0.0 ' : '' } ${ cmd.replace(/'/g, '\'') }'`)
}


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
  UserError,
  join,
  getOkIcon,
  getIntro,
  openRpi3,
};
