const { exec } = require('../src/common')

module.exports = () => ({
  airplay () {
    // TODO: use machine network abstraction layer
    return Promise.all([
      exec('sudo systemctl restart shairport-sync'), // rpi2 (self)
      // exec('ssh pi@rpi3 sudo systemctl restart shairport-sync'), // rpi3
    ])
  },

  rpi3 () {
    return exec('sudo reboot').catch(e => {
      // If reboot had started then Connection closed. Else pass the error
      if (!/Connection to (.+) closed/.test(e.message)) throw e
    })
  },
})
