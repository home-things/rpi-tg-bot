const { exec } = require('../src/common')

const getLightStatus = () => exec('gpio -1 read 22').then(l => parseInt(l, 10));

module.exports.getLightStatus = getLightStatus
