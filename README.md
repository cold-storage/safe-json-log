# Safe JSON Log

Safely log any object. Like `JSON.stringify()`, but won't error on
circular refernce.

Install

```sh
npm i safe-json-log
```

Example Usage

```js
const Log = require('safe-json-log')
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
const log = new Log({ level: 'debug' })
log.error(o)
// can be called like JSON.stringify(value, replacer, space)
log.error(o, null, 2)
// we allow omitting replacer
log.error(o, 2)
```

Output

```json
{
  "time": "2019-07-31T15:50:24.910Z",
  "level": "error",
  "log": {
    "name": "freddy",
    "address": {
      "street": "1234 lane st",
      "city": "hereshey",
      "st": "PA",
      "zip": "19293"
    },
    "error": {
      "name": "Error",
      "message": "something bad happened",
      "stack": "Error: something bad happened\n    at Object.<anonymous> (/Users/jds/jds/safe-json-log/index.js:47:15)\n    at Module._compile (internal/modules/cjs/loader.js:776:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)\n    at Function.Module._load (internal/modules/cjs/loader.js:585:3)\n    at Function.Module.runMain (internal/modules/cjs/loader.js:829:12)\n    at startup (internal/bootstrap/node.js:283:19)\n    at bootstrapNodeJSCore (internal/bootstrap/node.js:622:3)"
    },
    "nest": {
      "really": {
        "deep": {
          "stuff": [
            "one",
            2,
            "three"
          ]
        }
      }
    },
    "circular": "[Circular ~.log]"
  }
}
```
