// vim: set ts=4

const {
  Telegraf,
  // Extra,
  Markup,
  token,
  // fs,
  // read,
  // write,
  exec,
  // throttle,
  // debounce,
  // inflect,
  getRandList,
  // open,
  // parse,
  // decode,
  config,
  consts,
  combo,
  Joker,
  unindent,
} = require('./common');

const { say } = require('./plugins/speech');

require('dotenv').config(); // load BOT_TOKE from .env file

// const jobs = require('./src/jobs');

const joker = Joker();

const app = new Telegraf(token);

// const edit = (repCtx, txt) => app.telegram.editMessageText(repCtx.chat.id, repCtx.message_id, null, txt);
const del = repCtx => app.telegram.deleteMessage(repCtx.chat.id, repCtx.message_id);
const typing = ctx => app.telegram.sendChatAction(ctx.chat.id, 'typing').catch(e => console.error('e', e));

app.telegram.getMe().then((botInfo) => {
  app.options.username = botInfo.username;
});

app.use(Telegraf.log());

const homemates = {
  list: config.commands.list.home.data.homemates.list,
  get(key, field) { return this.list[key.toLowerCase()] && this.list[key.toLowerCase()][field]; },
  set(key, field, val) { this.list[key][field] = val; return val; },
  setAll(field, object) { Object.keys(this.list).forEach((key) => { this.set(key, field, object[key]); }); },
  empty() { return Object.keys(this.list).every(key => !this.get(key, 'presense')); },
  full() { return Object.keys(this.list).every(key => this.get(key, 'presense')); },
  isMember(id) { return Object.keys(this.list).some(key => this.get(key, 'id') === id); },
};


const isVoiceVerboseMode = false;
let _isIn1wordAnsExpecting = false;
const isIn1wordAnsExpecting = () => {
  return _isIn1wordAnsExpecting ? (Date.now() - _isIn1wordAnsExpecting < 1000 * consts.ANS_EXP) : false;
};

const lastCommand = {
  _command: null,
  type: null,
  set(type, command) {
    this.type = type;
    this._command = command;
  },
  has() {
    return this._command;
  },
  repeat() {
    if (!this.has()) { console.error('hm, there is not command'); return; }
    this._command(...this._args);
  },
};

const lastQuestion = {
  _question: null,
  set(command) {
    this._question = isYes => isYes && command.repeat();
  },
  answer(isYes) {
    if (!this._question) { console.error('hm, there is not question'); return; }
    _isIn1wordAnsExpecting = false;
    this._question(isYes);
  },
};

const commands = {
  run(kind, name, ctx, args = []) {
    const data = ctx.update || ctx.callback_query;
    const hasAccess = this.accessRightsGuard(data.message.chat.id, data.message.from.id);
    if (!ctx.isSystem && data.message && !hasAccess) return undefined;
    const cmd = this.list[kind][name];
    if (!cmd) { console.error(kind, name, cmd, 'no_cmd'); return undefined; }
    const args_ = [].concat(args).concat(ctx.match && ctx.match.slice(1));

    if (!Array.isArray(cmd)) {
      lastCommand.set(cmd);
      typing(ctx);
      return cmd(ctx, args_).catch(onError);
    }

    lastCommand.set(cmd[1]);
    const repCtx = ctx.reply(cmd[0] !== 'wait_msg' ? cmd[0] : 'Ok, wait, please…', { disable_notification: true });
    repCtx.then(() => typing(ctx));

    return Promise.all([repCtx, cmd[1](ctx, args_)])
      .then(([repCtx, res]) => { del(repCtx); return res; }) // eslint-disable-line no-shadow
      .catch(onError);

    function onError(e) {
      console.error(kind, name, '->', e);
      ctx.reply(getRandList(['нишмаглаа', 'Нимагуу']) + '\n' + e.message); // eslint-disable-line prefer-template
    }
  },
  runSys(kind, name, args = []) {
    const ctx = {
      isSystem: true,
      chat: { id: consts.VIGVAM_ID },
      reply: msg => app.telegram.sendMessage(consts.VIGVAM_ID, msg),
    };
    return this.run(kind, name, ctx, args);
  },
  list: {
    misc: {
      write: [(ctx, args) => app.telegram.sendMessage(consts.VIGVAM_ID, args[0]), {
        phrases: [
          'text', 'write',
          'напиши', 'напечатай',
        ],
        command: 'write',
      }],
    },


    jokes: {
      joke: ['wait_msg', async ctx => ctx.reply(await joker.next())],
      update: async (ctx) => { await joker._loadNewPage(); ctx.reply('jokes updated'); },
    },


    fixes: {
      airplay: [ctx => exec('sudo systemctl restart shairport-sync')
        .then(() => ctx.reply('ok'))
        .catch((e) => { console.error(e); ctx.reply('fail'); }), {
        phrases: [
          'fix airplay',
          'почини airplay',
        ],
        command: 'fix_airplay',
      }],
    },


    torrents: {
      search: ['wait_msg', async (ctx, args) => {
        const query = args.join(' ').trim();
        const res = JSON.parse(await exec(`search-rutracker ${ query }`));
        if (!res || !res.length) return ctx.reply('nothing');
        res.forEach(async (res) => { // eslint-disable-line no-shadow
          ctx.replyWithHTML(unindent`
            📕 ${ res.category } <b>${ res.size_h }</b>.
            seeds: <b>${ res.seeds }</b> / leechs: ${ res.leechs }
            <b># ${ res.id }</b>
            🌐 ${ res.url.replace(/^https?:\/\//, '') }
          `, Markup.inlineKeyboard([Markup.callbackButton('Download', `torrent download ${ res.id }`)]).extra());
        });
        return undefined;
      }, {
        phrases: [
          ...combo(['find', 'search', 'look up'], ['torrent', 'rutracker', 'on rutracker', 'searial', 'film']),
          ...combo(['поищи', 'ищи', 'найди', 'искать'], ['торрент', 'на рутрекере', 'на rutracker', 'фильм', 'сериал']),
        ],
        command: 'torrent_search',
      }],

      download: ['wait_msg', async ({ reply }, args) => {
        reply('start downloading...');
        console.log('start downloading...');
        try {
          await exec(`download-rutracker ${ args[0] }`);
          reply('done');
        } catch (e) {
          console.error('torrent download error', e);
          reply(`torrent download error \n${ e.message }`);
        }
      }, {
        phrases: [
          'download torrent',
          'скачай торрент', 'закачай торрент',
        ],
        command: 'torrent_download',
      }],

      status: [async ({ reply }) => {
        const info = await exec('deluge-console info');
        reply(info);
      }, {
        phrases: [
          'torrents status',
          'что там с торрентами', 'как там торренты',
          'статус торрентов', 'дай статус торрентов',
        ],
        command: 'torrents',
      }],
    },
  },

  accessRightsGuard(id, userId) {
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
});
app.hears(/^(?:поставь\s+на\s+паузу|пауза$|pause(,\s+please!?)?)/i, (ctx) => {
  commands.run('music', 'action', ctx, 'pause');
});
app.hears(/^(?:продолж(и|ай)\s+(воспроизведение|играть)|resume\s+playing)/i, (ctx) => {
  commands.run('music', 'action', ctx, 'resume');
});
app.hears(/^(?:(?:(?:сы|и)грай|воспроизведи|play)\s+((?:.|\n)+))/i, (ctx) => {
  console.log(ctx.match[1].trim());
  ctx.reply('ok, I`ll try');
  exec(`stop-music || :; mplayer "${ ctx.match[1].trim() }"`).then((stdout) => {
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

app.hears(/^(?:text|print|напиши|напечатай)\s+((?:.|\n)+)$/im, (ctx) => {
  commands.run('misc', 'write', ctx);
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
      console.log('link', link);
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
      // exec(`asr /tmp/tg-bot-voice.oga`)
    });
});

app.hears(/^hi$/i, ctx => ctx.reply('Hey there!'));

// app.telegram.sendMessage(consts.VIGVAM_ID, 'Привет человеки');
// app.on('inline_query', (props) => {
//  const { inlineQuery } = props;
//  console.log('aa?', props);
//  //props.replyWithMarkdown('Hey there!');
//  //answerInputTextMessageContent([{message_text:'Hey there!'}]);
// });

/*
 /commands
*/

const cmd = fn => (ctx) => {
  const args = ctx.update.message.text.split(/\s+/).slice(1).join(' ');
  fn(ctx, args);
};

app.command('start', (props) => {
  const { from, reply } = props;
  console.log('start', from, props);
  return reply('Welcome!');
});

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

app.command('light', cmd((ctx, args) => commands.run('light', args, ctx)));

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
        lastCommand.repeat();
      } else {
        ctx.reply('no changes');
      }
      break;
    // create the entity
    case ('post'):
      ctx.reply('are you sure, you want to repeat?');
      lastQuestion.set(lastCommand);
      break;
    // delete the/an entity (see cacheControl)
    case ('delete'):
      if (lastCommand.cacheControl === 'no-cache') {
        ctx.reply('are you sure, you want to repeat?');
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
  say(`говорит ${ homemates.get(name, 'name') || name }: ${ ctx.match.input }`, ctx, true);
});

app.action(/.+/, (ctx) => {
  const m = ctx.match;
  if (m && m[0].match(/^torrent download (\d+)/)) {
    commands.run('torrents', 'download', ctx, m[1]);
  }
  return ctx.answerCallbackQuery(`Oh, ${ m[0] }! Great choise`);
});

app.startPolling();

// jobs();

setInterval(() => commands.runSys('jokes', 'joke'), 1000 * 60 * 60 * 24);
