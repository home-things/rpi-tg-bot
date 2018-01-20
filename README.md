# tg-rpi-smart-home-bot [![Build Status](https://travis-ci.org/a-x-/tg-rpi-smart-home-bot.svg?branch=master)](https://travis-ci.org/a-x-/tg-rpi-smart-home-bot)
🚧 [Alpha] tg+rpi smart-home bot that controls: light, sound, volume, homemates presense, voice (tts+asr)

| | |
| --- | --- |
| ![homemates presense](https://user-images.githubusercontent.com/6201068/28362747-53446658-6c86-11e7-9c1a-eb934ae44231.png) **homemates presense** | ![voice over](https://user-images.githubusercontent.com/6201068/28362755-59af9bac-6c86-11e7-9fa1-921e5f025de2.png) **voice over** |
| ![music & volume](https://user-images.githubusercontent.com/6201068/28362760-5e361d9a-6c86-11e7-887a-0c4b2a675e09.png) **music & volume** | ![light](https://user-images.githubusercontent.com/6201068/28362781-6d89c648-6c86-11e7-847d-bc4c5be0fac9.png) **light** |
| ![screen shot 2017-07-19 at 13 26 46](https://user-images.githubusercontent.com/6201068/28362820-a6ed78b2-6c86-11e7-8c66-f4a5aa143325.png) | |
| <img alt="homekit" src="https://user-images.githubusercontent.com/6201068/34981829-c515cc6a-fab9-11e7-8af9-8354ce0e212f.jpg" width="80%" /> | ![alfred](https://user-images.githubusercontent.com/6201068/28365373-fc7a4a8a-6c90-11e7-9d79-8b1775fa2f3d.jpg) **macos alfred** |


| | | |
| --- | --- | --- |
| ![photo](https://user-images.githubusercontent.com/6201068/28364002-6750729a-6c8b-11e7-9bf0-0cffdf9242b9.jpg) | ![img_0283](https://user-images.githubusercontent.com/6201068/30253637-dbe9d3aa-9691-11e7-93f2-0d25d15fe183.jpg) | ![img_1060](https://user-images.githubusercontent.com/6201068/30253658-27aeca98-9692-11e7-9b3c-01bc5d51aa36.jpg) |
| ![img_0289](https://user-images.githubusercontent.com/6201068/30253638-dbea0442-9691-11e7-95eb-0fbd032f7f0a.jpg) | ![img_0290](https://user-images.githubusercontent.com/6201068/30253640-dbeadbd8-9691-11e7-96c1-90863718b0d1.jpg) | ![img_0292](https://user-images.githubusercontent.com/6201068/30253636-dbe8d0fe-9691-11e7-988b-fd320f2d523a.jpg) |

## Hardware
* Any raspbery pi (I use Raspberry Pi Model B Rev 2 and Pi Rev 3)
* Light driver (I use very own one based on Reley(solid-state/thyristor omron-g3mb-202p))
* Sound system (I use external rpi sound card *[HIFIBERRY DAC+](https://www.hifiberry.com/shop/boards/hifiberry-dacplus-phone/)* and usual amp+speakers system *Edifier R980T*)

## Software
- meta: [rpi-bins] — primary-rpi:~/bin
- meta: [rpi-services] — primary-rpi:~/services holds sub repos
- 📱🎵 [shairport-sync] — nodejs airplay v1 server (syncronous multiroom music from iphone/mac)
- 🔈🎵 [snapcast] — Synchronous multi-room audio player (rpi self sourced music)
- 📱💡 [HAP-NodeJS] — nodejs homekit server (siri: `turn light on`)
- ⏰💨 @a-x- former [cron jobs] — download & play podcasts, random jokes, sound volume, light scenarios, etc.
- 🖲💡 @a-x-/[Alfred.app light control workflow](https://yadi.sk/d/lGhNefTz3RdZcD); look the screenshot above; [read more about Alfred](https://www.alfredapp.com)
* 🎵💨 @a-x-/[megapolist-podcast-crawler] — any podcast crawler & player
* 💡🌐 @a-x-/[stupid-light-server] — stupid light control http-server
* 💬⚙️ [tg] — telegram cli


## Architecture
_🚧 work in progress_
#### hosts
- `primary-rpi` aka `rpi2main` — bot, control-center, music source, sound system#1, jobs
- `secondary-rpi` aka `rpi3` aka `rpi-media` — torrents, large storage, LCD-display with fullhd, sound system#2


## Getting started

#### installation
[Documentation](https://github.com/a-x-/tg-rpi-smart-home-bot/wiki/Installation-everything-DRAFT)

#### launch
```sh
# forever process with logs
npm run start
```

#### scripts
```sh
npm run restart
npm run watch-logs
```

## Roadmap

#### architecture and refuctoring
* tests
   * [x] add some tests
   * [x] setup CI
   * [ ] fix CI
   * [ ] increase test coverage
* [x] split into modules
* [ ] create **Installer**
    * think about **Docker**
    * [draft](https://github.com/a-x-/tg-rpi-smart-home-bot/wiki/Installation-everything-DRAFT)
* [ ] write or use some **Platform**
  * with plugins, signals, commands, jobs, machines, sensors, configs, state-management, etc.
  * **state and signals** (actions)
    * universal rest api *signal* (action/event) adaptor
    * programming state maschine transitions via `tg`
    * think about **redux**
  * platform example: http://hobbyquaker.github.io/ccu.io


#### to code
* ifttt integrations
  * [ ] home presense
* [ ] ! mini-bank
* [ ] no-interactive actions debug_chat log
* [ ] run on any machine abstraction layer (rpi2, rpi3)
* [ ] **NLP** and rocket-science (natural lang processing) improve text command flexibility
  * [ ] `word2vec` for 1) command matching, 2) music search
  * [ ] `api.ai` for intent mining ()
  * [ ] repeat, undo, ask detaild commands
  * [ ] learnings new commands synonyms (— do magic — ... — I say to you, bot! — wow, do you mean 'switch magic on'?)
* [ ] ! reminders
* [ ] transcribing voice messages, interpret commands
  * get tg audio -> `asr voice.ogg 'audio/ogg;codecs=opus'`
* [ ] automatic problem diagnosis
* [ ] VAD+mics
* [ ] I18N
* [x] light control, scrpts
* [x] volume control, scrpts
* [x] sound control: play by url, pause/resume/stop, scrpts
* [x] voice over
* [x] basic weather
* [x] weather
  * [ ] (with icons and smart recommendations)
* [x] ACL (control rights)
* [x] `/commands` for usual cases
* [x] basic presense control
* [x] handle photos, voice-records, music, torrent-files and links
* [x] jokes
 * [x] jokes random schedule

#### todo: add hardware
* [ ] light toggle button
* [ ] tablet screen
* [ ] window blinds control (servo-drive)
* [ ] separate sound control
* [ ] voice control microphones
* [ ] presense sensors
* [ ] external light intensity (LUX) sensors
* [ ] advanced LEDs
  - dimmed fine mixed triple stripes 2700K, 4200K, 6400K
  - ceiling panels


[rpi-bins]: https://github.com/a-x-/rpi-bin
[rpi-services]: https://github.com/a-x-/rpi-services
[shairport-sync]: https://github.com/mikebrady/shairport-sync
[snapcast]: https://github.com/badaix/snapcast
[HAP-NodeJS]: https://github.com/a-x-/HAP-NodeJS
[cron jobs]: https://github.com/a-x-/tg-rpi-smart-home-bot/blob/master/src/jobs.js
[megapolist-podcast-crawler]: https://github.com/a-x-/megapolist-podcast-crawler
[stupid-light-server]: https://github.com/a-x-/stupid-light-server
[tg]: https://github.com/vysheng/tg.git


