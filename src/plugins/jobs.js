// cron

const { reportHomematesPresenseChange } = require('./homemates');
const cron = require('cron').CronJob;

const cronTasks = (strings) => {
  strings[0].split(/\n/)
    .map(line => line.trim())
    .filter(line => line)
    .forEach((task) => {
      const [s, m, h, dom, mon, dow, ...cmd] = task.split(/\s+/);
      cron([s, m, h, dom, mon, dow].join(' '), exec(cmd.join(' ')));
    });
};

/*
cronTasks`
00  1 *   *   *     light 0
30  9 *   *   *     light 1
00 12 *   *   *     light 0
30 21 *   *   *     light 1


30 09 *   *   *     vol  80 louder
00 10 *   *   *     vol  90 louder
30 10 *   *   *     vol 100 louder
00 23 *   *   *     vol  90 quieter
00  1 *   *   *     vol  80 quieter
00  2 *   *   *     vol  70 quieter


28  9 *   *   *     get-weather | jq '"Погода: \(.description), \(.temp | floor) градусов"' | tts
59 11 *   *   *     get-weather | jq '"Погода: \(.description), \(.temp | floor) градусов"' | tts
` */

// setInterval(reportHomematesPresenseChange, 1000 * 60 * 1);
