module.exports = ({ app, config }) => ({
  edit:               (repCtx, txt) => app.telegram.editMessageText(repCtx.chat.id, repCtx.message_id, null, txt),
  del:                (repCtx) => app.telegram.deleteMessage(repCtx.chat.id, repCtx.message_id),
  typing:             (ctx) => app.telegram.sendChatAction(ctx.chat.id, 'typing').catch(e => console.error('e', e)),
  sendMsg:            (chatId, msg) => app.telegram.sendMessage(chatId, msg),
  sendMsgDefaultChat: (msg) => app.telegram.sendMessage(config.signals.sources.telegram.chats.default, msg),
  sendMsgStderrChat:  (msg) => {
    console.info(config.signals.sources.telegram.chats, config)
    app.telegram.sendMessage(config.signals.sources.telegram.chats.stderr, msg)
  },
})
