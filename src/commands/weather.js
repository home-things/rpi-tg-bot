module.exports = ({ utils: { exec, say }, config: { weather } }) => ({
  forecast: {
    wait: '10 sec, please… 😅',
    fn: async (ctx) => {
      const res = await exec(`get-weather`);
      const weather = await JSON.parse(res);

      const temp = Math.floor(weather.temp);
      const units = inflect(temp, { one: 'градус', some: 'градуса', many: 'градусов' });
      const txt = weather.description && weather.temp && `Погода в ближайшее время: ${weather.description}, ${temp} ${units}`;
      ctx.reply(txt || 'нишмагла');

      //weather.icon && app.telegram.sendPhoto(ctx.chat.id, `http://openweathermap.org/img/w/${ weather.icon }.png`, {disable_notification: true});
      //const url = `http://tg-bot-web.invntrm.ru/weathericons/${ weather.icon }.svg`;
      //weather.icon && app.telegram.sendPhoto(ctx.chat.id, url, {disable_notification: true});

      if ((new Date()).getHours() >= 9) say(txt, ctx, true, true);
    },
    phrases: [
      'погода', 'что с погодой', 'что там с погодой', 'прогноз погоды', 'будет дождь', 'будет ли дождь',
      'что обещают',
      'weather', 'get weather', 'weather forecast', 'forecast',
    ],
    command: 'weath'
  },
});