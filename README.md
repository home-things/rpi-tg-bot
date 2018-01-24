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
- ⏰💨 @a-x-'s [former cron jobs] — (in js now) download & play podcasts, random jokes, sound volume, light scenarios, etc.
- 🖲💡 @a-x-'s [Alfred.app light control workflow](https://yadi.sk/d/lGhNefTz3RdZcD); look the screenshot above; [read more about Alfred](https://www.alfredapp.com)
- 🎵💨 @a-x-/[megapolist-podcast-crawler] — any podcast crawler & player
- 💡🌐 @a-x-/[stupid-light-server] — stupid light control http-server
- 💬⚙️ [tg] — telegram cli


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
[draft todos](https://github.com/a-x-/tg-rpi-smart-home-bot/wiki/vigvam-bot-todo-DRAFT)

#### architecture and refuctoring
* tests
   * [x] add some tests
   * [x] setup CI
   * [ ] _fix_ CI
   * [ ] increase test coverage
* [ ] более тесная интеграция с бота homekit
  * [ ] volume control
  * [ ] two-side mapping (sync everything instantly, pubsub)
* [x] split into modules
* [ ] create **Installer**
    * think about **Docker**
    * [draft](https://github.com/a-x-/tg-rpi-smart-home-bot/wiki/Installation-everything-DRAFT)
* [ ] write or use some **Platform**
  * with plugins, signals, commands, jobs, machines, sensors, configs, state-management, etc.
  * **state and signals** (actions)
    * universal rest/tg/in-app/app-api/sensor *signal* (action/event) adaptor
    * programming finite state maschine transitions via `tg`
    * think about **redux**
  * platform example: http://hobbyquaker.github.io/ccu.io


#### to code
* ifttt integrations
  * [ ] home presense
* [ ] ! mini-bank
* [ ] _wip_ [delivery club automation](https://github.com/a-x-/delivery-club-api)
* [ ] router integration (remote restart, lan dns mngmnt)
  * openwrt https://gist.github.com/boube/7a4ca061fd3f29d940ee
  * http://help-wifi.com/tp-link/nastrojka-routera-tp-link-v-rezhime-mosta-wds-soedinyaem-dva-routera-po-wi-fi/
* [ ] no-interactive actions debug_chat log
* [ ] run on any machine abstraction layer (rpi2, rpi3)
* [ ] *#rock-sci* **NLP** (natural lang processing) improve text command flexibility
  * [ ] [word2vec], `levinshtain` for 1) command matching, 2) music search
  * [ ] `api.ai` for intent mining
  * [ ] `RandomForest` (that better than CatBoosk) for **ML** classification
  * [ ] `xgboost` for simple general purpose ML
  * _wip_ music genres pleer.net
  * [ ] repeat, undo, ask detaild commands
  * [ ] learnings new commands synonyms (— do magic — ... — I say to you, bot! — wow, do you mean 'switch magic on'?)
* [ ] ! reminders
* [ ] transcribing voice messages, interpret commands
  * get tg audio -> `asr voice.ogg 'audio/ogg;codecs=opus'`
* [ ] automatic problem diagnosis
  * *#rock-sci* CBR case-based reasoning aka copy-pasete development aka stackoverflow/google development
* [ ] VAD+mics
  * think about **amazon alexa** with its skills integration
* [ ] I18N
* [ ] _fix_ HomeKit external data updating https://github.com/KhaosT/HAP-NodeJS/issues/497
* [x] light control, scrpts
* [x] volume control, scrpts
* [x] sound control: play by url, pause/resume/stop, scrpts
* [x] voice over
* [x] basic weather
* [x] weather
  * [ ] (with icons and smart recommendations)
* AAA aka **Authorization**
  * [x] telegram nicknames whitelist
  * [ ] granular ACL
  * [ ] auth command (add name, role, ifttt, mac/ip/hostname)
* [x] `/commands` for usual cases
* [x] basic presense control
  * [x] over wi-wi mac addr based
  * [ ] ifttt geolocation webhooks
  * [ ] presense/movement sensors
  * [alternative solution I dislike](https://github.com/initialstate/pi-sensor-free-presence-detector/wiki/Part-2.-Your-Personal-Dashboard)
* [x] handle photos, voice-records, music, torrent-files and links
* [x] jokes
  * [x] jokes random schedule
* [ ] Data sequences streams, data series db
  * viewer: Initial State Platform

#### todo: add hardware
* [ ] light toggle button
* [ ] tablet screen
* [ ] window blinds control (servo-drive)
* [ ] separate sound control
* [ ] voice control microphones
* [ ] presense sensors
* [ ] external light intensity (LUX) sensors
* [ ] advanced LEDs
  - dimmed fine mixed triple stripes [2700K, 4200K, 6400K](https://user-images.githubusercontent.com/6201068/35187670-8f2279c8-fe38-11e7-9e22-234ede179ef3.png)
  - ceiling panels
  - Philips HUE lamps (itsnt my choise)
  - Xiaomi smart lamps

## Alternative solutions
#### [Gladys](https://github.com/GladysProject/Gladys)
- pros
    - life-style selling promo description 
    - community, much plugins
    - simple installation
    - **NFC** scenarios
    - sensors integration. [list](https://gladysproject.com/en/compatibilities/)
    - ML, voice-activation, telegram something. [read more](https://gladysproject.com/en/installation/talking-to-gladys/)
    - good ux/ui
- cons
    - frontend gui centric 
    - not a telegram first sitizen
    - SQL
    - everything is js?
    - no homekit, airplay intergation? 

#### [home-assistant](https://github.com/home-assistant/home-assistant) (python3)
- cons
    - python





[rpi-bins]: https://github.com/a-x-/rpi-bin
[rpi-services]: https://github.com/a-x-/rpi-services
[shairport-sync]: https://github.com/mikebrady/shairport-sync
[snapcast]: https://github.com/badaix/snapcast
[HAP-NodeJS]: https://github.com/a-x-/HAP-NodeJS
[former cron jobs]: https://github.com/a-x-/tg-rpi-smart-home-bot/blob/master/src/jobs.js
[megapolist-podcast-crawler]: https://github.com/a-x-/megapolist-podcast-crawler
[stupid-light-server]: https://github.com/a-x-/stupid-light-server
[tg]: https://github.com/vysheng/tg.git
[word2vec]: https://github.com/Planeshifter/node-word2vec

