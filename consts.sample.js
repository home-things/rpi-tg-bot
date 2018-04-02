module.exports = (config) => {
  const ANS_EXP = 8 // s
  const INTRO_DELAY = 20 // s
  const HOME_DIFF_DELAY = 60 * 30 // s
  const DEFAULT_CHAT_ID = config && config.signals.sources.telegram.chats.default
  const STDERR_ID = config && config.signals.sources.telegram.chats.stderr
  const permittedChats = [-204486920, DEFAULT_CHAT_ID]

  return {
    ANS_EXP, // s
    INTRO_DELAY, // s
    HOME_DIFF_DELAY, // s
    DEFAULT_CHAT_ID,
    STDERR_ID,
    permittedChats,
  }
}
