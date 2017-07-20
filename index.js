// vim: set ts=4

const ANS_EXP = 8; // s
const INTRO_DELAY = 20; // s
const VIGVAM_ID = -158775326;

require('dotenv').config(); // load BOT_TOKE from .env file

const Telegraf = require('telegraf');
const { Extra, Markup } = require('telegraf');
const TOKEN = null;
const token = process.env.BOT_TOKEN || TOKEN;

const util = require('util');
const child_process = require('child_process');
const exec = util.promisify(child_process.exec.bind(child_process));
const getLightStatus = () => exec('gpio -1 read 22').then(l => parseInt(l, 10));
const throttle = require('lodash.throttle');
const debounce = require('just-debounce-it');
const randList = (list) => list[Math.floor(Math.random() * list.length)];
const edit = (repCtx, txt) => app.telegram.editMessageText(repCtx.chat.id, repCtx.message_id, null, txt);
const typing = (ctx) => app.telegram.sendChatAction(ctx.chat.id, 'typing').catch(e=>console.error('e', e));

const app = new Telegraf(token);

app.telegram.getMe().then((botInfo) => {
  app.options.username = botInfo.username
});

let homemates = {
	list: {
		lenya: { presense: null, name: 'Лёня', id: 234091889 },
		misha: { presense: null, name: 'Миша', id: 210367273 },
		sasha: { presense: null, name: 'Саня', id: 147445817 },
	},
	get: function (key, field) { return this.list[key.toLowerCase()] && this.list[key.toLowerCase()][field]; },
	set: function (key, field, val) { this.list[key][field] = val; return val; },
	setAll: function (field, object) { Object.keys(this.list).forEach((key) => {this.set(key, field, object[key]);}); },
	empty: function () { return Object.keys(this.list).every(key => !this.get(key, 'presense')); },
	isMember: function (id) { Object.keys(this.list).some(key => this.get(key, 'id') === id); },
}

const onChange = (type, signal, data) => {
	switch(type) {
	case('home'):
		switch(signal) {
		case('presense'):
			if (data.sasha && data.sasha.before) getLightStatus().then(v=>{if(v.trim()) throw 'y'}).then(() => exec('light on')).then(() => {
				app.telegram.sendMessage(homemates.get('sasha', 'id'), 'Sasha came back ==> Light turned on');
			}).catch(() => {});
			if (data.sasha && !data.sasha.before) getLightStatus().then(v=>{if(!v.trim()) throw 'n'}).then(() => exec('light off')).then(() => {
				app.telegram.sendMessage(homemates.get('sasha', 'id'), 'Sasha left ==> Light turned off');
			}).catch(() => {});
			if (homemates.empty()) exec('has-music').then(v=>{if(!v.trim()) throw 'none'}).then(() => exec('stop-music')).then(() => {
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
	if (!text) { console.log('тут и говорить нечего'); return;}
	console.log(">>", text.trim().replace(/\n/g, ' '))
	return exec(`tts "${ noIntro || getIntro() }, ${ text.replace(/\n/g, ' ') }"`).then((stdout) => {
		console.log('say', stdout);
		isQuiet || ctx.reply('я всё сказал');
	}).catch(e => {
		console.error('say error', e);
		isQuiet || ctx.reply('нишмаглаа /');
	});
};

const whoAtHome = () => {
	return exec('who-at-home')
	.then((stdout) => {
		const j = JSON.parse(stdout)
		j.lenya = j.lenya === 'Y';
		j.misha = j.misha === 'Y';
		j.sasha = j.sasha === 'Y';
		return j;
	});
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
		if (!this.accessRightsGuard()) return;
		const cmd = this.list[kind][name];
		cmd(ctx);
		lastCommand.set(cmd);
	},
	list: {
		voice: {
			voice_over: ctx => {
				isVoiceVerboseMode = true;
				ctx.reply('ok, I`ll say everything you post')
			},
		},
		music: {},
		light: {},
		misc: {},
	},
	accessRightsGuard: function (id) {
		const hasAccess = homemates.isMember(id);
		if (!hasAccess) app.telegram.sendMessage(id, 'Бесправная скотина не может повелевать Ботом');
		return hasAccess;
	},
};

/*
 voice
*/

app.hears(/^(?:(читай|зачитывай)\s+((входящие\s+)?сообшения|ч[ая]т)|read\s+(chat|messages))/i, (ctx) => {
	typing(ctx);
	commands.run('voice', 'voice_over', ctx);
});
app.hears(/^(?:не\s+(читай|зачитывай)\s+((входящие\s+)?сообшения|ч[ая]т)|перестань\s+читать\s+ч[ая]т|no\s+read\s+(chat|messages))/i, (ctx) => {
	typing(ctx);
	isVoiceVerboseMode = false;
	ctx.reply('ok, I`ll be quiet')
});
app.hears([/^(?:say\s+((.|\n)+))/im, /^(?:скажи\s+((.|\n)+))/mi], (ctx) => {
	console.log(ctx.match);
	ctx.reply('ok, wait please');
	say(ctx.match[1], ctx);
	console.log('sent');
});


/*
 home
*/

app.hears(/^(?:who\s+(is\s+)?at\+home\??|(все|кто)\s+(ли\s+)?дома\??)/i, (ctx) => {
	Promise.all([
		ctx.reply('10 sec, please… 😅 '),
		typing(ctx),
		whoAtHome(),
	])
	.then(([replyCtx, _, json]) => {
		const getStatus = (key) => json[key]
		? `✅ ${ homemates.get(key, 'name') } ${ randList(['дома ', 'тута', 'где-то здесь']) }`
		: `🔴 ${ homemates.get(key, 'name') } ${ key === 'lenya' ? randList(['— по бабам', '— опять по бабам']) : randList(['не дома', 'отсутствует', 'шляется']) }`
		const txt = Object.keys(homemates.list).map((key) => getStatus(key)).join('\n');
		edit(replyCtx, txt);
	});
});


/*
 light
*/

app.hears(/^(?:turn\s+light\s+on|включи\s+свет)/i, (ctx) => {
	typing(ctx);
	exec('light on').then(() => ctx.reply('ok')).catch(() => ctx.reply('нишмаглаа'));
});
app.hears(/^(?:turn\s+light\s+off|выключи\s+свет)/i, (ctx) => {
	typing(ctx);
	exec('light off').then(() => ctx.reply('ok')).catch(() => ctx.reply('нишмаглаа'));
});
app.hears(/^(?:is\s+light\s+on|light\s+status|включен(\s+ли)?\s+свет|свет\s+включен\??)/i, (ctx) => {
	typing(ctx);
	getLightStatus().then(status => {
		ctx.reply('ok: ' + (status ? 'on' : 'off'));
	}).catch(() => ctx.reply('нишмаглаа'));
});

/*
 music
*/

app.hears(/^(?:(выключи|останови|выруби|убери)\s+(музыку|звук))/i, (ctx) => {
	typing(ctx);
	exec('has-music').then(hasMusic => {
		if(hasMusic) {
			exec('stop-music').then((stdout) => {
				ctx.reply('ok, music stopped');
			}).catch(e => {console.error(e); ctx.reply('нишмаглааа');});
		} else {
			ctx.reply('Нимагуу. You can make quieter');
		}
	}).catch(e =>{console.error(e); ctx.reply('Нимагуу');});
})
app.hears(/^(?:поставь на паузу|пауза$|pause(,\s+please!?)?)/i, (ctx) => {
	typing(ctx);
	exec('has-music').then(hasMusic => {
		if(hasMusic) {
			exec('pause-music').then((stdout) => {
				ctx.reply('Done, music paused');
			}).catch((e) => {console.error(e); ctx.reply('I cannot :/');});
		} else {
			ctx.reply('Нимагуу. You can make quieter');
		}
	}).catch(e =>{console.error(e); ctx.reply('Нимагуу');});
})
app.hears(/^(?:продолж(и|ай)\s+(воспроизведение|играть)|resume\s+playing)/i, (ctx) => {
	typing(ctx);
	exec('has-music').then(hasMusic => {
		if(hasMusic) {
			exec('resume-music').then((stdout) => {
				ctx.reply('Done, music resumed');
			}).catch((e) => {console.error(e); ctx.reply('I cannot :/');});
		} else {
			ctx.reply('Нимагуу. You can make quieter');
		}
	}).catch(e =>{console.error(e); ctx.reply('Нимагуу');});
})
app.hears(/^(?:(сделай\s+)?(по)?тише|make(\s+(sound|music))?\s+quieter)/i, (ctx) => {
	typing(ctx);
	exec('v=$(get-vol); vol $(node -p "$v - 10") quieter').then((stdout) => {
		ctx.reply(`ok, vol decreased`);
	}).catch(e =>{console.error(e); ctx.reply('Нимагуу');});
});
app.hears(/^(?:(сделай\s+)?(по)?громче|make(\s+(sound|music))?\s+louder)/i, (ctx) => {
	typing(ctx);
	exec('v=$(get-vol); vol $(node -p "$v + 10") quieter').then((stdout) => {
		ctx.reply(`ok, vol insreased`);
	}).catch(e =>{console.error(e); ctx.reply('Нимагуу');});
});
app.hears(/^(?:(?:(?:сы|и)грай|воспроизведи|play)\s+((?:.|\n)+))/i, (ctx) => {
	console.log(ctx.match[1].trim());
	ctx.reply('ok, I`ll try')
	exec(`mplayer "${ ctx.match[1].trim() }"`).then((stdout) => {
	}).catch((e) => {
		console.error(e);
		ctx.reply('нишмаглаа');
	});
});

/*
 misc
*/

app.hears(/^(?:(?:какая\s+)?погода|что\s+с\s+погодой\??|что\s+обещают\??|что\s+с\s+погодой\??|(?:(?:(?:say|get|read)\s+)?(?:a\s+)?weather))/i, (ctx) => {
	Promise.all([
		ctx.reply('10 sec, please… 😅'),
		typing(ctx),
		exec(`get-weather`).then(res => JSON.parse(res)),
	])
	.then(([repCtx, _, weather]) => {
		console.log(repCtx, weather)
		const txt = weather.description && weather.temp && `Погода в ближайшее время: ${ weather.description }, ${ Math.floor(weather.temp) } градусов`;
		edit(repCtx, txt || 'нишмагла');
		weather.icon && app.telegram.sendPhoto(ctx.chat.id, `http://openweathermap.org/img/w/${ weather.icon }.png`, {disable_notification: true});
		return [txt, weather];
	})
	.then(([txt]) => ((new Date()).getHours() >= 9) && say(txt, ctx, true, true))
	.catch(e => {console.error(e); ctx.reply('нишмагла');});
});

//app.on('sticker', (ctx) => ctx.reply(''))
app.command('start', (props) => {
  const { from, reply } = props;
  console.log('start', from, props)
  return reply('Welcome!')
})
app.hears(/^hi$/i, (ctx) => ctx.reply('Hey there!'))

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

app.hears(/^(?:повтори|((и|повтори)\s+)?ещё(\s+раз)?|(one\s+more\s+time|more|repeat)(,\s+please)?)$/i, (ctx) => {
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
	console.log(ctx.from)
	if(!isVoiceVerboseMode) return;
	const name = ctx.update.message.from.first_name;
	say(`говорит ${ homemates.get(name, 'name') || name }: ${ ctx.match.input }`, ctx, true);
});

const startHomematesPresensePolling = () => {
	setInterval(reportHomematesPresenseChange, 1000 * 60 * 1);
};

const reportHomematesPresenseChange = async () => {
	if ((new Date()).getHours() < 9) return;
	console.log('poll homemates presense');
	const diff = await getHomematesPresenseChange();
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


app.startPolling();
startHomematesPresensePolling();
