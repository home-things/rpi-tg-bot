module.exports = ({ utils: { exec, combo }, config: { vol } }) => ({
  action: {
    fn: async ({ reply }, args) => {
      const up = ['louder', 'up', '+', 'increase']
      const dx = up.includes(args[0].trim()) ? +1 : -1;
      const K = 10;
      const vol = await exec('get-vol');
      await exec(`vol ${+vol + K * dx} ${args[0]}`);
      reply(`ok, vol ${dx > 0 ? 'increased' : 'decreased'}`);
    },
    phrases: [
      {args: ['up'], list: [
        ...combo(['сделай', 'включи', 'поставь', ''], ['']),
        'сделай погромче', 'сделай громче', 'громче',
        'make louder', 'set louder', 'set volume louder', 'louder', 'volume up'
      ]},
      {args: ['down'], list: [
        'сделай потише', 'сделай тише', 'тише',
        'make quieter', 'set quieter', 'set volume quieter', 'quieter', 'volume up'
      ]},
    ],
  },
});