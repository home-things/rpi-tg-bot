# tg-rpi-smart-home-bot [![Build Status](https://travis-ci.org/a-x-/tg-rpi-smart-home-bot.svg?branch=master)](https://travis-ci.org/a-x-/tg-rpi-smart-home-bot)
🚧 [Alpha] tg+rpi smart-home bot that controls: light, sound, volume, homemates presense, voice (tts+asr)

| | |
| --- | --- |
| ![homemates presense](https://user-images.githubusercontent.com/6201068/28362747-53446658-6c86-11e7-9c1a-eb934ae44231.png) **homemates presense** | ![voice over](https://user-images.githubusercontent.com/6201068/28362755-59af9bac-6c86-11e7-9fa1-921e5f025de2.png) **voice over** |
| ![music & volume](https://user-images.githubusercontent.com/6201068/28362760-5e361d9a-6c86-11e7-887a-0c4b2a675e09.png) **music & volume** | ![light](https://user-images.githubusercontent.com/6201068/28362781-6d89c648-6c86-11e7-847d-bc4c5be0fac9.png) **light** |
| ![screen shot 2017-07-19 at 13 26 46](https://user-images.githubusercontent.com/6201068/28362820-a6ed78b2-6c86-11e7-8c66-f4a5aa143325.png) | |
| | ![alfred](https://user-images.githubusercontent.com/6201068/28365373-fc7a4a8a-6c90-11e7-9d79-8b1775fa2f3d.jpg) **macos alfred** |

![photo](https://user-images.githubusercontent.com/6201068/28364002-6750729a-6c8b-11e7-9bf0-0cffdf9242b9.jpg) 

## hardware
* Any raspbery pi (I use Raspberry Pi Model B Rev 2)
* Any light controller (I use very own one based on Reley(solid-state/thyristor omron-g3mb-202p))
* Sound system (I use external rpi sound card *[HIFIBERRY DAC+](https://www.hifiberry.com/shop/boards/hifiberry-dacplus-phone/)* and usual amp+speakers system *Edifier R980T* and second linked sound system in another room)

## todo

#### to copy/port to this repo

* nodejs airplay server (stream music from iphone)
* nodejs homekit server (siri: `turn light on`)
* cron jobs & bash scripts (download & play podcasts, light scripts)
* alfred workflow

#### to write
* [x] light control, scrpts
* [x] volume control, scrpts
* [x] sound control: play by url, pause/resume/stop, scrpts
* [x] voice over
* [x] basic weather
* [ ] `word2vec` for 1) command matching, 2) music search
* [ ] `api.ai` for intent mining
* [ ] split into modules
* [ ] repeat, undo, ask detaild commands
* [ ] learnings new commands synonyms (— do magic — ... — I say to you, bot! — wow, do you mean 'switch magic on'?)
* [ ] weather (with icons)
* [ ] jokes
* [ ] reminders
* [ ] programming state maschine transitions via `tg`
* [ ] transcribing voice messages, interpret commands
  * get tg audio -> `asr voice.ogg 'audio/ogg;codecs=opus'`
* [ ] auto problem diagnosis
* [ ] VAD+mics
* [ ] integrate with - or write your own platform (e.g. http://hobbyquaker.github.io/ccu.io)
* [x] ACL (control rights)
* [ ] `/commands` for usual cases

#### hardware
* [ ] light toggle button
* [ ] tablet screen
* [ ] window blinds control (servo-drive)
* [ ] separate sound control
* [ ] microphones
* [ ] presense sensors
* [ ] external light intensity sensors
