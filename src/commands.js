const bindAll = require('lodash.bindall')

const { randFromList, join, setAsyncInterval } = require('./common')

const SEC = 1000
const MIN = SEC * 60
const HOUR = MIN * 60

const WAIT = Object.freeze({
  LONG:  Symbol('commands.wait.long'),
  SHORT: Symbol('commands.wait.short'),
})

module.exports = ({
  list,
  getOkIcon,
  UserError,
  consts,
  homeCmd,
  del, typing, edit, sendMsgDefaultChat, sendMsgStderrChat,
}) => bindAll({
  i18nWaitMsgs: new Map(Object.entries({
    [WAIT.SHORT]: 'Ok, wait, please…',
    [WAIT.LONG]:  '10 sec, please… 😅',
  })),

  async run (kind, name, ctx, _args = []) {
    const args = this._retreiveArgs(ctx, _args)

    try {
      const cmdObj = (() => {
        const cmdObj = this._retreiveCmd(ctx, kind, name)
        const { waitMsg, fn, okMsg, live } = this._normalizeCmd(cmdObj)
        return { waitMsg, fn, okMsg, live }
      })();

      console.info(this._buildTitle({ kind, name, args }))
      // lastCommand.set(cmdObj.fn)

      const res = await this._runWithWaiter(cmdObj.waitMsg, ctx, () => cmdObj.fn(ctx, args))

      if (res.noMsg) return

      const okMsg = (res && res.okMsg) || cmdObj.okMsg || randFromList(['done', 'ok'])

      const resMsg = (res && res.resMsg)

      if (resMsg) {
        if (cmdObj.live) this.makeLive(ctx, () => resMsg)
        else ctx.reply(resMsg)
      }
      if (!ctx.isSystem && !resMsg) {
        ctx.reply(`${ getOkIcon() } ${ okMsg }`, { disable_notification: true })
      }
    } catch (e) {
      this._createOnError({ ctx, cmd: { kind, name, args } })(e)
    }
  },

  async makeLive ({ reply }, fn, { interval = MIN, ttl = HOUR, delay = 3 * SEC }) {
    // Send torrents progress status
    setTimeout(async () => {
      const repCtx = await reply(await fn())

      // update torrents progress status message every 5 second
      const editNotify = async () => await edit(repCtx, await fn())
      const cycle = setAsyncInterval(editNotify, interval)
      setTimeout(() => cycle.stop(), ttl)
    }, delay)
  },

  runSys (kind, name, args = []) {
    const ctx = {
      isSystem: true,
      chat:     { id: consts.VIGVAM_ID },
      reply:    msg => sendMsgDefaultChat(msg),
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

  _normalizeCmd (cmdObj) {
    return {
      live:    cmdObj.live,
      waitMsg: cmdObj.wait,
      fn:      cmdObj.cmd,
      okMsg:   cmdObj.ok,
    }
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

  _accessRightsGuard (id, userId/* , cmd */) {
    const hasAccess = consts.permittedChats.includes(id) || homeCmd.isMember(userId)
    if (!hasAccess) {
      throw new UserError('acl_deny. Не можешь повелевать Ботом ты')
    }
    return hasAccess
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

module.exports.WAIT = WAIT
