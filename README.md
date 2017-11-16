# tg-rpi-smart-home-bot [![Build Status](https://travis-ci.org/a-x-/tg-rpi-smart-home-bot.svg?branch=master)](https://travis-ci.org/a-x-/tg-rpi-smart-home-bot)
🚧 [Alpha] tg+rpi smart-home bot that controls: light, sound, volume, homemates presense, voice (tts+asr)

| | |
| --- | --- |
| ![homemates presense](https://user-images.githubusercontent.com/6201068/28362747-53446658-6c86-11e7-9c1a-eb934ae44231.png) **homemates presense** | ![voice over](https://user-images.githubusercontent.com/6201068/28362755-59af9bac-6c86-11e7-9fa1-921e5f025de2.png) **voice over** |
| ![music & volume](https://user-images.githubusercontent.com/6201068/28362760-5e361d9a-6c86-11e7-887a-0c4b2a675e09.png) **music & volume** | ![light](https://user-images.githubusercontent.com/6201068/28362781-6d89c648-6c86-11e7-847d-bc4c5be0fac9.png) **light** |
| ![screen shot 2017-07-19 at 13 26 46](https://user-images.githubusercontent.com/6201068/28362820-a6ed78b2-6c86-11e7-8c66-f4a5aa143325.png) | |
| | ![alfred](https://user-images.githubusercontent.com/6201068/28365373-fc7a4a8a-6c90-11e7-9d79-8b1775fa2f3d.jpg) **macos alfred** |

| | | |
| --- | --- | --- |
| ![photo](https://user-images.githubusercontent.com/6201068/28364002-6750729a-6c8b-11e7-9bf0-0cffdf9242b9.jpg) | ![img_0283](https://user-images.githubusercontent.com/6201068/30253637-dbe9d3aa-9691-11e7-93f2-0d25d15fe183.jpg) | ![img_1060](https://user-images.githubusercontent.com/6201068/30253658-27aeca98-9692-11e7-9b3c-01bc5d51aa36.jpg) |
| ![img_0289](https://user-images.githubusercontent.com/6201068/30253638-dbea0442-9691-11e7-95eb-0fbd032f7f0a.jpg) | ![img_0290](https://user-images.githubusercontent.com/6201068/30253640-dbeadbd8-9691-11e7-96c1-90863718b0d1.jpg) | ![img_0292](https://user-images.githubusercontent.com/6201068/30253636-dbe8d0fe-9691-11e7-988b-fd320f2d523a.jpg) |

## hardware
* Any raspbery pi (I use Raspberry Pi Model B Rev 2)
* Any light controller (I use very own one based on Reley(solid-state/thyristor omron-g3mb-202p))
* Sound system (I use external rpi sound card *[HIFIBERRY DAC+](https://www.hifiberry.com/shop/boards/hifiberry-dacplus-phone/)* and usual amp+speakers system *Edifier R980T* and second linked sound system in another room)

## Getting started
*guide is not complete stil 🚧 work in progress…*
*todo: create installer*

```sh
# install all apt-get packages you need (todo: enumerate everything)
# ...

# install dotfiles
cd && git clone git@github.com:a-x-/.files.git dotfiles
./installer.sh # It did not tested on raspbian stil

# install bins
mkdir ~/bin && cd ~/bin
git clone git@github.com:a-x-/rpi-bin.git
npm i

# install tg-bot
mkdir ~/services && cd ~/services
git clone git@github.com:a-x-/tg-rpi-smart-home-bot.git tg-bot && cd tg-bot
npm i

# setup tg-bot
# ...

# setup some bins
# ...
```

[Bins Setup Draft Guide](https://github.com/a-x-/tg-rpi-smart-home-bot/wiki/Installation-everything-DRAFT)

#### launch
```sh
BOT_TOKEN=$(cat ~/.config/tg-bot.json | jq -r .BOT_TOKEN) forever start ~/services/tg-bot/index.js
```

## Roadmap

#### repositories to be merged
*todo: copy/port to this repo or add as subrepo, or include into installer*

* [ ] https://github.com/mikebrady/shairport-sync — nodejs airplay server (stream music from iphone)
* [ ] nodejs homekit server (siri: `turn light on`)
* [x] cron jobs & [bash scripts] (download & play podcasts, light scripts)
* [ ] alfred light control workflow
* [ ] https://github.com/a-x-/megapolist-podcast-crawler — any podcast crawler & player
* [ ] https://github.com/a-x-/stupid-light-server — stupid light control http-server
* [ ] https://github.com/vysheng/tg.git — telegram cli
  * [installation](https://gist.github.com/a-x-/2530f94f838f7fc910563786269ebe03)
* [ ] [bash scripts]: https://github.com/a-x-/rpi-bin

#### to code
* [ ] ! mini-bank
* [ ] no-interactive actions debug_chat log
* [ ] run on any machine abstraction layer (rpi2, rpi3)
* [ ] **platform**. integrate with - or write your own platform (e.g. http://hobbyquaker.github.io/ccu.io)
    * [ ] signals rest api
    * [ ] integrate netrowrk of a few RPIs
    * [ ] ...
* [ ] **NLP** and rocket-science (natural lang processing) improve text command flexibility
  * [ ] `word2vec` for 1) command matching, 2) music search
  * [ ] `api.ai` for intent mining ()
  * [ ] repeat, undo, ask detaild commands
  * [ ] learnings new commands synonyms (— do magic — ... — I say to you, bot! — wow, do you mean 'switch magic on'?)
* [ ] reminders
* [ ] **state and signals** (actions)
  * [ ] universal rest api *signal* (action/event) adaptor
  * [ ] programming state maschine transitions via `tg`
  * [ ] redux
* [x] light control, scrpts
* [x] volume control, scrpts
* [x] sound control: play by url, pause/resume/stop, scrpts
* [x] voice over
* [x] basic weather
* [x] weather
  * [ ] (with icons and smart things)
* [x] ACL (control rights)
* [x] `/commands` for usual cases
* [x] basic presense control
* [x] handle photos, voice-records, music, torrent-files and links
* [x] jokes
 * [x] jokes random schedule
* [ ] transcribing voice messages, interpret commands
  * get tg audio -> `asr voice.ogg 'audio/ogg;codecs=opus'`
* [ ] automatic problem diagnosis
* [ ] VAD+mics

#### todo: meta/refuctoring
* [ ] tests
* [ ] split into modules
* [ ] docker-based installer
    * [draft](https://github.com/a-x-/tg-rpi-smart-home-bot/wiki/Installation-everything-DRAFT)

#### todo: add hardware
* [ ] light toggle button
* [ ] tablet screen
* [ ] window blinds control (servo-drive)
* [ ] separate sound control
* [ ] microphones
* [ ] presense sensors
* [ ] external light intensity sensors
