module.exports = ({ utils: { exec, say }, config: { voice } }) => ({
  voice_over: {
    fn: ({ reply }) => {
      isVoiceVerboseMode = true;
      return reply('ok, I`ll say everything you post', { disable_notification: true })
    }
  },

  voice_over_stop: {
    fn: ({ reply }) => {
      isVoiceVerboseMode = false;
      return reply('ok, I`ll be quiet', { disable_notification: true })
    },
  },

  say: {
    wait: true,
    fn: (ctx, args) => {
      return say(args[0], ctx);
    },
  },
});