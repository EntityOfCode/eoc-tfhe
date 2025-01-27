
import { test } from 'node:test'
import * as assert from 'node:assert'
import AoLoader from '@permaweb/ao-loader' // Need new version of AO Loader
import fs from 'fs'
import weaveDrive from './weavedrive.js';
const AdmissableList =
  [
    "dx3GrOQPV5Mwc1c-4HTsyq0s1TNugMf7XfIKJkyVQt8", // Random NFT metadata (1.7kb of JSON)
    "XOJ8FBxa6sGLwChnxhF2L71WkKLSKq1aU5Yn5WnFLrY", // GPT-2 117M model.
    "M-OzkyjxWhSvWYF87p0kvmkuAEEkvOzIj4nMNoSIydc", // GPT-2-XL 4-bit quantized model.
    "kd34P4974oqZf2Db-hFTUiCipsU6CzbR6t-iJoQhKIo", // Phi-2 
    "ISrbGzQot05rs_HKC08O_SmkipYQnqgB1yC3mjZZeEo", // Phi-3 Mini 4k Instruct
    "sKqjvBbhqKvgzZT4ojP1FNvt4r_30cqjuIIQIr-3088", // CodeQwen 1.5 7B Chat q3
    "Pr2YVrxd7VwNdg6ekC0NXWNKXxJbfTlHhhlrKbAd1dA", // Llama3 8B Instruct q4
    "jbx-H6aq7b3BbNCHlK50Jz9L-6pz9qmldrYXMwjqQVI"  // Llama3 8B Instruct q8
  ]


const wasm = fs.readFileSync('./process.wasm')
const options = {
  format: "wasm64-unknown-emscripten-draft_2024_02_15",
  admissableList: AdmissableList,
  WeaveDrive: weaveDrive,
  ARWEAVE: 'https://arweave.net',
  mode: "test",
  blockHeight: 100,
  spawn: {
    "Scheduler": "TEST_SCHED_ADDR"
  },
  Process: {
    Id: 'AOS',
    Owner: 'FOOBAR',
    tags: [
      { name: "Extension", value: "Weave-Drive" }
    ]
  },
}

test('llama', async () => {
  const handle = await AoLoader(wasm, options)
  const env = {
    Process: {
      Id: 'AOS',
      Owner: 'FOOBAR',
      Tags: [
        { name: 'Name', value: 'Thomas' }
      ]
    }
  }
  // const msg = {
  //   Target: 'AOS',
  //   From: 'FOOBAR',
  //   Owner: 'FOOBAR',
  //   ['Block-Height']: "1000",
  //   Id: "1234xyxfoo",
  //   Module: "WOOPAWOOPA",
  //   Tags: [
  //     { name: 'Action', value: 'Eval' }
  //   ],
  //   Data: `
  //   local Llama = require(".Llama")
  //   io.stderr:write([[Loading model...\n]])
  //   local result = Llama.load("/data/M-OzkyjxWhSvWYF87p0kvmkuAEEkvOzIj4nMNoSIydc")
  //   io.stderr:write([[Loaded! Setting prompt 1...\n]])
  //   Llama.setPrompt("Once upon a time")
  //   io.stderr:write([[Prompt set! Running...\n]])
  //   local str = Llama.run(30)
  //   return str
  //   `
  // }

  const msg = {
    Target: 'AOS',
    From: 'FOOBAR',
    Owner: 'FOOBAR',
    ['Block-Height']: "1000",
    Id: "1234xyxfoo",
    Module: "WOOPAWOOPA",
    Tags: [
      { name: 'Action', value: 'Eval' }
    ],
    Data: `
    local metering = require("metering")
    print(metering.gasUsed())
    `
  }

  // load handler
  const result = await handle(null, msg, env)

  console.log(result)

  assert.ok(true)
})
