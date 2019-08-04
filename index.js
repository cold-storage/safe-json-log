#!/usr/bin/env node

'use strict'
const ss = require('json-stringify-safe')
const fs = require('fs')
const isStringOrNumber = (o) => o &&
  Object.prototype.toString.call(o) === '[object String]' ||
  !isNaN(parseInt(o, 10))
const multiReplacer = (replacers) => (key, value) => {
  let result
  for (const r of replacers) {
    if (r) {
      result = r(key, result || value)
      if (result === undefined) {
        return result
      }
    } else {
      result = result || value
    }
  }
  return result
}
const excludeReplacer = (keys) => (key, value) =>
  keys.includes(key) ? undefined : value
// json-stringify-safe doesn't allow replacer arrays so we have to
// create our own replacer to mimic the default JSON.stringify()
// replacer array behavior.
const includeReplacer = (keys) => (key, value) =>
  keys.includes(key) || key === '' ? value : undefined
class Log {
  constructor(options) {
    options = options || {}
    this.level = 'off'
    this.out = process.stdout
    this.levels = {
      trace: 0,
      debug: 1,
      info: 2,
      warn: 3,
      error: 4,
      fatal: 5,
      off: 6
    }
    this.replacer // (key, value) => value
    // If you don't want to use errorReplacer, just set it to null or
    // (key, value) => value
    this.errorReplacer = (key, value) =>
      value && value.name && value.message && value.stack ? {
        name: value.name,
        message: value.message,
        stack: value.stack
      } :
      value
    // replacerArrayIncludes = true causes the replacer (when it's an
    // array) to work the same as the normal JSON.stringify(), i.e. we
    // only include keys in the array.
    // replacerArrayIncludes = false causes the replacer (when it's an
    // array) to work the OPPOSITE as the normal JSON.stringify(), i.e. we
    // exclude all keys in the array.
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
    this.replacerArrayIncludes = true
    // alwaysIncludeKeys specifies keys to always include (only valid when
    // replacerArrayIncludes = true)
    this.alwaysIncludeKeys = ['time', 'level', 'log', 'name', 'message', 'stack']
    // values to always exclude.
    this.alwaysExcludeValues = []
    // excludedValue is what you want excluded values to be replaced with.
    // if undefined, they key and the value are removed. if some other string
    // value, just the value is replaced with excludedValue.
    this.excludedValue = undefined
    this.space = null
    this.delimiter = '\n'
    this.logLevelFile = null
    this.logLevelPollSeconds = 10
    this.excludeValuesReplacer = (key, value) =>
      this.alwaysExcludeValues.includes(value) ? this.excludedValue : value
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
            if (this.replacerArrayIncludes) {
              replacer = replacer.concat(this.alwaysIncludeKeys)
              replacer = includeReplacer(replacer)
            } else {
              replacer = excludeReplacer(replacer)
            }
          }
          this.out.write(`${ss(
            o,
            multiReplacer([
              replacer,
              this.excludeValuesReplacer,
              this.errorReplacer,
              ]),
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
  const o = {
    error: new Error('something bad happened'),
    name: 'freddy',
    address: {
      street: '1234 lane st',
      city: 'hereshey',
      st: 'PA',
      zip: '19293'
    },
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
    // logLevelFile: 'llf',
    replacerArrayIncludes: false,
    alwaysExcludeValues: ['1234 lane st', 'three'],
    excludedValue: '***REDACTED***',
    replacer: (key, value) => value
  })
  log.debug(o, ['trip', 'st'], 3)
}
