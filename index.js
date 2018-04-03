#!/usr/bin/env node
// vim: set ts=4

const Telegraf = require('telegraf')
const { /* Extra, */ Markup } = require('telegraf')
const { spawn } = require('child_process')

const {
  token,
  exec,
  config,
  consts,
  UserError,
  getOkIcon,
  getIntro,
  openRpi3,
  setAsyncInterval,
} = require('./src/common')

const app = new Telegraf(token)
app.telegram.getMe().then((botInfo) => {
  app.options.username = botInfo.username
})
app.use(Telegraf.log())

const jobs = require('./src/jobs')

const joker = require('./src/joker')()

const {
  edit,
  del,
  typing,
  sendMsgDefaultChat,
  sendMsgStderrChat,
} = require('./src/tg-helpers')({ app, config })

const Commands = require('./src/commands')

const homeCmd = require('./commands/home')({ config })
const lightCmd = require('./commands/light')()
const musicCmd = require('./commands/music')()
const torrentsCmd = require('./commands/torrents')()
const volCmd = require('./commands/vol')()
const weatherCmd = require('./commands/weather')()
const fixerCmd = require('./commands/fixer')()

// eslint-disable-next-line
const cl = (...comments) => (fn) => (...args) => { const res = fn(...args); console.info(...comments, ': (', ...args, ') -->', res); return res; };

/**
 * speech & voice over
 */

// TODO: move to plugins
let isVoiceVerboseMode = false
// const _isIn1wordAnsExpecting = false
// const isIn1wordAnsExpecting = () => {
//   return _isIn1wordAnsExpecting ? (Date.now() - _isIn1wordAnsExpecting < 1000 * consts.ANS_EXP) : false
// }

//
// commands declaration
//
const commandsConfig = {
  last: Commands.lastCommand,
  list: {
    voice: {
      voice_over:      [null, () => { isVoiceVerboseMode = true }, 'I`ll say everything you post'],
      voice_over_stop: [null, () => { isVoiceVerboseMode = false }, 'I`ll be quiet'],
      say:             ['long_wait_msg', (ctx, [text]) => say(text, ctx)],
    },
    home:  { presense: ['long_wait_msg', async () => ({ resMsg: await homeCmd.format() })] },
    music: {
      stop:    [null, () => musicCmd.stop(), 'ok, music stopped'],
      pause:   [null, () => musicCmd.pause(), 'ok, music paused'],
      resume:  [null, () => musicCmd.resume(), 'ok, music resumed'],
      play:    ['ok, I`ll try', (_, [link]) => musicCmd.play(link)],
      podcast: () => ['long_wait_msg', spawn('music-podcast')],
    },
    vol: {
      louder:  [null, () => volCmd.delta(+10), 'ok, volume increased'],
      quieter: [null, () => volCmd.delta(-10), 'ok, volume decreased'],
      upTo:    [null, (_, [vol_]) => volCmd.upTo(vol_)],
      downTo:  [null, (_, [vol_]) => volCmd.downTo(vol_)],
      get:     async () => ({ resMsg: await volCmd.get() }),
    },
    light: {
      on:     () => lightCmd.on(),
      off:    () => lightCmd.off(),
      status: async () => ({ resMsg: await lightCmd.status() ? '🌖 on' : '🌘 off' }),
    },
    weather: { forecast: ['long_wait_msg', (ctx) => weatherForecast(ctx)] },
    misc:    { print: (_, [text]) => sendMsgDefaultChat(text) },
    jokes:   {
      joke:   async () => ({ resMsg: await joker.next() }),
      update: () => joker._loadNewPage(),
    },
    fixes: {
      airplay: () => fixerCmd.airplay(),
      rpi3:    () => fixerCmd.rpi3(),
    },
    torrents: {
      search: ['wait_msg', async (ctx, args) => {
        const res = await searchTorrent(ctx, args.join(' ').trim()) // responds with a buttons
        if (res === false) return { resMsg: 'Ничего не нашлось :(' }
      }],
      download: ['start downloading…', (_, [id]) => exec(`download-rutracker ${ id }`)],
      status:   ['long_wait_msg', ({ reply }) => torrentsStatus({ reply })],
    },
    fileReactions: {
      audio:   [null, (_, [link]) => playAudioLink(link), 'Музон в ваши уши'],
      voice:   (_, [link]) => exec(`wget -O /tmp/tg-bot-voice.oga "${ link }"`) /* exec(`asr /tmp/tg-bot-voice.oga`) */,
      link:    [null, (_, [sudo, link]) => openLinkRpi3(link, { sudo }), 'Ссылка открыта на станции'],
      picture: [null, (_, [name, link]) => openPictureRpi3(link, name), 'Картинка открыта на станции'],
      torrent: [null, ({ reply }, [link]) => openTorrentRpi3({ link, reply }), 'Поставлено на закачку'],
    },
    delivery: {
      water: () => exec('send-tg-msg @makemetired "воды б"'),
    },
    search: {
      google: [null, (_, [query]) => google(query), 'Загуглено на станции'],
    },
  },
}

const commands = Commands({
  list: commandsConfig.list,
  getOkIcon,
  UserError,
  consts,
  homeCmd,
  del,
  typing,
  sendMsgDefaultChat,
  sendMsgStderrChat,
})

//
// listeners
//
// TODO: use intent system api.io etc
// TODO: use word2vel
// TODO: use phrase examples instead of RegExps
//

/* eslint-disable max-len */

/*
 voice
*/

app.hears(/^(?:(?:читай|зачитывай)\s+((входящие\s+)?сообшения|ч[ая]т)|read\s+(?:chat|messages))/i, (ctx) => {
  commands.run('voice', 'voice_over', ctx)
})
app.hears(/^(?:не\s+(читай|зачитывай)\s+((входящие\s+)?сообшения|ч[ая]т)|перестань\s+читать\s+ч[ая]т|no\s+read\s+(chat|messages))/i, (ctx) => {
  commands.run('voice', 'voice_over_stop', ctx)
})
app.hears(/^(?:(?:say|скажи)\s+((?:.|\n)+))/im, (ctx) => {
  commands.run('voice', 'say', ctx)
})


/*
 home
*/

app.hears(/^(?:who\s+(?:is\s+)?at\+home\??|(?:есть\s)?(?:все|кто)\s+(?:ли\s+)?(?:дома|здесь)\??)/i, (ctx) => {
  commands.run('home', 'presense', ctx)
})


/*
 light
*/

app.hears(/^(?:turn\s+light\s+on|включи\s+свет)/i, (ctx) => {
  commands.run('light', 'on', ctx)
})
app.hears(/^(?:turn\s+light\s+off|выключи\s+свет)/i, (ctx) => {
  commands.run('light', 'off', ctx)
})
app.hears(/^(?:is\s+light\s+on|light\s+status|включен(\s+ли)?\s+свет|свет\s+включен\??)/i, (ctx) => {
  commands.run('light', 'status', ctx)
})

/*
 music
*/

app.hears(/^(?:(?:(?:сы|и)грай|воспроизведи|play))?(megapolis|music\s+podcast)/i, (ctx) => {
  commands.run('music', 'podcast', ctx)
})

app.hears(/^(?:(выключи|останови|выруби|убери)\s+(?:музыку|звук|воспроизведение)|не\s+играй|stop\s+playing|stop\s+music)/i, (ctx) => {
  commands.run('music', 'stop', ctx)
})
app.hears(/^(?:поставь\s+на\s+паузу|пауза$|pause(,\s+please!?)?)/i, (ctx) => {
  commands.run('music', 'pause', ctx)
})
app.hears(/^(?:продолж(и|ай)\s+(воспроизведение|играть)|resume\s+playing)/i, (ctx) => {
  commands.run('music', 'resume', ctx)
})
app.hears(/^(?:(?:(?:сы|и)грай|воспроизведи|play)\s+(\w+))/i, (ctx) => {
  commands.run('music', 'play', ctx)
})

app.hears(/^\.\.$/, (ctx) => {
  commands.run('music', 'stop', ctx)
})
app.hears(/^\|\|$/i, (ctx) => {
  commands.run('music', 'pause', ctx)
})
app.hears(/^>>$/i, (ctx) => {
  commands.run('music', 'resume', ctx)
})
app.hears(/^>>\s+(\w+)/i, (ctx) => {
  commands.run('music', 'play', ctx)
})


/*
 vol
*/

app.hears(/^(?:(?:сделай\s+)?(?:по)?громче|make(?:\s+(?:sound|music))?\s+louder)\s+(?:до|up\s*to)\s+(\d+)/i, (ctx) => {
  commands.run('vol', 'upTo', ctx)
})
app.hears(/^(?:(?:сделай\s+)?(?:по)?тише|make(?:\s+(?:sound|music))?\s+quieter)\s+(?:до|down\s*to)\s+(\d+)/i, (ctx) => {
  commands.run('vol', 'downTo', ctx)
})
app.hears(/^(?:(?:сделай\s+)?(?:по)?тише|make(?:\s+(?:sound|music))?\s+quieter)/i, (ctx) => {
  commands.run('vol', 'quieter', ctx)
})
app.hears(/^(?:(?:сделай\s+)?(?:по)?громче|make(?:\s+(?:sound|music))?\s+louder)/i, (ctx) => {
  commands.run('vol', 'louder', ctx)
})
app.hears(/^--$/, (ctx) => {
  commands.run('vol', 'quieter', ctx)
})
app.hears(/^\+\+$/, (ctx) => {
  commands.run('vol', 'louder', ctx)
})

/*
 misc
*/

app.hears(/\b(wi-fi|wifi|lan|router|роутер)\b/i, (ctx) => {
  ctx.reply('Нате вам: https://docs.google.com/document/d/1eXEPilIdV6Bxgbqi3l__uC04goAzYPhfVD-rz1Ixrv4/edit#')
})

app.hears(/^(?:(?:какая\s+)?погода|чт?о\s+(там\s+)?с\s+погодой\??|чт?о\s+обещают\??|чт?о\s+с\s+погодой\??|(?:(?:(?:say|get|read)\s+)?(?:a\s+)?weather)|с погодой чт?о)/i, (ctx) => {
  commands.run('weather', 'forecast', ctx)
})

app.hears(/^(?:text|print|напиши|наречатай)\s+((?:.|\n)+)$/im, (ctx) => {
  commands.run('misc', 'print', ctx)
})

app.hears(/^(?:(?:(?:get|tell|next)\s+)?joke|(?:(?:(?:расскажи|давай)\s+)?(?:шутку|анекдот)|пошути|шуткуй))/i, (ctx) => {
  commands.run('jokes', 'joke', ctx)
})

app.hears(/fix\s+airplay/i, (ctx) => {
  commands.run('fixes', 'airplay', ctx)
})

app.hears(/fix\s+rpi3/i, (ctx) => {
  commands.run('fixes', 'rpi3', ctx)
})

app.hears(/(?:(?:find|search|look up) (?:torrent|rutracker|serial|film)|(?:поищи|ищи|найди|искать|ищи) (?:торрент|на рутрекере|на rutracker|фильм|сериал))(.+)/i, (ctx) => {
  commands.run('torrents', 'search', ctx)
})

app.hears(/(?:(?:status |get |check )?(?:torrent|rutracker|serial|film)s?|(?:проверь|чт?о (там )?с|как там|статус) (?:торрент(ы|ами)?|рутрекер(ом|а)?|на rutracker|фильм(ы|ами)?|сериал(ы|ами)?|закачк(а|и|ами)))|скачалось\?|торренты/i, (ctx) => {
  commands.run('torrents', 'status', ctx)
})

app.hears(/([^ ]+\.torrent)/, (ctx) => {
  commands.run('fileReactions', 'torrent', ctx)
})

app.hears(/([^ ]+\.(?:jpg|png))/, (ctx) => {
  commands.run('fileReactions', 'picture', ctx, `from-chat-link${ new Date().getTime() }`)
})

app.hears(/([^ ]+\.mp3)/, (ctx) => {
  commands.run('fileReactions', 'audio', ctx)
})

// todo: link detect
app.hears(/((?:sudo,?\s*)?)((?:https?:\S+)|(?:\S*(?:\.com\/|youtu\.be\/|\.ru\/)\S+))/, (ctx) => {
  commands.run('fileReactions', 'link', ctx)
})

app.hears(/^(?:google|yandex|search|загугли|найди)\s+(.+)/i, (ctx) => {
  commands.run('search', 'google', ctx)
})


app.on('audio', async (ctx) => {
  const link = await app.telegram.getFileLink(ctx.message.audio.file_id)

  commands.run('fileReactions', 'audio', ctx, link)
})
/* eslint-enable max-len */


// torrent
app.on('document', async (ctx) => {
  if (!ctx.message.document || !ctx.message.document.file_name.endsWith('.torrent')) return
  const torrentLink = await app.telegram.getFileLink(ctx.message.document.file_id)

  commands.run('fileReactions', 'torrent', ctx, torrentLink)
})

app.on('photo', async (ctx) => {
  const data = ctx.message.photo && ctx.message.photo[ctx.message.photo.length - 1]
  if (!data) return
  const imageLink = await app.telegram.getFileLink(data.file_id)

  commands.run('fileReactions', 'picture', ctx, [data.file_id, imageLink])
})

app.on('voice', async (ctx) => {
  if (!ctx.message.voice) return
  const voiceLink = await app.telegram.getFileLink(ctx.message.voice.file_id)

  commands.run('fileReactions', 'voice', ctx, voiceLink)
})


/*
 /commands
*/

const withArgs = fn => ctx => {
  const args = ctx.update.message.text.split(/\s+/).slice(1).join(' ')
  fn(ctx, args)
}
const call = withArgs

// app.on('inline_query', (props) => {
//  const { inlineQuery } = props
//  console.log('aa?', props)
//  //props.replyWithMarkdown('Hey there!')
//  //answerInputTextMessageContent([{message_text:'Hey there!'}])
// })

// app.command('start', (props) => {
//   const { from, reply } = props
//   console.log('start', from, props)
//   return reply('Welcome!')
// })

// voice over
app.command('voice_over', call((ctx, [cmd]) => {
  if (['off', 'stop'].includes(cmd)) commands.run('voice', 'voice_over_stop', ctx)
  commands.run('voice', 'voice_over', ctx)
}))
app.command('voice_over_stop', call((ctx) => {
  commands.run('voice', 'voice_over_stop', ctx)
}))

// voice
app.command('say', call((ctx, args) => commands.run('voice', 'say', ctx, args)))
// volume
app.command('vol', call((ctx, [cmd]) => commands.run('vol', cmd, ctx)))
app.command('louder', call((ctx) => commands.run('vol', 'louder', ctx)))
app.command('quieter', call((ctx) => commands.run('vol', 'quieter', ctx)))
// music
app.command('music', call((ctx, [cmd]) => commands.run('music', cmd, ctx)))
app.command('pause', call((ctx) => commands.run('music', 'pause', ctx)))
app.command('resume', call((ctx) => commands.run('music', 'resume', ctx)))
app.command('stop', call((ctx) => commands.run('music', 'stop', ctx)))
// home
app.command('home', call((ctx) => commands.run('home', 'presense', ctx)))
// light
app.command('light', call((ctx, args) => commands.run('light', args, ctx)))
// weather
app.command('weath', call((ctx) => commands.run('weather', 'forecast', ctx)))
// joker
app.command('joke', call((ctx) => commands.run('jokes', 'joke', ctx)))

/*
 universal
*/

//
// todo: repeat last command
//
// const lastQuestion = {
//   _question: null,
//   set: function (command) {
//     this._question = (isYes) => isYes && command.repeat();
//   },
//   answer: function (isYes) {
//     if (!this._question) { console.error('hm, there is not question'); return; }
//     _isIn1wordAnsExpecting = false;
//     this._question(isYes);
//   }
// };
//
// app.hears(/^(?:повтори|((и|повтори)\s+)?ещё(\s+раз)?|(one\s+more\s+time|more|repeat)(,\s+please)?)$/i, (ctx) => {
//   if (!commands.last.has()) return;
//   switch (commands.last.type) {
//     // change the entity
//     case ('put'):
//       break;
//     // get the/an entity (see cacheControl)
//     case ('get'):
//       if (commands.last.cacheControl === 'no-cache') {
//         commands.last.repeat()
//       } else {
//         ctx.reply('no changes');
//       }
//       break;
//     // create the entity
//     case ('post'):
//       ctx.reply('are you sure, you want to repeat?')
//       lastQuestion.set(commands.last);
//       break;
//     // delete the/an entity (see cacheControl)
//     case ('delete'):
//       if (commands.last.cacheControl === 'no-cache') {
//         ctx.reply('are you sure, you want to repeat?')
//         lastQuestion.set(commands.last);
//       } else {
//         ctx.reply('already deleted');
//       }
//       break;
//     default: ctx.reply('I`m not sure about last command'); break;
//   }
// });

// app.hears(/^(?:yep|yes|да|Y)/i, (ctx) => {
//   if (isIn1wordAnsExpecting()) {
//     _isIn1wordAnsExpecting = false;
//     lastQuestion.answer(true);
//   }
// });
// app.hears(/^(?:no|nope|N|нет|не-а)/i, (ctx) => {
//   if (isIn1wordAnsExpecting()) {
//     lastQuestion.answer(false);
//   }
// });

app.hears(/^(hi|hey|ping)$/i, ({ reply }) => reply('Hey there!'))

app.hears(/./, (ctx) => {
  if (!isVoiceVerboseMode) return
  const name = ctx.update.message.from.first_name
  say(`говорит ${ homeCmd.get(name, 'name') || name }: ${ ctx.match.input }`, ctx, true)
})

app.action(/.+/, (ctx) => {
  const match = ctx.match && ctx.match[0].match(/^torrent download (\d+)/)
  if (match) {
    commands.run('torrents', 'download', ctx, [match[1]])
  }
  return ctx.answerCallbackQuery(`Oh, ${ ctx.match[0] }! Great choise`)
})

//
// helpers
//

async function notifyWhenTorrentWillBeDone ({ reply }) {
  await torrentsCmd.awaitDownloaded()
  reply('✨ Трррррнты скчччлись, мои маленькие пираты!\nСвистать всех наверх!')
}

async function searchTorrent (ctx, query) {
  const list = await torrentsCmd.search(query)
  if (!list || !list.length) return false
  list.forEach(torrent => {
    ctx.replyWithHTML(
      torrentsCmd.printable(torrent),
      Markup.inlineKeyboard([Markup.callbackButton('Download', `torrent download ${ torrent.id }`)]).extra(),
    )
  })
}

async function weatherForecast (ctx) {
  const formattedWeather = await weatherCmd.forecast()
  if ((new Date()).getHours() >= 9) say(formattedWeather, ctx, true, true)
  return { resMsg: formattedWeather }
}

// TODO: move to commands
async function say (text, ctx, isQuiet, noIntro) {
  if (!text) { console.info('тут и говорить нечего'); return }
  console.info('>>', text.trim().replace(/\n/g, ' '))
  const stdout = await exec(`tts "${ noIntro ? '' : getIntro() }, ${ text.replace(/\n/g, ' ') }"`)
  console.info('say stdout', stdout)
  if (!isQuiet) ctx.reply('я всё сказал')
}


/**
 * file handlers
 * TODO: move to commands
 */

async function openTorrentRpi3 ({ link, reply }) {
  const tmpFile = '/tmp/tg-bot.torrent'

  await exec(`wget -O ${ tmpFile } "${ link }"`)
  await exec(`scp ${ tmpFile } pi@rpi3:~/Downloads`)

  torrentsStatus({ reply })

  // Notify when torrent downloaded
  setTimeout(async () => await notifyWhenTorrentWillBeDone({ reply }), 3000)
}

async function torrentsStatus ({ reply }) {
  // Send torrents progress status
  setTimeout(async () => {
    const repCtx = await reply(await torrentsCmd.status())
    sendMsgStderrChat('torrentsStatus got repCtx')

    // update torrents progress status message every 5 second
    const editNotify = async () => await edit(repCtx, await torrentsCmd.status())
    const cycle = setAsyncInterval(editNotify, 1000 * 60)
    setTimeout(() => cycle.stop(), 1000 * 60 * 60 * 1)
  }, 3000)
}

async function openPictureRpi3 (link, name, { sudo = false } = {}) {
  if (!sudo && isNight()) throw new UserError('night. Try with sudo, bro')

  const tmpFileName = `tg-bot.${ name }.jpg`
  const tmpFilePath = `/tmp/${ tmpFileName }`
  const targetFilePath = `~/Downloads/${ tmpFileName }`

  await exec(`wget "${ link }" -O "${ tmpFilePath }"`)
  await exec(`scp "${ tmpFilePath }" "pi@rpi3:${ targetFilePath }"`)
  openRpi3(`gpicview ${ targetFilePath }`, { isX11: true, isResident: true })
}

function openLinkRpi3 (link, { sudo = false } = {}) {
  if (!sudo && isNight()) throw new UserError('night. Try with sudo, bro')

  if (link.includes('youtube') || link.includes('youtu.be')) {
    console.info('youtube link', link)
    return openYoutubeLinkRpi3(link, { sudo })
  }

  return openRpi3(`chromium-browser "${ link }"`, { isX11: true, isResident: true })
}

// function openVideoLinkRpi3 (link) {
//   // body...
// }

async function openYoutubeLinkRpi3 (link, { sudo = false } = {}) {
  const normalizedLink = /^http/.test(link) ? `https://${ link }` : link
  const open = () => openRpi3(`~/bin/kodi-cli -s; ~/bin/kodi-cli -y "${ normalizedLink }"`)

  if (!sudo && isNight()) throw new UserError('night. Try with sudo, bro')

  try {
    await openRpi3('[[ "$(ps aux | grep kodi | grep -v grep)" ]] || (echo "no kodi"; exit 1)')
    return await open()
  } catch (e) { // in case kodi does not running
    console.error(e)
    await openRpi3('kodi', { isX11: true, isResident: true })
    return new Promise(async (res) => {
      setTimeout(async () => {
        await open()
        res()
      }, 15000)
    })
  }
}

async function playAudioLink (link) {
  const ext = link.match(/\w+$/)[0]
  const filePath = `/tmp/tg-bot-audio.${ ext }`

  await exec(`wget -O ${ filePath } "${ link }"`)
  await musicCmd.play(filePath)
}

async function google (query, { sudo = false } = {}) {
  return await openLinkRpi3(`https://ya.ru/?q=${ encodeURIComponent(query) }`, { sudo })
}

function isNight () {
  const h = (new Date()).getHours()

  return h > 23 || h < 8
}

/**
 * misc
 */

// move to common.js

//
// run
//

app.startPolling()

jobs({ commands })
