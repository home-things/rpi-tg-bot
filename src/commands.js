const bindAll = require('lodash.bindall')

const { randFromList, join } = require('./common')

module.exports = ({
  list,
  getOkIcon,
  UserError,
  consts,
  homeCmd,
  del, typing, sendMsgDefaultChat, sendMsgStderrChat,
}) => bindAll({
  i18nWaitMsgs: {
    wait_msg:      'Ok, wait, please…',
    long_wait_msg: '10 sec, please… 😅',
  },

  async run (kind, name, ctx, args = []) {
    const args_ = this._retreiveArgs(ctx, args)

    try {
      if (!ctx.isSystem && !this._accessRightsGuard(ctx.update || ctx.callback_query)) {
        throw this.NoRightsError()
      }

      const { waitMsg, cmd, okMsg } = this._retreiveCmd(ctx, kind, name)

      console.info(this._buildTitle({ kind, name, args: args_ }))
      // lastCommand.set(cmd)

      const res = await this._runWithWaiter(waitMsg, ctx, () => cmd(ctx, args_))

      const okMsg_ = this._noFalse(res && res.okMsg, okMsg)
      const fallbackOk = randFromList(['done', 'ok'])

      const resMsg = res && res.resMsg

      if (resMsg) ctx.reply(resMsg)
      if (!ctx.isSystem && !resMsg && okMsg_ !== false) {
        ctx.reply(`${ getOkIcon() } ${ okMsg_ || fallbackOk }`, { disable_notification: true })
      }
    } catch (e) {
      this._createOnError({ ctx, cmd: { kind, name, args: args_ } })(e)
    }
  },

  runSys (kind, name, args = []) {
    const ctx = {
      isSystem: true,
      chat:     { id: consts.DEFAULT_CHAT_ID },
      reply:    msg => sendMsgDefaultChat(msg),
    }
    return this.run(kind, name, ctx, args)
  },

  _retreiveCmd (ctx, kind, name) {
    const cmd = list[kind][name]
    if (!cmd) throw new UserError('no_cmd. No such command')

    return this._normalizeCmd(cmd)
  },

  _retreiveArgs (ctx, args) {
    return [].concat(args).concat(ctx.match && ctx.match.slice(1))
  },

  _normalizeCmd (rawCmd) {
    const [waitMsg, cmd, okMsg] = Array.isArray(rawCmd) ? rawCmd : [null, rawCmd, null]
    return { waitMsg, cmd, okMsg }
  },

  async _runWithWaiter (waitMsg, ctx, cb) {
    const waitMsg_ = typeof waitMsg === 'string' ? this.i18nWaitMsgs[waitMsg] : waitMsg
    if (waitMsg_ && !ctx.isSystem) {
      const [repCtx, res] = await Promise.all([
        ctx.reply(waitMsg_, { disable_notification: waitMsg !== 'long_wait_msg' }),
        cb(),
      ])
      del(repCtx)
      return res
    }
    typing(ctx)
    return await cb()
  },

  _accessRightsGuard ({ message }) {
    if (!message) return true
    const { chat: { id }, from: { id: userId } } = message
    const hasAccess = consts.permittedChats.includes(id) || homeCmd.isMember(userId)
    return hasAccess
  },

  NoRightsError () {
    return new UserError('acl_deny. Не можешь повелевать Ботом ты')
  },

  _createOnError ({ ctx, cmd: { kind, name, args } } = {}) {
    return (e) => {
      const isUserSourceError = e instanceof UserError
      const uniqId = e.uniqId || `${ Date.now() }.${ Math.floor(Math.random() * (2 ** 16)) }` // ts{ms}.rand{2^16}
      const techTargetText = isUserSourceError && e.orig ? e.orig.stack : e.stack
      const techTargetTitle = this._buildTitle({ kind, name, args })
      const techTargetError = join(techTargetTitle, ` -> error:\n${ techTargetText }`, `\n(err# ${ uniqId })`)

      const userTargetText = e.message + (e.orig ? `\n\n${ e.orig.message }` : '')
      const techSourceUserTargetText = randFromList(['нишмаглаа', 'Нимагуу', 'fail', 'error', 'да, ё моё :('])
      const userTargetError = `${ isUserSourceError ? userTargetText : techSourceUserTargetText }\n(err# ${ uniqId })`

      console.error(techTargetError)

      const icon = isUserSourceError ? '🤖👎' : randFromList(['🔴', '❌', '🧟‍♂️', '🤷‍♂️', '🙊', '🐛', '🌚'])
      if (ctx && !ctx.isSystem) ctx.reply(`${ icon } ${ userTargetError }`)

      sendMsgStderrChat(`${ icon } ${ techTargetError }`)
    }
  },

  _buildTitle ({ kind, name, args = [] }) {
    return `${ kind }::${ name }(${ args.map(arg => JSON.stringify(arg)).join(', ') })`
  },

  _noFalse (...values) {
    if (values.some((value) => value === false)) return false
    return values.reduce((res, val) => res || val)
  },

})

// const lastCommand =
// module.exports.lastCommand =
// bindAll({
//   _command: null,
//   type:     null,
//   set (type, command) {
//     this.type = type
//     this._command = command
//   },
//   has () {
//     return this._command
//   },
//   repeat () {
//     if (!this.has()) {
//       console.error('hm, there is not command')
//       return
//     }
//     this._command(...this._args)
//   },
// })
