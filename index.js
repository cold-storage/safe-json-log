#!/usr/bin/env node

'use strict'
const ss = require('json-stringify-safe')
class Logger {
  constructor(options) {
    options = options || {}
    this.out = process.stdout
    this.level = 'off'
    this.indent = 0
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
    Object.assign(this, options)
    for (const level of Object.keys(this.levels)) {
      this[level] = (o) => {
        if (this.levels[level] >= this.levels[this.level]) {
          o = {
            time: new Date().toISOString(),
            level,
            log: o
          }
          this.out.write(`${ss(o, null, this.indent)}${this.delimiter}`)
        }
      }
    }
  }
}
exports = module.exports = Logger
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
  const log = new Logger({
    level: 'debug',
    indent: 2
  })
  log.error(o)
}
