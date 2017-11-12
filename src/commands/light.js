const { getLightStatus } = require('../plugins/light');
const { command } = require('../index');

module.exports = ({ utils: { exec }, config: { light } }) => {
  return {
    on: command('light_on', [
      'turn light on', 'light on', 'switch light on',
      'включи свет', 'зажги свет', 'вруби свет',
    ])(async function on({ reply }) {
      await exec('light on');
      reply('ok');
    }),
    off() {
      console.error(this);
    },
    status() {
      console.error(this);
    },
  };
};

// module.exports = ({ utils: { exec }, config: { light } }) => ({
//   on: {
//     fn: async ({ reply }) => {
// await exec('light on');
// reply('ok');
//     },
//     phrases: [
//       'turn light on', 'light on', 'switch light on',
//       'включи свет', 'зажги свет', 'вруби свет',
//     ],
//     command: 'light_on',
//   },

//   off: {
//     fn: async ({ reply }) => {
//       await exec('light off');
//       reply('ok');
//     },
//     phrases: [
//       'turn light off', 'light off', 'switch light off',
//       'выключи свет', 'погаси свет', 'выруби свет',
//     ],
//     command: 'light_off',
//   },

//   status: {
//     fn: async ({ reply }) => {
//       const status = await getLightStatus();
//       reply(`ok: ${ (status ? '🌖 on' : '🌘 off') }`);
//     },
//     phrases: [],
//     command: 'light_status',
//   },
// });
