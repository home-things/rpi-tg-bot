const { getRandList, debounce, exec } = require('../common');
const config = require('../../config');

const getIntro = (() => {
  const randList = getRandList(['ааааа', 'вигв+аме', 'кар+оч', 'сл+ушайте', 'эт с+амое']);
  const delay = config.commands.list.voice.list.say.intro_delay * 1000;
  const getIntro_ = debounce(() => `${ randList }, ... &&& ... — `, delay, true);
  return () => getIntro_() || '';
})();

const say = (text, ctx, isQuiet, noIntro) => {
  if (!text) {
    console.info('тут и говорить нечего');
    return undefined;
  }
  console.info('>>', text.trim().replace(/\n/g, ' '));
  return exec(`tts "${ noIntro ? '' : getIntro() }, ${ text.replace(/\n/g, ' ') }"`).then((stdout) => {
    console.info('say', stdout);
    if (!isQuiet) ctx.reply('я всё сказал');
  }).catch((e) => {
    console.error('say error', e);
    if (!isQuiet) ctx.reply('нишмаглаа /');
  });
};

module.exports = { say };
