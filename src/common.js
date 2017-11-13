const Telegraf = require('telegraf');
const { Extra, Markup } = require('telegraf');
const config = require('../config');
const consts = require('../consts')(config);
const throttle = require('lodash.throttle');
const debounce = require('just-debounce-it');
const inflect = require('cyrillic-inflector');
const thrw = require('throw');

const { util, pify } = (() => {
  const util = require('util'); // eslint-disable-line
  return { util, pify: util.promisify.bind(util) };
})();

const { read, write } = (() => {
  const fs = require('fs');
  const j2s = j => JSON.stringify(j, null, '\t');
  const writeFile = pify(fs.writeFile);
  const read = name => pify(fs.readFile)(name, 'utf8'); // eslint-disable-line
  // eslint-disable-next-line
  const write = (name, content) => writeFile(name, typeof content === 'string' ? content : j2s(content), 'utf8');
  return { read, write };
})();

const parse = (() => {
  const { JSDOM: Jsdom } = require('jsdom');
  return html => new Jsdom(html);
})();

const open = (() => {
  const fetch = require('isomorphic-fetch');
  return uri => fetch(uri).then(r => r.status >= 400 ? thrw(r.status) : r.text());
})();

const exec = (() => {
  const childProcess = require('child_process');
  return pify(childProcess.exec.bind(childProcess));
})();

const decode = (() => {
  const { XmlEntities } = require('html-entities');
  return str => new XmlEntities().decode(str);
})();

const getRandList = list => list[Math.floor(Math.random() * list.length)];

const isDefined = val => val !== undefined && val !== null;

const TOKEN = null;
const token = process.env.BOT_TOKEN || TOKEN;


// weirdTag`1${ 2 }3` --> '123'
const weirdTag = (strings, ...values) =>
  strings.reduce((res, str, i) => res + values[i - 1] + str);

// unindent`
//  123
// ` ---> '\n123\n'
const unindent = (strings, ...values) =>
  weirdTag(strings, ...values).split(/\n/).map(s => s.trim()).join('\n');

// TODO: combo
const combo = (...variants) => {
  throw new Error('not implemented yet');
};

const getLandList = (list) => list[Math.floor(Math.random() * list.length)];

class UserError extends Error {
  constructor(message, origError) {
    super(message)

    this.name = 'UserError'
    this.uniqId =`${ + new Date() }.${ Math.floor(Math.random() * Math.pow(2, 16)) }`
    if (origError) this.orig = origError
  }
}

function join(...args) {
  return args
    .filter(p => p !== undefined && p !== null && (typeof p === 'string' ? p.length : true))
    .map(p => p instanceof Array ? join(...p) : p)
    .join('')
}

function getOkIcon() {
  return getLandList(['✅', '👌', '🆗', '🤖👍', '👏', '🤘', '💪', '😺', '👻', '🙏', '✨'])
}

const getIntro = (() => {
  const getIntro_ = debounce(() => {
    return getLandList(['ааааа', 'вигв+аме', 'кар+оч', 'сл+ушайте', 'эт с+амое']) + ', ... &&& ... — '
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
  util, read, write,
  exec,
  throttle,
  debounce,
  inflect,
  getLandList,
  fetch,
  open,
  parse,
  decode,
	config,
  consts,
  unindent,
  combo,
  UserError,
  join,
  getOkIcon,
  getIntro,
  openRpi3,
};
