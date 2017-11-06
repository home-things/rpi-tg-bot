const { whoAtHome } = require('../plugins/homemates');

module.exports = ({ utils: { getRandList }, config: { home } }) => ({
  presense: {
    wait: '10 sec, please… 😅',
    fn: ({ reply }) => {
      const { homemates } = home.data;
      return whoAtHome()
        .then((json) => {
          const name = key => homemates.get(key, 'name');
          const here = () => getRandList(['дома ', 'тута', 'где-то здесь']);
          const outside = () => getRandList(['не дома', 'отсутствует', 'шляется']);
          const outside_ = key => key === 'lenya' ? getRandList(['— по бабам', '— опять по бабам']) : outside(key);
          const getStatus = key => json[key]
            ? `✅ ${ name(key) } ${ here(key) }`
            : `🔴 ${ name(key) } ${ outside_(key) }`;
          const txt = Object.keys(homemates.list).map(key => getStatus(key)).join('\n');
          return reply(txt, { disable_notification: true });
        });
    },
  },
});
