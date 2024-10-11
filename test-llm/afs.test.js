const { describe, it } = require('node:test')
const assert = require('assert')
const weaveDrive = require('./weavedrive.js')
const fs = require('fs')
const wasm = fs.readFileSync('./AOS.wasm')
// STEP 1 send a file id
const m = require(__dirname + '/AOS.js')
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

describe('AOS-Llama+VFS Tests', async () => {
  var instance;
  const handle = async function (msg, env) {
    const res = await instance.cwrap('handle', 'string', ['string', 'string'], { async: true })(JSON.stringify(msg), JSON.stringify(env))
    console.log('Memory used:', instance.HEAP8.length)
    return JSON.parse(res)
  }

  it('Create instance', async () => {
    console.log("Creating instance...")
    var instantiateWasm = function (imports, cb) {

      // merge imports argument
      const customImports = {
        env: {
          memory: new WebAssembly.Memory({ initial: 8589934592 / 65536, maximum: 17179869184 / 65536, index: 'i64' })
        }
      }
      //imports.env = Object.assign({}, imports.env, customImports.env)

      WebAssembly.instantiate(wasm, imports).then(result =>

        cb(result.instance)
      )
      return {}
    }

    instance = await m({
      admissableList: AdmissableList,
      WeaveDrive: weaveDrive,
      ARWEAVE: 'https://arweave.net',
      mode: "test",
      blockHeight: 100,
      spawn: {
        "Scheduler": "TEST_SCHED_ADDR"
      },
      process: {
        id: "TEST_PROCESS_ID",
        owner: "TEST_PROCESS_OWNER",
        tags: [
          { name: "Extension", value: "Weave-Drive" }
        ]
      },
      instantiateWasm
    })
    await new Promise((r) => setTimeout(r, 1000));
    console.log("Instance created.")
    await new Promise((r) => setTimeout(r, 250));

    assert.ok(instance)
  })

  it('Eval Lua', async () => {
    console.log("Running eval")
    const result = await handle(getEval('1 + 1'), getEnv())
    console.log("Eval complete")
    assert.equal(result.response.Output.data.output, 2)
  })

  it.skip('Add data to the VFS', async () => {
    await instance['FS_createPath']('/', 'data')
    await instance['FS_createDataFile']('/', 'data/1', Buffer.from('HELLO WORLD'), true, false, false)
    const result = await handle(getEval('return "OK"'), getEnv())
    assert.ok(result.response.Output.data.output == "OK")
  })

  it.skip('Read data from the VFS', async () => {
    const result = await handle(getEval(`
local file = io.open("/data/1", "r")
if file then
  local content = file:read("*a")
  output = content
  file:close()
else
  return "Failed to open the file"
end
return output`), getEnv())
    console.log(result.response.Output)
    assert.ok(result.response.Output.data.output == "HELLO WORLD")
  })

  it.skip('Read data from Arweave', async () => {
    const result = await handle(getEval(`
local file = io.open("/data/dx3GrOQPV5Mwc1c-4HTsyq0s1TNugMf7XfIKJkyVQt8", "r")
if file then
  local content = file:read("*a")
  file:close()
  return string.sub(content, 1, 10)
else
  return "Failed to open the file"
end`), getEnv())
    assert.ok(result.response.Output.data.output.length == 10)
  })

  it('Llama Lua library loads', async () => {
    const result = await handle(getEval(`
local Llama = require("llama")
--llama.load("/data/ggml-tiny.en.bin")
return Llama.info()
`), getEnv())
    assert.ok(result.response.Output.data.output == "Decentralized llama.cpp.")
  })

it('EOC tfhe Lua library test', async () => {
    const result = await handle(getEval(`
local Tfhe = require("eoc_tfhe")
Tfhe.info()
local sk1 = Tfhe.generateSecretKey()
local sk2 = Tfhe.generateSecretKey()
Tfhe.generatePublicKey()
local s1 = 42
local s2 = 27
local ee = "KgAAAJ2VsnrcJ1fMQgPU7r28ESRuYnEu5D2e5aB9q98n8vyy4N0T8/bDYVVGx/IzR52PEaYiKQlSAHNqwD/GXqxyvr3zK5NHo52bI4uqxbfVrdorI7D+i3qdJR8NnxWTUOjTgCNK/YbTM5pFYwqjrDTtDVXd1f0GV3WHhhTAFNWYsDxTuAEqeHVpn+4Wi3cgbzkzUfalbpWAkblqqOP0GG7zUOU/BpGRxCtkisgVJj8XDFp5RwEuaO3biKLvNcLuv5MM7nXUi63Z8BpdZnDp+JgWwxpf7iyXJYZnXIl1hHWRb/iaHRMiIsXik0f2NgvIbCzlGEK77+JyT/0SDtay3wFoiBjteX0+4iIqFML3HchWyhRHswNtPh0GrtfTzX61cWiuzuJ60THKXC1vU7v/CXG72m+blMvME9Vi5IgZXF9dRL0nXqB2m95mw7IjXNKdwIz+Gng4FoieO++YwYM6bczDuchxeiBU4qTtaYkGyBgTW2CNtKTzwiqWCnojnIGrv/qbMfc5yL2iPTXCuq+1ONUMB92LW1r5mLHcB2gzbQ79HWoduxHRoTLc/IjCdVEiWzcwkMndpYrwvkqPMgVQC8zYzJRNJOMUWHnFKKnKkd54GNW62GDB8jawE/5zXpWO6H3HnT995K/k4JJ8wSczWWPkmSld0tqoBCD+rYzC1fDbmR1I8RovI88iifxcA2dZjCePm/aFif1o+/1I+EaABda5GLFbZnfPbw+i9E/O0PQipGo3BkY8uEiie5z+nENzyp7LlzirdRpYulvm3QqWLwwEELvw5EwjhhY3ctXGXmq6gwH1SmeRnZlhgE/BYP+tDPpJjkcal+hQlbolkNSylPBsRN0RPY7+EJx/nQsdJA3DKAC5hCDSEbS/2eEtUvgwjtMrNHuk85KVA4uDq8XeXLEy1P4Cdj6rS0AgLBBugTzj+AUbSVAVKjoXHal7rQHcaGilivxaXRHuqBX1uF4NSsBhqYHs4AX+aXggCd0icTDLzB0J4GsDQmoTTp62iRMILf6t0WcQXiIAV2gfMGX7ndvrTr0dJunkXad26jKtgDSA1kVGcYe1wY9n9IQaZeIVLl6QcwY4KV1+5Lj7Cz8MXQjfQiijiStLXfrR6Lcy9obyOJ98M22S6dg8J4NsstG/TOfPxu9Ra1nfkqyS8ciG8kN3ClaSmTcFYxpBHi83bDD2Rj6XsZ79hkV6G72BLq4COfs8ooX60Fz2RY2yjwiyMy9Y+BjoQ9qS/11YtDAqoYODcUO1CMs8vzXcNC83EApdQx3lUNR8J1ulnX9gKVQwV17hwgSkxXM0/6KhQa5F40vCk8QigoZ32krBqBIrLwehuoh9AvdLHHARvhAQoL9BZQaD/EesV2xk8W7WOiKxNTxqWaQuVspNFCPmaHymkesC2fNQjzhbqZxF2vj0h1IM9PySLjxaY4L+26ITBg00MevcFyp2YbcVpa9MdwiQyEDSyFBDPcKvnWLPIUbriAB1xYTgKyurQHGae1hmFoZb0SjUWiuLWt4xbEn5ND6A1TjjAovpHD995FFttiuG51ySZ3BLbbYhs6ajyE0INYd9ck5L9dpwS6Q9dd/vOjYlUqCrqc6gLKS5P1q90VgLbWY+w1op+k7oBvh20uYgdp8qfIj5fE20v3Lm2o6kSjvF851/abrb4oewqqIyYcDg24VCPhoGmWGU3U1PP0fgbzXxWHHo71x9I+7dv2GDRI7Xe3mDaTHGcCHAXNrTACDyYxcoZC6V9s+eH7xaa0V1eO1WFHrOJBujoWsjTOEcyJZThWPSLw6Y0RrOasGOBv+nROCnXWKFqKTgKYffp1AL9PqORZfYa45Tc4IsRJBTIJJ1GdCxwayiVBQN8hzQT1nv6Nw3hd5X4anmCpTgAqVQSYBuHAaW6zjCbYaCmXMt/EbQkAoio6/EBA3VnzPbY+r0Dlem1Y7h3r2GQcMuZZj4b1RjRlu/CgrtScpcjwAp6tH3/kHD/l3pRydkbDF84uTIkOIniJDpYT2UPmd8QGJbCbYEZp9PSqU5B42ov9PelVu9NRjNm+VICGnPRfq7Xv4LXxEDrIEkmOWZbCIEGqx15sTQLF1BJYvuLH1XTODgpB44df44TonFd1Nfj8U7rmegyCxM8pk35q319KaxbeAPK5GPH8M0NrLgGngPpX1ToTyDhRnDCCbui1rUKBmoKx78mUidpxNq7FtJJzUHXV112+ErtehvKnKq4N1b9zqhBobNdbAJb0CFKvTlMqTQp0gGFck0aECGOOmKMGtcfw+8Mw1mohxCg9LfpyN75oJqSbHXC8QOw5qZ9+Ox2YdoGxD3BuE1o3c1ZVX3YSA9yMfHG1LEGGx2VTzsefuVTO+hXFBanlL8XUmS38RQhLl4fD5m9dbZ2DzA9leu1LjeBoXIuYiCXBl1YZ9CkYeHmsfOiKK3Hi6iYcwdmTIcnTxCMx3qidLeC4OxEZ2PZRC7YWoHGbgQ27CYjvzl8rhxm0bhcC172KOtnwifmDRqZgmYfH+cd0fxV9u3LHBX06uUwnZpImX/lRGMslOeWkQoSmUU3XFd8CaSYkEscB8nNdvtmtmkeut7p6En2QRtdb48jl6aw0PMwzZAzkFe/pyBYMFZ0Kck6t1EAdNCsAkZ6+BY9FapFQVacOvrpV9rYkFRd9R+gRNzk2O6gYNxjlOZ4YviYG1JvSh47SZ6zWozQBUr45ybqf/s3nfdVC91xzVQ25Ehh65nAzd4Wn2s0nSyshFed7p+gLhWC1jwZWdQQpvFKU+8FAo9BHOcobOwpZ/r6CkFASYwb7wH76SR3vU3czcjjoWpDh4gedCYMwHXI6ftx3oZ7bzgJ50i0mEzTxaxj8KHJrx1KYFgi4bluI43IAkQ+U7PGftluXuMXkUHxfoUiMfeCaOyBPaYh+MEOmlnmNlrSHumKfE5pH4uOuFoeM7QWpQyYQ7hEHboJoLdphe9GnVYCClFqsjEzZH039cacLW2D9H7noxAbhkiIa8qeRXWNjZnIsDIpDAQ98DeQmgj9xNhuqSrMXbnbMK6MrL768L6wqIpoJliaYGIAVf92BqYVKtEdiva0SX19mKhfOfjAR9R1ZGV05i5o8NMpcsN/E+vkDeDY/hVzhch+nTRqyOwXmHmikwKSlDC31Oph5kiThfF8nRKw3S/Jz7Z3f/pnOZrgV1EGnukt2nEkBtm7Dwx2pYKx2SsIA4yX7X3wNEXZLuSghzO4Pt/mXTwDPAioM3kRj4YuGC56VoURAbukmbmn8Yel9KATzQtuPRYA6NQu9QmElISb/1QDRGIMnJsuMbM2K5inw++KJDTWEy5C4OhtYxYk1KBfoz/WdX9LTf9fXVjXKDAQrKCA27JYkyuxDe0jmp0SJEAAABI4XqkOw=="
local e1 = Tfhe.encryptInteger(s1, sk1)
local e2 = Tfhe.encryptInteger(s2, sk2)
local d1 = Tfhe.decryptInteger(ee, sk2)
local d2= Tfhe.decryptInteger(e2, sk1)
--local eSum = Tfhe.addCiphertexts(e1, e2, pk)
--local decSum = Tfhe.decryptInteger(eSum, sk)
--return decSum
--return encInt
return d1
`), getEnv())
    console.log("Decrypted computation is ", result.response)
    assert.ok(result.response.Output.data.output == 69)
  })

  it.skip('AOS runs GPT-2 117m model', async () => {
    const result = await handle(getEval(`
  local Llama = require("llama")
  io.stderr:write([[Loading model...\n]])
  local result = Llama.load("/data/M-OzkyjxWhSvWYF87p0kvmkuAEEkvOzIj4nMNoSIydc")
  io.stderr:write([[Loaded! Setting prompt 1...\n]])
  Llama.setPrompt("Once upon a time")
  io.stderr:write([[Prompt set! Running...\n]])
  local str = Llama.run(30)
  return str
  `), getEnv())
    console.log("START SECOND MESSAGE")
    const result2 = await handle(getEval(`
    Llama.setPrompt("How do you feel about rabbits? ")
    io.stderr:write([[Prompt set! Running 2...\n]])
    local str = Llama.run(30)
    return str
    `), getEnv())
    console.log(result.response)
    assert.ok(result.response.Output.data.output.length > 10)
  })

  it.skip('AOS runs GPT-2 1.5b model', async () => {
    const result = await handle(
      getLua('M-OzkyjxWhSvWYF87p0kvmkuAEEkvOzIj4nMNoSIydc', 10),
      getEnv())
    console.log(result.response)
    console.log("SIZE:", instance.HEAP8.length)
    assert.ok(result.response.Output.data.output.length > 10)
  })

  it.skip('AOS loads Phi-2', async () => {
    const result = await handle(getEval(`
  local Llama = require("llama")
  Llama.load('/data/kd34P4974oqZf2Db-hFTUiCipsU6CzbR6t-iJoQhKIo')
  --Llama.setPrompt([[<|user|>Can you write a HelloWorld function in js<|end|><|assistant|>]])
  return Llama.run(10)
  `), getEnv())
    console.log(result.response)
    assert.ok(result.response.Output.data.output.length > 10)
  })

  it.skip('Can add tokens into context', async () => {
    const result = await handle(getEval(`
  local Llama = require("llama")
  Llama.load('/data/ISrbGzQot05rs_HKC08O_SmkipYQnqgB1yC3mjZZeEo')
  Llama.setPrompt([[<|user|>Tell me a great story<|assistant|>]])
  local str = ""
  for i = 0, 100, 1 do
    str = str .. Llama.next()
    io.stderr:write([[Str: ]] .. str .. [[\n]])
    io.stderr:flush()
    if i % 30 == 0 then
      Llama.add("dog")
      str = str .. "dog"
    end
  end
  return str
  `), getEnv())
    console.log(result.response)
    assert.ok(result.response.Output.data.output.length > 10)
  })

  it.skip('AOS runs Phi-3 Mini 4k Instruct', async () => {
    const result = await handle(getEval(`
local Llama = require("llama")
Llama.load('/data/ISrbGzQot05rs_HKC08O_SmkipYQnqgB1yC3mjZZeEo')
Llama.setPrompt([[<|user|>Tell me a story.<|end|><|assistant|>]])
return Llama.run(80) 
  `), getEnv())
    console.log(result.response)
    assert.ok(result.response.Output.data.output.length > 10)
  })

  it.skip('AOS runs Llama3 8B Instruct q4', async () => {
    const result =
      await handle(
        getLua('Pr2YVrxd7VwNdg6ekC0NXWNKXxJbfTlHhhlrKbAd1dA',
          100,
          "<|user|>Tell me a story.<|end|><|assistant|>"),
        getEnv()
      )
    console.log(result.response)
    assert.ok(result.response.Output.data.output.length >= 100)
  })

  it.skip('AOS runs Llama3 8B Instruct q8', async () => {
    const result =
      await handle(
        getLua('jbx-H6aq7b3BbNCHlK50Jz9L-6pz9qmldrYXMwjqQVI',
          10,
          "<|user|>Tell me a story.<|end|><|assistant|>"),
        getEnv()
      )
    console.log(result.response)
    assert.ok(result.response.Output.data.output.length > 10)
  })

  it.skip('AOS runs CodeQwen intelligence test', async () => {
    const result =
      await handle(
        getEval(readFileSync("code-test.lua", "utf-8")),
        getEnv()
      )
    console.log(result.response)
    assert.ok(result.response.Output.data.output.includes("<|im_end|>"))
  })
})

function getLua(model, len, prompt) {
  if (!prompt) {
    prompt = "Tell me a story."
  }
  return getEval(`
  local Llama = require("llama")
  io.stderr:write([[Loading model...\n]])
  Llama.load('/data/${model}')
  io.stderr:write([[Loaded! Setting prompt...\n]])
  Llama.setPrompt([[${prompt}]])
  local result = ""
  io.stderr:write([[Running...\n]])
  for i = 0, ${len.toString()}, 1 do
    local token = Llama.next()
    result = result .. token
    io.stderr:write([[Got token: ]] .. token .. [[\n\n]])
  end
  return result`);
}

function getEval(expr) {
  return {
    Id: '1',
    Owner: 'TOM',
    Module: 'FOO',
    From: 'foo',
    'Block-Height': '1000',
    Timestamp: Date.now(),
    Tags: [
      { name: 'Action', value: 'Eval' }
    ],
    Data: expr
  }
}

function getEnv() {
  return {
    Process: {
      Id: 'AOS',
      Owner: 'TOM',
      Tags: [
        { name: 'Name', value: 'Thomas' }
      ]
    }
  }
}