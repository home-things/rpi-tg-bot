const { exec } = require('../src/common')

module.exports = () => ({
  airplay () {
    // TODO: use machine network abstraction layer
    return Promise.all([
      exec('sudo systemctl restart shairport-sync'), // rpi2 (self)
      exec('ssh pi@rpi3 sudo systemctl restart shairport-sync'), // rpi3
    ])
  },
})
