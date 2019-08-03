#!/usr/bin/env node

'use strict'
const ss = require('json-stringify-safe')
const fs = require('fs')
const isStringOrNumber = (o) => o &&
  Object.prototype.toString.call(o) === '[object String]' ||
  !isNaN(parseInt(o, 10))
const excludeKeysReplacer = (keys) => (key, value) =>
  keys.includes(key) ? undefined : value
// unfortunately json-stringify-safe doesn't allow you to pass an array
// as replacer. so we have to create our own replacer to mimic the default
// JSON.stringify() replacer behavior.
const includeKeysReplacer = (keys) => (key, value) =>
  keys.includes(key) || key === '' ? value : undefined
class Log {
  constructor(options) {
    options = options || {}
    this.out = process.stdout
    this.level = 'off'
    this.replacer = null
    // replacerArrayExcludes = true causes the replacer (when it's an
    // array) to work the opposite of the normal JSON.stringify().
    // instead of including keys in the array, we exclude the keys in
    // the array.
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
    this.replacerArrayExcludes = true
    this.space = null
    this.delimiter = '\n'
    this.levels = {
      trace: 0,
      debug: 1,
      info: 2,
      warn: 3,
      error: 4,
      fatal: 5,
      off: 6
    }
    this.logLevelFile = null
    this.logLevelPollSeconds = 10
    Object.assign(this, options)
    for (const level of Object.keys(this.levels)) {
      this[level] = (o, replacer, space) => {
        if (this.levels[level] >= this.levels[this.level]) {
          o = {
            time: new Date().toISOString(),
            level,
            log: o
          }
          if (isStringOrNumber(replacer)) {
            space = replacer
            replacer = null
          }
          replacer = replacer || this.replacer
          if (Array.isArray(replacer)) {
            replacer = this.replacerArrayExcludes ?
              excludeKeysReplacer(replacer) :
              includeKeysReplacer(replacer.concat(['time', 'level', 'log']))
          }
          this.out.write(`${ss(
            o,
            replacer,
            space || this.space)}${this.delimiter}`)
        }
      }
    }
    if (this.logLevelFile) {
      let interval = 10000
      if (this.logLevelPollSeconds &&
        !isNaN(parseInt(this.logLevelPollSeconds, 10))) {
        interval = parseInt(this.logLevelPollSeconds, 10) * 1000
      }
      const readLogLevelFile = () => {
        fs.readFile(this.logLevelFile, 'utf8', (err, data) => {
          if (!err) {
            this.level = data.trim()
          }
        })
      }
      fs.watchFile(this.logLevelFile, {
        persistent: false,
        interval
      }, readLogLevelFile)
    }
  }
}
exports = module.exports = Log
if (require.main === module) {
  const se = require('serialize-error')
  const o = {
    name: 'freddy',
    address: {
      street: '1234 lane st',
      city: 'hereshey',
      st: 'PA',
      zip: '19293'
    },
    error: se(new Error('something bad happened')),
    nest: {
      really: {
        deep: {
          stuff: ['one', 2, 'three']
        }
      }
    }
  }
  o.circular = o
  const log = new Log({
    level: 'debug',
    logLevelFile: 'llf',
    replacerArrayExcludes: false
  })
  // setInterval(() => {
  log.error(o, ['name', 'address', 'zip'], 2)
  // }, 3000)
}
