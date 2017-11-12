#!/usr/bin/env node
// vim: set ts=4

const path = require('path')

const {
  Telegraf,
  Extra, Markup,
  token,
  fs,
  read,
  write,
  exec,
  getLightStatus,
  throttle,
  debounce,
  inflect,
  randList,
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
} = require('./src/common')

require('dotenv').config() // load BOT_TOKE from .env file

const app = new Telegraf(token)
app.telegram.getMe().then((botInfo) => {
  app.options.username = botInfo.username
})
app.use(Telegraf.log())

const jobs = require('./src/jobs')

const joker = require('./src/joker')()

const { edit, del, typing, sendMsgDefaultChat, sendMsgStderrChat } = require('./src/tg-helpers')({ app, config })

const Commands = require('./src/commands')

const homemates = require('./plugins/home')({ config })

//
// commands declaration
//

const commands = {
  run: (...args) => _commands.run(...args),
  runSys: (...args) => _commands.runSys(...args),
  last: Commands.lastCommand,
  list: {
    voice: {
      voice_over: [null, ctx => { isVoiceVerboseMode = true }, 'I`ll say everything you post'],
      voice_over_stop: [null, ctx => { isVoiceVerboseMode = false }, 'I`ll be quiet'],
      say: ['long_wait_msg', (ctx, args) => say(args[0], ctx)],
    },
    home: {
      presense: ['long_wait_msg', async (ctx) => {
        const status = await whoAtHome()

        const name = (key) => homemates.get(key, 'name')
        const here = (key) => randList(['дома ', 'тута', 'где-то здесь'])
        const outside = (key) => randList(['не дома', 'отсутствует', 'шляется'])
        const outside_ = (key) => key === 'lenya' ? randList(['— по бабам', '— опять по бабам']) : outside(key)
        const hereStatus = (key) => `✅ ${ name(key) } ${ here(key) }`
        const outsideStatus = (key) => `🔴 ${ name(key) } ${ outside_(key) }`
        const getStatus = (key) => status[key] ? hereStatus(key) : outsideStatus(key)
        const formattedStatus = Object.keys(homemates.list).map((key) => getStatus(key)).join('\n')

        return { resMsg: formattedStatus }
      }],
    },
    music: {
      action: ['wait_msg', async ({ reply }, args) => {
        const hasMusic = await exec('has-music')
        if (!hasMusic) throw new UserError('No music detected. You can ask /quieter')
        await exec(`${ args[0] }-music`)
        return { okMsg: `ok, music ${args[0]}ed` }
      }],
      play: ['ok, I`ll try', async (ctx, args) => {
        await exec(`pause-music || :`)
        await exec(`mplayer "${ args[1].trim() }"`)
        await exec(`resume-music || :`)
      }],
    },
    vol: {
      action: ['wait_msg', async ({ reply }, args) => {
        const up = ['louder', 'up', '+', 'increase']
        const dx = up.includes(args[0].trim()) ? +1 : -1
        const K = 10
        const vol = await exec('get-vol')

        await exec(`vol ${+vol + K * dx} ${args[0]}`)

        return { okMsg: `ok, vol ${dx > 0 ? 'increased' : 'decreased'}` }
      }],
    },
    light: {
      on: () => exec('light on'),
      off: () => exec('light off'),
      status: async () => {
        const status = await getLightStatus()
        return { okMsg: `ok: ${ status ? '🌖 on' : '🌘 off' }` }
      },
    },
    weather: {
      forecast: ['long_wait_msg', async (ctx) => {
        const weather = await exec(`get-weather`).then(res => JSON.parse(res))

        const temp = Math.floor(weather.temp)
        const units = inflect(temp, { one: 'градус', some: 'градуса', many: 'градусов' })
        const formattedWeather = weather.description && weather.temp && `Погода в ближайшее время: ${weather.description}, ${temp} ${units}`
        if (!formattedWeather) throw new Error('no_data')

        // weather.icon && app.telegram.sendPhoto(ctx.chat.id, `http://openweathermap.org/img/w/${ weather.icon }.png`, {disable_notification: true})
        // const url = `http://tg-bot-web.invntrm.ru/weathericons/${ weather.icon }.svg`
        // weather.icon && app.telegram.sendPhoto(ctx.chat.id, url, {disable_notification: true})

        if ((new Date()).getHours() >= 9) say(formattedWeather, ctx, true, true)

        return { resMsg: formattedWeather }
      }],
    },
    misc: {
      print: (ctx, args) => {
        return sendMsgDefaultChat(args[0])
      },
    },
    jokes: {
      joke: ['wait_msg', async (ctx) => {
        return ctx.reply(await joker.next())
      }],
      update: (ctx) => {
				return joker._loadNewPage()
      },
    },
    fixes: {
      airplay: (ctx) => {
        return exec('sudo systemctl restart shairport-sync')
      },
    },
		torrents: {
			search: ['wait_msg', async (ctx, args) => {
				const query = args.join(' ').trim()
				const res = JSON.parse(await exec(`search-rutracker ${ query }`))
				if (!res || !res.length) return ctx.reply('nothing')

		    // 🌐 ${ res.url.replace(/^https?:\/\//, '') }
				res.forEach(res => {
					ctx.replyWithHTML(unindent`
            📕 ${ res.category }.
            <b>${ res.size_h }</b>. seeds: <b>${ res.seeds }</b> / leechs: ${ res.leechs }
            ${ res.title } <b> # ${ res.id }</b>
					`, Markup.inlineKeyboard([Markup.callbackButton('Download', `torrent download ${ res.id }`)]).extra())
				})
      }],
      download: ['start downloading…', ({ reply }, args) => {
        return exec(`download-rutracker ${ args[0] }`)
      }],
      status: async ({ reply }) => {
        const info = await openRpi3('deluge-console info -s Downloading --sort=time_added')
				const info_ = info.replace(/^(ID|State|Seeds|Seed time|Tracker status|Size):.+\n/gm, "").trim()
        info_ && reply(info_)

				return { resMsg: info_ ? 'Остальное скачалось' : 'Всё скачалось, господа' }
      }
		},
    fileReactions: {
      audio:   [null, (_, [link]) => playAudioLink(link), 'Музон в ваши уши'],
      voice:          (_, [link]) => exec(`wget -O /tmp/tg-bot-voice.oga "${ link }"`) /*exec(`asr /tmp/tg-bot-voice.oga`)*/,
      link:    [null, (_, [link]) => openLinkRpi3(link), 'Ссылка открыта на станции'],
      picture: [null, (_, [name, link]) => openPictureRpi3(link, name), 'Картинка открыта на станции'],
      torrent: [null, (_, [link]) => openTorrentRpi3(link), 'Поставлено на закачку'],
    }
  },
}

const _commands = Commands({
  list: commands.list,
  getOkIcon,
  UserError,
  consts,
  homemates,
  del, typing, sendMsgDefaultChat, sendMsgStderrChat,
})

//
// listeners
//

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

app.hears(/^(?:who\s+(is\s+)?at\+home\??|(есть\s)?(все|кто)\s+(ли\s+)?(дома|здесь)\??)/i, (ctx) => {
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

app.hears(/^(?:(выключи|останови|выруби|убери)\s+(?:музыку|звук|воспроизведение)|не\s+играй|stop\s+playing|stop\s+music)/i, (ctx) => {
  commands.run('music', 'action', ctx, 'stop')
})
app.hears(/^(?:поставь\s+на\s+паузу|пауза$|pause(,\s+please!?)?)/i, (ctx) => {
  commands.run('music', 'action', ctx, 'pause')
})
app.hears(/^(?:продолж(и|ай)\s+(воспроизведение|играть)|resume\s+playing)/i, (ctx) => {
  commands.run('music', 'action', ctx, 'resume')
})
app.hears(/^(?:(?:(?:сы|и)грай|воспроизведи|play)\s+((?:.|\n)+))/i, (ctx) => {
  commands.run('music', 'play', ctx)
})


/*
 vol
*/

app.hears(/^(?:(сделай\s+)?(по)?тише|make(\s+(sound|music))?\s+quieter)/i, (ctx) => {
  commands.run('vol', 'action', ctx, 'quieter')
})
app.hears(/^(?:(сделай\s+)?(по)?громче|make(\s+(sound|music))?\s+louder)/i, (ctx) => {
  commands.run('vol', 'action', ctx, 'louder')
})

/*
 misc
*/

app.hears(/^(?:(?:какая\s+)?погода|что\s+(там\s+)?с\s+погодой\??|что\s+обещают\??|что\s+с\s+погодой\??|(?:(?:(?:say|get|read)\s+)?(?:a\s+)?weather))/i, (ctx) => {
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

app.hears(/(?:(?:find|search|look up) (?:torrent|rutracker|serial|film)|(?:поищи|ищи|найди|искать|ищи) (?:торрент|на рутрекере|на rutracker|фильм|сериал))(.+)/i, (ctx) => {
	commands.run('torrents', 'search', ctx)
})

app.hears(/(?:(?:status|get|check) (?:torrent|rutracker|serial|film)s?|(?:проверь|что там с|как там|статус) (?:торрент(ы|ами)?|рутрекер(ом|а)?|на rutracker|фильм(ы|ами)?|сериал(ы|ами)?|закачк(а|и|ами)))(.+)/i, (ctx) => {
	commands.run('torrents', 'status', ctx)
})

app.hears(/([^ ]+\.torrent)/, (ctx) => {
  commands.run('fileReactions', 'torrent', ctx)
})

app.hears(/([^ ]+\.(jpg|png))/, (ctx) => {
  commands.run('fileReactions', 'picture', ctx, 'from-chat-link' + new Date().getTime())
})

app.hears(/([^ ]+\.mp3)/, (ctx) => {
  commands.run('fileReactions', 'audio', ctx)
})

app.hears(/(https?:[^ ]+)/, (ctx) => {
  commands.run('fileReactions', 'link', ctx)
})

app.on('audio', async (ctx) => {
	const link = await app.telegram.getFileLink(ctx.message.audio.file_id)

  commands.run('fileReactions', 'audio', ctx, link)
})

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

const cmd = fn => ctx => {
  const args = ctx.update.message.text.split(/\s+/).slice(1).join(' ')
  fn(ctx, args)
}

//app.on('inline_query', (props) => {
//  const { inlineQuery } = props
//  console.log('aa?', props)
//  //props.replyWithMarkdown('Hey there!')
//  //answerInputTextMessageContent([{message_text:'Hey there!'}])
//})

app.command('start', (props) => {
  const { from, reply } = props
  console.log('start', from, props)
  return reply('Welcome!')
})

app.command('voice_over', cmd((ctx, args) => {
  if (['off', 'stop'].includes(args[0])) commands.run('voice', 'voice_over_stop', ctx)
  commands.run('voice', 'voice_over', ctx)
}))

app.command('voice_over_stop', cmd((ctx, args) => {
  commands.run('voice', 'voice_over_stop', ctx)
}))

app.command('say', cmd((ctx, args) => commands.run('voice', 'say', ctx, args)))

app.command('vol', cmd((ctx, args) => commands.run('vol', 'action', ctx, args)))
app.command('louder', cmd((ctx, args) => commands.run('vol', 'action', ctx, 'louder')))
app.command('quieter', cmd((ctx, args) => commands.run('vol', 'action', ctx, 'quieter')))

app.command('music', cmd((ctx, args) => commands.run('music', 'action', ctx, args)))
app.command('pause', cmd((ctx, args) => commands.run('music', 'action', ctx, 'pause')))
app.command('resume', cmd((ctx, args) => commands.run('music', 'action', ctx, 'resume')))
app.command('stop', cmd((ctx, args) => commands.run('music', 'action', ctx, 'stop')))

app.command('home', cmd((ctx, args) => commands.run('home', 'presense', ctx)))

app.command('light', cmd((ctx, args) => commands.run('light', args, ctx)))

app.command('weath', cmd((ctx, args) => commands.run('weather', 'forecast', ctx)))

app.command('joke', cmd((ctx, args) => commands.run('jokes', 'joke', ctx)))

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
  say(`говорит ${ homemates.get(name, 'name') || name }: ${ ctx.match.input }`, ctx, true)
})

app.action(/.+/, (ctx) => {
	let m
	if (m = ctx.match && ctx.match[0].match(/^torrent download (\d+)/)) {
    commands.run('torrents', 'download', ctx, [m[1]])
	}
  return ctx.answerCallbackQuery(`Oh, ${ctx.match[0]}! Great choise`)
})

//
// helpers
//


/**
 * home
 */

function whoAtHomeRequest () {
  return exec('who-at-home2')
    .then((stdout) => {
      const j = JSON.parse(stdout)
      console.log('whoAtHome info', stdout, j)
      return j
    })
}

function whoAtHome () {
  return whoAtHomeRequest()
    .catch((e) => {
      console.error('whoAtHome error', e)
      return whoAtHomeRequest() // try again once
    })
}


/**
 * speech & voice over
 */

let isVoiceVerboseMode = false
let _isIn1wordAnsExpecting = false
const isIn1wordAnsExpecting = () => {
  return _isIn1wordAnsExpecting ? (Date.now() - _isIn1wordAnsExpecting < 1000 * consts.ANS_EXP) : false
}

async function say (text, ctx, isQuiet, noIntro) {
  if (!text) { console.log('тут и говорить нечего'); return; }
  console.log(">>", text.trim().replace(/\n/g, ' '))
  const stdout = await exec(`tts "${noIntro ? '' : getIntro()}, ${text.replace(/\n/g, ' ')}"`)
  console.log('say', stdout)
  isQuiet || ctx.reply('я всё сказал')
}


/**
 * file handlers
 */

async function openTorrentRpi3(link) {
    const tmpFile = '/tmp/tg-bot.torrent'

    await exec(`wget -O ${ tmpFile } "${ link }"`)
    await exec(`scp ${ tmpFile } pi@rpi3:~/Downloads`)
}

async function openPictureRpi3(link, name) {
    const tmpFileName = `tg-bot.${ name }.jpg`;
    const tmpFilePath = `/tmp/${ tmpFileName }`;
    const targetFilePath = `~/Downloads/${ tmpFileName }`;

    await exec(`wget -O "${ tmpFilePath }" "${ link }"`);
    await exec(`scp "${ tmpFilePath }" "pi@rpi3:${ targetFilePath }"`)
    openRpi3(`gpicview "${ targetFilePath }" &`, 'x11') // Cannot avoid window closing waiting
}

function openLinkRpi3(link) {
  return openRpi3(`chromium-browser "${ link }"`, 'x11')
}

async function playAudioLink(link) {
  const ext = link.match(/\w+$/)[0]
  const name = `/tmp/tg-bot-audio.${ ext }`

  await exec(`wget -O ${ name } "${ link }"`)
  await exec('pause-music || :')
  await exec(`mplayer "${ name }"`)
  await exec('resume-music || :')
}


/**
 * misc
 */

// move to common.js

//
// run
//

app.startPolling()

//jobs()

const DAY = 1000 * 60 * 60 * 24

setInterval(() => commands.runSys('jokes', 'joke'), DAY)

