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
  async run (kind, name, ctx, args = []) {
    const args_ = this._retreiveArgs(ctx, args)

    try {
      const cmd = this._retreiveCmd(ctx, kind, name)
      const { waitMsg_, cmd_, okMsg_ } = this._normalizeCmd(cmd)

      console.info(this._buildTitle({ kind, name, args: args_ }))
      lastCommand.set(cmd_)

      const res = await this._runWithWaiter(waitMsg_, ctx, () => cmd_(ctx, args_))

      const okMsg__ = res && res.okMsg || okMsg_ || randFromList(['done', 'ok'])
      const resMsg = res && res.resMsg
      resMsg && ctx.reply(resMsg)
      if (!ctx.isSystem && !resMsg) {
        ctx.reply(getOkIcon() + ' ' + okMsg__, { 'disable_notification': true })
      }

    } catch (e) {
      this._createOnError({ ctx, cmd: { kind, name, args: args_ }})(e)
    }
  },

  runSys (kind, name, args = []) {
    const ctx = {
      isSystem: true,
      chat: { id: consts.VIGVAM_ID },
      reply: msg => sendMsgDefaultChat(msg),
    }
    return this.run(kind, name, ctx, args)
  },

  _retreiveCmd (ctx, kind, name) {
    const data = ctx.update || ctx.callback_query
    if (!ctx.isSystem && data.message && !this._accessRightsGuard(data.message.chat.id, data.message.from.id)) return

    const cmd = list[kind][name]
    if (!cmd) throw new UserError('no_cmd. No such command')

    return cmd
  },

  _retreiveArgs (ctx, args) {
    return [].concat(args).concat(ctx.match && ctx.match.slice(1))
  },

  _normalizeCmd (cmd) {
    const [waitMsg_, cmd_, okMsg_] = Array.isArray(cmd) ? cmd : [null, cmd, null]
    return { waitMsg_, cmd_, okMsg_ }
  },

  async _runWithWaiter (waitMsg, ctx, cb) {
    const waitMsg_ = typeof waitMsg === 'string' && {
      'wait_msg': 'Ok, wait, please…',
      'long_wait_msg': '10 sec, please… 😅'
    }[waitMsg] || waitMsg

    if (waitMsg_ && !ctx.isSystem) {
      const [repCtx, res] = await Promise.all([
        ctx.reply(waitMsg_, { 'disable_notification': waitMsg !== 'long_wait_msg' }),
        cb(),
      ])
      del(repCtx)
      return res
    } else {
      typing(ctx)
      return await cb()
    }
  },

  _accessRightsGuard (id, userId, cmd) {
    const hasAccess = consts.permittedChats.includes(id) || homeCmd.isMember(userId)
    if (!hasAccess) {
      throw new UserError('acl_deny. Не можешь повелевать Ботом ты')
    }
    return hasAccess
  },

  _createOnError ({ ctx, cmd: { kind, name, args } } = {}) {
    return (e) => {
      const isUserSourceError = e instanceof UserError
      const uniqId = e.uniqId || `${ + new Date() }.${ Math.floor(Math.random() * Math.pow(2, 16)) }` // ts{ms}.rand{2^16}
      const techTargetText = isUserSourceError && e.orig ? e.orig.stack : e.stack
      const techTargetTitle = this._buildTitle({ kind, name, args })
      const techTargetError = join(techTargetTitle, ` -> error:\n${ techTargetText }`, `\n(err# ${ uniqId })`)

      const userTargetText = e.message + (e.orig ? '\n\n' + e.orig.message : '')
      const techSourceUserTargetText = randFromList(['нишмаглаа', 'Нимагуу', 'fail', 'error', 'да, ё моё :('])
      const userTargetError = `${ isUserSourceError ? userTargetText : techSourceUserTargetText }\n(err# ${ uniqId })`

      console.error(techTargetError)

      const icon = isUserSourceError ? '🤖👎' : randFromList(['🔴', '❌', '🧟‍♂️', '🤷‍♂️', '🙊', '🐛', '🌚'])
      if (ctx && !ctx.isSystem) ctx.reply(icon + ' ' + userTargetError)

      sendMsgStderrChat(icon + ' ' + techTargetError)
    }
  },

  _buildTitle ({ kind, name, args = [] }) {
    return `${ kind }::${ name }(${ args.map(arg=>JSON.stringify(arg)).join(', ') })`
  }
})

const lastCommand =
module.exports.lastCommand =
bindAll({
  _command: null,
  type: null,
  set (type, command) {
    this.type = type
    this._command = command
  },
  has () {
    return this._command
  },
  repeat () {
    if (!this.has()) {
      console.error('hm, there is not command')
      return
    }
    this._command(...this._args)
  },
})
