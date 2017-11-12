module.exports = ({ utils: { exec }, config: { music } }) => ({
  action: {
    wait: true,
    fn: ({ reply }, args) => {
      return exec('has-music').then((hasMusic) => {
        if (hasMusic) {
          return exec(`${ args[0] }-music`).then((stdout) => {
            return reply(`ok, music ${ args[0] }ed`);
          });
        }
        return reply('Нимагуу. You can make quieter');
      });
    },
  },
});
