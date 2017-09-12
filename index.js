// vim: set ts=4

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
} = require('./src/common');

require('dotenv').config(); // load BOT_TOKE from .env file

const edit = (repCtx, txt) => app.telegram.editMessageText(repCtx.chat.id, repCtx.message_id, null, txt);
const del = (repCtx) => app.telegram.deleteMessage(repCtx.chat.id, repCtx.message_id);
const typing = (ctx) => app.telegram.sendChatAction(ctx.chat.id, 'typing').catch(e => console.error('e', e));

const jobs = require('./src/jobs');

let jokes = fs.existsSync('./jokes.json') ? require('./jokes.json') : { i: -1, page: -1, list: [] };

const app = new Telegraf(token);

app.telegram.getMe().then((botInfo) => {
  app.options.username = botInfo.username
});

app.use(Telegraf.log());

let homemates = {
  list: config.commands.list.home.data.homemates.list,
  get: function (key, field) { return this.list[key.toLowerCase()] && this.list[key.toLowerCase()][field]; },
  set: function (key, field, val) { this.list[key][field] = val; return val; },
  setAll: function (field, object) { Object.keys(this.list).forEach((key) => { this.set(key, field, object[key]); }); },
  empty: function () { return Object.keys(this.list).every(key => !this.get(key, 'presense')); },
  full: function () { return Object.keys(this.list).every(key => this.get(key, 'presense')); },
  isMember: function (id) { return Object.keys(this.list).some(key => this.get(key, 'id') === id); },
}

const onChange = (type, signal, data) => {
  switch (type) {
    case ('home'):
      switch (signal) {
        case ('presense'):
          if (data.sasha && data.sasha.before) getLightStatus().then(v => { if (v.trim()) throw 'y' }).then(() => exec('light on')).then(() => {
            app.telegram.sendMessage(homemates.get('sasha', 'id'), 'Sasha came back ==> Light turned on');
          }).catch(() => { });
          if (data.sasha && !data.sasha.before) getLightStatus().then(v => { if (!v.trim()) throw 'n' }).then(() => exec('light off')).then(() => {
            app.telegram.sendMessage(homemates.get('sasha', 'id'), 'Sasha left ==> Light turned off');
          }).catch(() => { });
          if (homemates.empty()) exec('has-music').then(v => { if (!v.trim()) throw 'none' }).then(() => exec('stop-music')).then(() => {
            app.telegram.sendMessage(consts.VIGVAM_ID, 'Nobody at home ==> Music stopped');
          }).catch(() => { });
          if (homemates.full()) app.telegram.sendMessage(consts.VIGVAM_ID, randList(['С возвращением!', 'all in the home.']) + '\n\n 😇 p.s. I don`t notify more often than every 30 minutes');
          break;
      }
      break;
  }
};

const getIntro_ = debounce(() => {
  return randList(['ааааа', 'вигв+аме', 'кар+оч', 'сл+ушайте', 'эт с+амое']) + ', ... &&& ... — ';
}, config.commands.list.voice.list.say.intro_delay * 1000, true);
const getIntro = () => getIntro_() || '';

const say = (text, ctx, isQuiet, noIntro) => {
  if (!text) { console.log('тут и говорить нечего'); return; }
  console.log(">>", text.trim().replace(/\n/g, ' '))
  return exec(`tts "${noIntro ? '' : getIntro()}, ${text.replace(/\n/g, ' ')}"`).then((stdout) => {
    console.log('say', stdout);
    isQuiet || ctx.reply('я всё сказал');
  }).catch(e => {
    console.error('say error', e);
    isQuiet || ctx.reply('нишмаглаа /');
  });
};

const whoAtHomeRequest = () => {
  return exec('who-at-home2')
    .then((stdout) => {
      const j = JSON.parse(stdout)
      console.log('whoAtHome info', stdout, j)
      return j;
    });
};

const whoAtHome = () => {
  return whoAtHomeRequest()
    .catch((e) => {
      console.error('whoAtHome error', e);
      return whoAtHomeRequest(); // try again once
    });
};

let isVoiceVerboseMode = false;
let _isIn1wordAnsExpecting = false;
const isIn1wordAnsExpecting = () => {
  return _isIn1wordAnsExpecting ? (Date.now() - _isIn1wordAnsExpecting < 1000 * consts.ANS_EXP) : false;
};

const lastCommand = {
  _command: null,
  type: null,
  set: function (type, command) {
    this.type = type;
    this._command = command;
  },
  has: function () {
    return this._command;
  },
  repeat: function () {
    if (!this.has()) { console.error('hm, there is not command'); return; }
    this._command(...this._args)
  },
};

const lastQuestion = {
  _question: null,
  set: function (command) {
    this._question = (isYes) => isYes && command.repeat();
  },
  answer: function (isYes) {
    if (!this._question) { console.error('hm, there is not question'); return; }
    _isIn1wordAnsExpecting = false;
    this._question(isYes);
  }
};

const commands = {
  run: function (kind, name, ctx, args = []) {
    if (!ctx.isSystem && !this.accessRightsGuard(ctx.update.message.chat.id, ctx.update.message.from.id)) return;
    const cmd = this.list[kind][name];
    if (!cmd) { console.error(kind, name, cmd, 'no_cmd'); return }
    const args_ = [].concat(args).concat(ctx.match && ctx.match.slice(1));
    const onError = (e) => {
      console.error(kind, name, '->', e);
      ctx.reply(randList(['нишмаглаа', 'Нимагуу']) + '\n' + e.message);
    };
    if (!Array.isArray(cmd)) {
      lastCommand.set(cmd);
      typing(ctx);
      return cmd(ctx, args_).catch(onError);
    } else {
      lastCommand.set(cmd[1]);
      const repCtx = ctx.reply(cmd[0] !== 'wait_msg' ? cmd[0] : 'Ok, wait, please…', { disable_notification: true });
      repCtx.then(() => typing(ctx));
      return Promise.all([repCtx, cmd[1](ctx, args_)]).then(([repCtx, res]) => { del(repCtx); return res; }).catch(onError);
    }
  },
	runSys: function (kind, name, args = []) {
		const ctx = {
			isSystem: true,
			chat: { id: VIGVAM_ID },
			reply: msg => app.telegram.sendMessage(VIGVAM_ID, msg),
		};
		return this.run(kind, name, ctx, args = []);
	},
  list: {
    voice: {
      voice_over: ctx => {
        isVoiceVerboseMode = true;
        return ctx.reply('ok, I`ll say everything you post', { disable_notification: true })
      },
      voice_over_stop: ctx => {
        isVoiceVerboseMode = false;
        return ctx.reply('ok, I`ll be quiet', { disable_notification: true })
      },
      say: ['wait_msg', (ctx, args) => {
        return say(args[0], ctx);
      }],
    },
    home: {
      presense: ['10 sec, please… 😅', (ctx) => {
        return whoAtHome()
          .then((json) => {
            const name = (key) => homemates.get(key, 'name');
            const here = (key) => randList(['дома ', 'тута', 'где-то здесь']);
            const outside = (key) => randList(['не дома', 'отсутствует', 'шляется']);
            const outside_ = (key) => key === 'lenya' ? randList(['— по бабам', '— опять по бабам']) : outside(key);
            const getStatus = (key) => json[key] ? `✅ ${name(key)} ${here(key)}` : `🔴 ${name(key)} ${outside_(key)}`;
            const txt = Object.keys(homemates.list).map((key) => getStatus(key)).join('\n');
            return ctx.reply(txt, { disable_notification: true });
          });
      }],
    },
    music: {
      action: ['wait_msg', (ctx, args) => {
        return exec('has-music').then(hasMusic => {
          if (hasMusic) return exec(`${args[0]}-music`).then((stdout) => {
            return ctx.reply(`ok, music ${args[0]}ed`);
          });
          return ctx.reply('Нимагуу. You can make quieter');
        });
      }],
    },
    vol: {
      action: ['wait_msg', (ctx, args) => {
        const up = ['louder', 'up', '+', 'increase']
        const dx = up.includes(args[0].trim()) ? +1 : -1;
        const K = 10;
        return exec('get-vol')
          .then((vol) => exec(`vol ${+vol + K * dx} ${args[0]}`))
          .then(() => ctx.reply(`ok, vol ${dx > 0 ? 'increased' : 'decreased'}`));
      }],
    },
    light: {
      on: ctx => exec('light on').then(() => ctx.reply('ok')),
      off: ctx => exec('light off').then(() => ctx.reply('ok')),
      status: ctx => getLightStatus().then(status => ctx.reply(`ok: ${(status ? '🌖 on' : '🌘 off')}`)),
    },
    weather: {
      forecast: ['10 sec, please… 😅', (ctx) => {
        return exec(`get-weather`).then(res => JSON.parse(res))
          .then((weather) => {
            console.log(weather)
            const temp = Math.floor(weather.temp);
            const units = inflect(temp, { one: 'градус', some: 'градуса', many: 'градусов' });
            const txt = weather.description && weather.temp && `Погода в ближайшее время: ${weather.description}, ${temp} ${units}`;
            ctx.reply(txt || 'нишмагла');
            //weather.icon && app.telegram.sendPhoto(ctx.chat.id, `http://openweathermap.org/img/w/${ weather.icon }.png`, {disable_notification: true});
            //const url = `http://tg-bot-web.invntrm.ru/weathericons/${ weather.icon }.svg`;
            //weather.icon && app.telegram.sendPhoto(ctx.chat.id, url, {disable_notification: true});
            return [txt, weather];
          })
          .then(([txt]) => ((new Date()).getHours() >= 9) && say(txt, ctx, true, true))
      }],
    },
    misc: {
      print: (ctx, args) => {
        return app.telegram.sendMessage(consts.VIGVAM_ID, args[0]);
      },
    },
    jokes: {
      joke: ['wait_msg', (ctx) => {
        return (jokes.list.length > (jokes.i + 1) ? Promise.resolve(jokes) : commands.run('jokes', 'update', ctx))
          .then(jokes_ => {
            jokes = jokes_ // global
            console.log(jokes.i + 1, jokes.list.length, jokes.list[jokes.i + 1])
            setTimeout(() => write('./jokes.json', jokes), 1000);
            return ctx.reply(jokes.list[++jokes.i]);
          });
      }],
      update: (ctx) => {
        console.log('update jokes', jokes.i + 1, jokes.list.length, jokes.list[jokes.i + 1]);
        return open('http://bash.im/byrating/' + (++jokes.page)).then(html => parse(html))
          .then(({ window: { document } }) => {
            return Array.from(document.querySelectorAll('.quote .text'))
              .map(e => decode(e.innerHTML.replace(/<[^>]+>/g, '\n')))
          })
          .then(list => Object.assign({}, jokes, { list, i: -1 }))
          .then(jokes => { write('./jokes.json', jokes); return jokes; });
      },
    },
    fixes: {
      airplay: (ctx) => {
        return exec('sudo systemctl restart shairport-sync')
          .then(() => ctx.reply('ok'))
          .catch((e) => { console.error(e); ctx.reply('fail'); });
      }
    },
		torrents: {
			search: ['wait_msg', async (ctx, args) => {
				const query = args.join(' ').trim();
				const res = JSON.parse(await exec(`search-rutracker ${ query }`));
				if (!res || !res.length) return ctx.reply('nothing');
				res.forEach(async res => {
					ctx.replyWithHTML(unindent`
            📕 ${ res.category } <b>${ res.size_h }</b>.
            seeds: <b>${ res.seeds }</b> / leechs: ${ res.leechs }
            <b># ${ res.id }</b>
            🌐 ${ res.url.replace(/^https?:\/\//, '') }
					`, Markup.inlineKeyboard([Markup.callbackButton('Download', `torrent download ${ res.id }`)]).extra());
				});
      }],
      download: ['wait_msg', async ({ reply }, args) => {
        reply('start downloading...');
        console.log('start downloading...');
        try {
          await exec(`download-rutracker ${ args[0] }`);
          reply('done')
        } catch(e) {
          console.error('torrent download error', e);
          reply('torrent download error \n' + e.message);
        }
      }],
      status: async ({ reply }) => {
        const info = await exec('deluge-console info');
        reply(info);
      }
		},
  },
  accessRightsGuard: function (id, userId) {
    const hasAccess = consts.permittedChats.includes(id) || homemates.isMember(userId);
    if (!hasAccess) {
      app.telegram.sendMessage(id, 'Бесправная скотина не может повелевать Ботом');
      console.error('ACL decline', id);
    }
    return hasAccess;
  },
};

/*
 voice
*/

app.hears(/^(?:(?:читай|зачитывай)\s+((входящие\s+)?сообшения|ч[ая]т)|read\s+(?:chat|messages))/i, (ctx) => {
  commands.run('voice', 'voice_over', ctx);
});
app.hears(/^(?:не\s+(читай|зачитывай)\s+((входящие\s+)?сообшения|ч[ая]т)|перестань\s+читать\s+ч[ая]т|no\s+read\s+(chat|messages))/i, (ctx) => {
  commands.run('voice', 'voice_over_stop', ctx);
});
app.hears(/^(?:(?:say|скажи)\s+((?:.|\n)+))/im, (ctx) => {
  commands.run('voice', 'say', ctx);
});


/*
 home
*/

app.hears(/^(?:who\s+(is\s+)?at\+home\??|(есть\s)?(все|кто)\s+(ли\s+)?(дома|здесь)\??)/i, (ctx) => {
  commands.run('home', 'presense', ctx);
});


/*
 light
*/

app.hears(/^(?:turn\s+light\s+on|включи\s+свет)/i, (ctx) => {
  commands.run('light', 'on', ctx);
});
app.hears(/^(?:turn\s+light\s+off|выключи\s+свет)/i, (ctx) => {
  commands.run('light', 'off', ctx);
});
app.hears(/^(?:is\s+light\s+on|light\s+status|включен(\s+ли)?\s+свет|свет\s+включен\??)/i, (ctx) => {
  commands.run('light', 'status', ctx);
});

/*
 music
*/

app.hears(/^(?:(выключи|останови|выруби|убери)\s+(?:музыку|звук|воспроизведение)|не\s+играй|stop\s+playing|stop\s+music)/i, (ctx) => {
  commands.run('music', 'action', ctx, 'stop');
})
app.hears(/^(?:поставь\s+на\s+паузу|пауза$|pause(,\s+please!?)?)/i, (ctx) => {
  commands.run('music', 'action', ctx, 'pause');
})
app.hears(/^(?:продолж(и|ай)\s+(воспроизведение|играть)|resume\s+playing)/i, (ctx) => {
  commands.run('music', 'action', ctx, 'resume');
})
app.hears(/^(?:(?:(?:сы|и)грай|воспроизведи|play)\s+((?:.|\n)+))/i, (ctx) => {
  console.log(ctx.match[1].trim());
  ctx.reply('ok, I`ll try')
  exec(`stop-music || :; mplayer "${ctx.match[1].trim()}"`).then((stdout) => {
  }).catch((e) => {
    console.error(e);
    ctx.reply('нишмаглаа');
  });
});


/*
 vol
*/

app.hears(/^(?:(сделай\s+)?(по)?тише|make(\s+(sound|music))?\s+quieter)/i, (ctx) => {
  commands.run('vol', 'action', ctx, 'quieter');
});
app.hears(/^(?:(сделай\s+)?(по)?громче|make(\s+(sound|music))?\s+louder)/i, (ctx) => {
  commands.run('vol', 'action', ctx, 'louder');
});

/*
 misc
*/

app.hears(/^(?:(?:какая\s+)?погода|что\s+с\s+погодой\??|что\s+обещают\??|что\s+с\s+погодой\??|(?:(?:(?:say|get|read)\s+)?(?:a\s+)?weather))/i, (ctx) => {
  commands.run('weather', 'forecast', ctx);
});

app.hears(/^(?:text|print|напиши|наречатай)\s+((?:.|\n)+)$/im, (ctx) => {
  commands.run('misc', 'print', ctx);
});

app.hears(/^(?:(?:(?:get|tell|next)\s+)?joke|(?:(?:(?:расскажи|давай)\s+)?(?:шутку|анекдот)|пошути|шуткуй))/i, (ctx) => {
  commands.run('jokes', 'joke', ctx);
});

app.hears(/^fix airplay/, (ctx) => {
  commands.run('fixes', 'airplay', ctx);
});

app.hears(/^(?:(?:find|search|look up) (?:torrent|rutracker|serial|film)|(?:поищи|ищи|найди|искать|ищи) (?:торрент|на рутрекере|на rutracker|фильм|сериал))(.+)/i, (ctx) => {
	commands.run('torrents', 'search', ctx);
});

app.on('audio', (ctx) => {
	app.telegram.getFileLink(ctx.message.audio.file_id)
  .then(async (link) => {
		const name = `/tmp/tg-bot-audio.${ link.match(/\w+$/)[0] }`;
		console.log('link', link)
    await exec(`wget -O ${ name } ${ link }`);
    exec(`stop-music || :; mplayer "${ name }"`).then((stdout) => {
			ctx.reply('ok');
    }).catch((e) => {
      console.error(e);
      ctx.reply('нишмаглаа');
    });
  });
});

app.on('voice', (ctx) => {
	if (!ctx.message.voice) return;
	app.telegram.getFileLink(ctx.message.voice.file_id)
	.then(async (voiceLink) => {
		await exec(`wget -O /tmp/tg-bot-voice.oga ${ voiceLink }`);
		//exec(`asr /tmp/tg-bot-voice.oga`)
	});
});

app.hears(/^hi$/i, (ctx) => ctx.reply('Hey there!'))

//app.telegram.sendMessage(consts.VIGVAM_ID, 'Привет человеки');
//app.on('inline_query', (props) => {
//  const { inlineQuery } = props;
//  console.log('aa?', props);
//  //props.replyWithMarkdown('Hey there!');
//  //answerInputTextMessageContent([{message_text:'Hey there!'}]);
//});

/*
 /commands
*/

const cmd = fn => ctx => {
  const args = ctx.update.message.text.split(/\s+/).slice(1).join(' ');
  fn(ctx, args);
};

app.command('start', (props) => {
  const { from, reply } = props;
  console.log('start', from, props)
  return reply('Welcome!')
})

app.command('voice_over', cmd((ctx, args) => {
  if (['off', 'stop'].includes(args[0])) commands.run('voice', 'voice_over_stop', ctx);
  commands.run('voice', 'voice_over', ctx);
}));

app.command('voice_over_stop', cmd((ctx, args) => {
  commands.run('voice', 'voice_over_stop', ctx);
}));

app.command('say', cmd((ctx, args) => commands.run('voice', 'say', ctx, args)));

app.command('vol', cmd((ctx, args) => commands.run('vol', 'action', ctx, args)));
app.command('louder', cmd((ctx, args) => commands.run('vol', 'action', ctx, 'louder')));
app.command('quieter', cmd((ctx, args) => commands.run('vol', 'action', ctx, 'quieter')));

app.command('music', cmd((ctx, args) => commands.run('music', 'action', ctx, args)));
app.command('pause', cmd((ctx, args) => commands.run('music', 'action', ctx, 'pause')));
app.command('resume', cmd((ctx, args) => commands.run('music', 'action', ctx, 'resume')));
app.command('stop', cmd((ctx, args) => commands.run('music', 'action', ctx, 'stop')));

app.command('home', cmd((ctx, args) => commands.run('home', 'presense', ctx)));

app.command('light', cmd((ctx, args) => commands.run('light', args[0], ctx)));

app.command('weath', cmd((ctx, args) => commands.run('weather', 'forecast', ctx)));

app.command('joke', cmd((ctx, args) => commands.run('jokes', 'joke', ctx)));

/*
 universal
*/

app.hears(/^(?:повтори|((и|повтори)\s+)?ещё(\s+раз)?|(one\s+more\s+time|more|repeat)(,\s+please)?)$/i, (ctx) => {
  if (!lastCommand.has()) return;
  switch (lastCommand.type) {
    // change the entity
    case ('put'):
      break;
    // get the/an entity (see cacheControl)
    case ('get'):
      if (lastCommand.cacheControl === 'no-cache') {
        lastCommand.repeat()
      } else {
        ctx.reply('no changes');
      }
      break;
    // create the entity
    case ('post'):
      ctx.reply('are you sure, you want to repeat?')
      lastQuestion.set(lastCommand);
      break;
    // delete the/an entity (see cacheControl)
    case ('delete'):
      if (lastCommand.cacheControl === 'no-cache') {
        ctx.reply('are you sure, you want to repeat?')
        lastQuestion.set(lastCommand);
      } else {
        ctx.reply('already deleted');
      }
      break;
    default: ctx.reply('I`m not sure about last command'); break;
  }
});

app.hears(/^(?:yep|yes|да|Y)/i, (ctx) => {
  if (isIn1wordAnsExpecting()) {
    _isIn1wordAnsExpecting = false;
    lastQuestion.answer(true);
  }
});
app.hears(/^(?:no|nope|N|нет|не-а)/i, (ctx) => {
  if (isIn1wordAnsExpecting()) {
    lastQuestion.answer(false);
  }
});

app.hears(/./, (ctx) => {
  if (!isVoiceVerboseMode) return;
  const name = ctx.update.message.from.first_name;
  say(`говорит ${homemates.get(name, 'name') || name}: ${ctx.match.input}`, ctx, true);
});

app.action(/.+/, (ctx) => {
	let m;
	if (m = ctx.match && ctx.match[0].match(/^torrent download (\d+)/)) {
    commands.run('torrents', 'download', ctx, m[1]);
	}
  return ctx.answerCallbackQuery(`Oh, ${ctx.match[0]}! Great choise`)
})

app.startPolling();

//jobs();

setInterval(() => commands.runSys('jokes', 'joke'), 1000*60*60*24);
