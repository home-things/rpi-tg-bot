const { exec } = require('../src/common')

module.exports = () => ({
  on:     () => exec('light on'),
  off:    () => exec('light off'),
  status: () => exec('gpio -1 read 22').then(l => parseInt(l, 10)),
})
