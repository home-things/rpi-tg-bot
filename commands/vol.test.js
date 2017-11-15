// TODO: use jest

const test = require('ava')
require('../src/common').exec = console.log
const volCmd = require('./vol')()
const Vol = require('./vol')

test.beforeEach(t => {
  // t.context._checkVolumeLimit = Vol.checkVolumeLimit; Vol.checkVolumeLimit = () => true
  t.context._get = volCmd.get; volCmd.get = () => 80
})

test.afterEach(t => {
  // Vol.checkVolumeLimit = t.context._checkVolumeLimit
  volCmd.get = t.context._get
})

test('isVolumeCorrect', t => {
  t.true(Vol.isVolumeCorrect(90))
  t.true(Vol.isVolumeCorrect(100))
  t.false(Vol.isVolumeCorrect(101))
  t.false(Vol.isVolumeCorrect(59))
  t.true(Vol.isVolumeCorrect('60'))
})

test('checkVolumeIntent', t => {
  t.true(Vol.checkVolumeIntent(90,  90 +10, 'up'))
  t.true(Vol.checkVolumeIntent(90, 90 +11, 'up'))
  t.false(Vol.checkVolumeIntent(90, 90 -10, 'up'))

  t.true(Vol.checkVolumeIntent(90,  90 -10, 'down'))
  t.true(Vol.checkVolumeIntent(90, 90 -11, 'down'))
  t.false(Vol.checkVolumeIntent(90, 90 +10, 'down'))
})

test('set', async t => {
  await t.notThrows(volCmd.set(70))
})

test('delta +10', async t => {
  await t.notThrows(volCmd.delta(+10))
})
test('delta -10', async t => {
  await t.notThrows(volCmd.delta(-10))
})
test('delta -110', async t => {
  await t.throws(volCmd.delta(-110))
})
test('delta +110', async t => {
  await t.throws(volCmd.delta(+110))
})
