// set: ts=4

const ANS_EXP = 8; // s
const INTRO_DELAY = 20; // s
const VIGVAM_ID = -158775326;
const SASHA_ID = 147445817;
const MISHA_ID = 210367273;

require('dotenv').config();

const Telegraf = require('telegraf')
const TOKEN = null;
const token = process.env.BOT_TOKEN || TOKEN;

const util = require('util');
const child_process = require('child_process');
	const exec = child_process.exec.bind(child_process);
	const exec_ = util.promisify(exec);
	const execSync = (cmd) => child_process.execSync(cmd, {encoding: 'utf8'});
const getLightStatus = () => parseInt(execSync('gpio -1 read 22'), 10);
const getLightStatus_ = () => exec_('gpio -1 read 22').then(l => parseInt(l, 10));
const throttle = require('lodash.throttle');
const debounce = require('just-debounce-it');
const randList = (list) => {
	return list[Math.floor(Math.random() * list.length)];
};

let homematesPresense = {
	lenya: null,
	misha: null,
	sasha: null,
	empty: function () { return !(this.lenya && this.misha && this.sasha); },
};

const homematesMap = {
	lenya: 'Лёня',
	misha: 'Миша',
	sasha: 'Саша',
};

const onChange = (type, signal, data) => {
	switch(type) {
	case('home'):
		switch(signal) {
		case('presense'):
			if (data.sasha && data.sasha.before) getLightStatus_().then(v=>{if(v) throw 'y'}).then(() => exec_('light on')).then(() => {
				app.telegram.sendMessage(SASHA_ID, 'Sasha came back ==> Light turned on');
			}).catch(() => {});
			if (data.sasha && !data.sasha.before) getLightStatus_().then(v=>{if(!v) throw 'n'}).then(() => exec_('light off')).then(() => {
				app.telegram.sendMessage(SASHA_ID, 'Sasha left ==> Light turned off');
			}).catch(() => {});
			if (homematesPresense.empty()) exec_('has-music').then(v=>{if(!v) throw 'none'}).then(() => exec_('stop-music')).then(() => {
				app.telegram.sendMessage(VIGVAM_ID, 'No body at home ==> Music stopped');
			}).catch(() => {});
		break;
		}
	break;
	}
};

let lastMessageTime = null;

const getIntro_ = debounce(() => {
	return randList(['ааааа','вигв+аме','кар+оч','сл+ушайте','эт с+амое']) + ', ... &&& ... — ';
}, INTRO_DELAY, true);
const getIntro = () => getIntro_() || '';

const say = (text, ctx, isQuiet, noIntro) => {
	console.log()
	try {
	console.log(">>", text.trim().replace(/\n/g, ' '))
	exec(`tts "${ noIntro || getIntro() }, ${ text.replace(/\n/g, ' ') }"`, (err, stdout, stderr) => {
		console.log('cb', err, stdout,stderr);
		isQuiet || ctx.reply('я всё сказал');
	});
	} catch(e){}
};

let isVoiceVerboseMode = false;
let _isIn1wordAnsExpecting = false;
const isIn1wordAnsExpecting = () => {
	return _isIn1wordAnsExpecting ? (Date.now() - _isIn1wordAnsExpecting < 1000 * ANS_EXP) : false;
};
const lastCommand = {
	_command: null,
	type: null,
	set: function(type, command) {
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
	set: function(command) {
		this._question = (isYes) => isYes && command.repeat();
	},
	answer: function (isYes) {
		if (!this._question) { console.error('hm, there is not question'); return; }
		_isIn1wordAnsExpecting = false;
		this._question(isYes);
	}
};

const commands = {
	run: function (kind, name, ctx) {
		const cmd = this[kind][name]
		cmd(ctx);
		lastCommand.set(cmd);
	},
	voice: {
		speech_chat: ctx => {
			isVoiceVerboseMode = true;
			ctx.reply('ok, I`ll say everything you post')
		},
	},
	music: {},
	light: {},
	misc: {},
};

const app = new Telegraf(token)
// const tg = Telegram.new(Telegram(token))

app.telegram.getMe().then((botInfo) => {
  app.options.username = botInfo.username
})

/*
 voice
*/

app.hears(/^(читай|зачитывай)\s+((входящие\s+)?сообшения|ч[ая]т)/i, (ctx) => {
	commands.run('voice', 'speech_chat', ctx);
});
app.hears(/^не\s*(читай|зачитывай)\s+((входящие\s+)?сообшения|ч[ая]т)/i, (ctx) => {
	isVoiceVerboseMode = false;
	ctx.reply('ok, I`ll be quiet')
});
app.hears([/^say ((.|\n)+)/im, /^скажи ((.|\n)+)/mi], (ctx) => {
	console.log(ctx.match);
	ctx.reply('ok, wait please');
	say(ctx.match[1], ctx);
/*
   const ps = child_process.spawn(`curl`, ['-v', `http://invntrm.ru`])
    ps.on('uncaughtException', function (err) {
      console.error('uncaughtException: ', err.message)
      console.error(err.stack)
      process.exit(1)
    })
	ps.on('error', (err) => {
			console.log('Failed to start child process.');
	});
		ps.stdout.on('data', (data) => {
		  console.log(`stdout: ${data}`);
		});

		ps.stderr.on('data', (data) => {
		  console.log(`stderr: ${data}`);
		});

		ps.on('close', (code) => {
		  console.log(`child process exited with code ${code}`);
		});
*/
	console.log('sent');
});


/*
 home
*/

app.hears(/^who\s+(is\s+)?at\+home\??|(все|кто)\s+(ли\s+)?дома\??/i, (ctx) => {
	
	Promise.all([
		ctx.reply('10 sec, please… 😅 '),
		whoAtHome(),
	])
	.then(([replyCtx, json]) => {
		const getStatus = id => json[id]
			? (randList(['дома ', 'тута', 'где-то здесь']) + '✅')
			: (randList(['не дома', 'отсутствует', 'шляется']) + '🔴 ')
		const txt = Object.keys(homematesMap).map((id) => `${ homematesMap[id] } ${ getStatus(id) }`).join('\n');
		app.telegram.editMessageText(replyCtx.chat.id, replyCtx.message_id, null, txt);
	});
});


/*
 light
*/

app.hears('turn light on', (ctx) => {exec('light on'); ctx.reply('ok');})
app.hears('turn light off', (ctx) => {exec('light off'); ctx.reply('ok');})
app.hears(['is light on', 'light status'], (ctx) => {const status = getLightStatus(); ctx.reply('ok: ' + (status ? 'on' : 'off'));})

/*
 music
*/

app.hears(/(выключи|останови|выруби|убери)\s+(музыку|звук)/i, (ctx) => {
	if(Boolean(execSync('has-music'))) {
		exec('stop-music', (err, stdout, stderr) => {
			console.log('cb', err, stdout,stderr);
			err ? ctx.reply('нишмаглааа') : ctx.reply('ok, music stopped');
		});
	} else {
		ctx.reply('Нимагуу. You can make quieter');
	}
})
app.hears(/поставь на паузу|^пауза$/i, (ctx) => {
	if(Boolean(execSync('has-music'))) {
		exec('pause-music', (err, stdout, stderr) => {
			console.log('cb', err, stdout,stderr);
			err ? ctx.reply('I cannot :/') : ctx.reply('Done, music paused');
		});
	} else {
		ctx.reply('Нимагуу. You can make quieter');
	}
})
app.hears(/^продолж(и|ай)\s+(воспроизведение|играть)|resume\s+playing/i, (ctx) => {
	if(Boolean(execSync('has-music'))) {
		exec('resume-music', (err, stdout, stderr) => {
			console.log('cb', err, stdout,stderr);
			err ? ctx.reply('I cannot :/') : ctx.reply('Done, music resumed');
		});
	} else {
		ctx.reply('Нимагуу');
	}
})
app.hears(/^(сделай\s+)?(по)?тише|^make(\s+(sound|music))?\s+quieter/i, (ctx) => {
	exec('v=$(get-vol); vol $(node -p "$v - 10") quieter', (err, stdout, stderr) => {
		err ? ctx.reply('I`m cannot') : ctx.reply(`ok, vol decreased`);
	});
});
app.hears(/^(сделай\s+)?(по)?громче|^make(\s+(sound|music))?\s+louder/i, (ctx) => {
	exec('v=$(get-vol); vol $(node -p "$v + 10") louder', (err, stdout, stderr) => {
		err ? ctx.reply('I`m cannot') : ctx.reply(`ok, vol increased`);
	});
});
app.hears(/^((сы|и)грай|воспроизведи|play)\s+((.|\n)+)/i, (ctx) => {
	ctx.reply('ok, I`ll try')
	exec(`mpg321 "${ ctx.match[1].trim().replace(/\n/g, ' ') }"`, (err, stdout, stderr) => {
		err ? ctx.reply('нишмаглаа') : ctx.reply('ok, listen');
	});
});
/*
 misc
*/

//app.on('sticker', (ctx) => ctx.reply(''))
app.command('start', (props) => {
  const { from, reply } = props;
  console.log('start', from, props)
  return reply('Welcome!')
})
app.hears(/hi/i, (ctx) => ctx.reply('Hey there!'))

//app.telegram.sendMessage(VIGVAM_ID, 'Привет человеки');
//app.on('inline_query', (props) => {
//  const { inlineQuery } = props;
//  console.log('aa?', props);
//  //props.replyWithMarkdown('Hey there!');
//  //answerInputTextMessageContent([{message_text:'Hey there!'}]);
//});

/*
 universal
*/

app.hears(/^(повтори|((и|повтори)\s+)?ещё(\s+раз)?|(one\s+more\s+time|more|repeat)(,\s+please)?)$/i, (ctx) => {
	if (!lastCommand.has()) return;
	switch(lastCommand.type) {
		// change the entity
		case('put'):
		break;
		// get the/an entity (see cacheControl)
		case('get'):
			if (lastCommand.cacheControl === 'no-cache') {
				lastCommand.repeat()
			} else {
				ctx.reply('no changes');
			}
		break;
		// create the entity
		case('post'):
			ctx.reply('are you sure, you want to repeat?')
			lastQuestion.set(lastCommand);
		break;
		// delete the/an entity (see cacheControl)
		case('delete'):
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

app.hears(/^(yep|yes|да|Y)/i, (ctx) => {
	if (_isIn1wordAnsExpecting()) {
		isIn1wordAnsExpecting = false;
		lastQuestion.answer(true);
	}
});
app.hears(/^(no|nope|N|нет|не-а)/i, (ctx) => {
	if (isIn1wordAnsExpecting()) {
		lastQuestion.answer(false);
	}
});

app.hears(/./, (ctx) => {
	console.log(ctx.from)
	if(!isVoiceVerboseMode) return;
	say(`говорит ${ ctx.update.message.from.first_name }: ${ ctx.match.input }`, ctx, true);
});

app.startPolling()

const pollHomematesePresense = () => {
	setInterval(reportHomematesePresenseChange, 1000 * 60 * 1);
}
const reportHomematesePresenseChange = async () => {
	if ((new Date()).getHours() < 9) return;
	console.log('poll homemates presense', homematesPresense);
	const diff = await getHomematesePresenseChange();
	if (diff.length) {
		sendHomematesDiff(diff);
		onChange('home', 'presense', diff);
	}
};
const sendHomematesDiff = throttle((diff) => {
	console.log('diff', diff);
	app.telegram.sendMessage(VIGVAM_ID, '🏠↘︎↖︎\n'
	+ diff.map(item => item.who + (item.before ? ' вернулся' : (Math.random() > .5 ? ' ушёл' : ' свалил'))));
}, 1000 * 60 * 60);
const getHomematesePresenseChange = () => {
	const diff = whoAtHome().then(actualPresense => {
		const diff = ['lenya', 'misha', 'sasha'].filter(m => {
			return homematesPresense[m] !== null && homematesPresense[m] !== actualPresense[m];
		})
		.map(m => {
			return { who: m, after: homematesPresense[m], before: actualPresense[m] };
		});
		Object.assign(homematesPresense, actualPresense);
		return diff;
	});
	return diff;
};
const whoAtHome = () => {
	return exec_('who-at-home')
	.then((stdout) => {
		const j = JSON.parse(stdout)
		j.lenya = j.lenya === 'Y';
		j.misha = j.misha === 'Y';
		j.sasha = j.sasha === 'Y';
		return j;
	});
};


