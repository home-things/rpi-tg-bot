module.exports = ({ utils: { exec }, config: { light } }) => ({
  on: {
    fn: async ({ reply }) => {
      await exec('light on');
      reply('ok');
    },
    phrases: [
      'turn light on', 'light on', 'switch light on',
      'включи свет', 'зажги свет', 'вруби свет',
    ],
    command: 'light_on',
  },

  off: {
    fn: async ({ reply }) => {
      await exec('light off');
      reply('ok');
    },
    phrases: [
      'turn light off', 'light off', 'switch light off',
      'выключи свет', 'погаси свет', 'выруби свет',
    ],
    command: 'light_off',
  },

  status: {
    fn: async ({ reply }) => {
      const status = await getLightStatus();
      reply(`ok: ${(status ? '🌖 on' : '🌘 off')}`);
    },
    phrases: [],
    command: 'light_status',
  },
});