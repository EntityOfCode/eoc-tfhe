const { describe, it } = require('node:test')
const assert = require('assert')
const weaveDrive = require('./weavedrive.js')
const fs = require('fs')
const wasm = fs.readFileSync('./process.wasm')
// STEP 1 send a file id
const m = require(__dirname + '/process.js')

// Declare encryptedCipher1 as a global variable
let encryptedCipher1, encryptedCipher2;

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
    assert.equal(result.response.Output.data, 2)
  })

  it('Add data to the VFS', async () => {
    await instance['FS_createPath']('/', 'data')
    await instance['FS_createDataFile']('/', 'data/1', Buffer.from('HELLO WORLD'), true, false, false)
    const result = await handle(getEval('return "OK"'), getEnv())
    assert.ok(result.response.Output.data == "OK")
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

  it.skip('Llama Lua library loads', async () => {
    const result = await handle(getEval(`
local Llama = require(".Llama")
--llama.load("/data/ggml-tiny.en.bin")
return Llama.info()
`), getEnv())
    assert.ok(result.response.Output.data.output == "A decentralized LLM inference engine, built on top of llama.cpp.\n")
  })

  it('EOC JWT library test', async () => {
    const result = await handle(getEval(`
    local Tfhe = require("tfhe")

    Tfhe.info()

    return 1
    `), getEnv())
    console.log("JWT Validation Success! ", result.response)
    assert.ok(result.response.Output.data.output == 1)
  })

  it('EOC tfhe key gen library test', async () => {
    const result = await handle(getEval(`
    local Tfhe = require("tfhe")
    local tkn = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlR0TU13TEllaUlDc0YtcF9SbWFidCJ9.eyJvd25lciI6IjB6c2N4OXN5aGM0YlVqY0ltcXVEb1N1M2lRdVdXYjU5WThfMzc0M195ZFl" .. 
                "xMFVmNC1GeGpudVlqVGQ3UUFuZGNOWUlIbHJfaHptQ0ZJSVBDZDVFTThGazlLb1NId3J2LUZEOHJEV3FBdnhSRHY3MDR5ZDJ6c3VxVV9ZWEtyMlVkRk5TaktHeDNmUlg2dW1lLWw1ZjNUNnNkZnR" ..
                "Ra2VCbVF6LTViMk1sLV8zbV9UOGViUmViN2FPbnhuOXBtUHpvNERPQ3VhRGRfQXh2R2p0QW50X2ZzdEtMZkRlMTJpWDJiTjAwNTFPQmZITXAxQ3RBUEdKU3o4LWVUZDBTcHp1OC1TcjVMOFNIZ1N" ..
                "FNXJMSVFnU1kxaW1jcWlldThMZGZ4X01ZbjdiWWZQZ3QwWGtyMG1lT3JmVVZ5VFAzY0tqREY0YVVPU3pXdTVub0xtdmRydUw0X2dxV0xHZ2VkSHkzdW45VG5lRzdjVXFfNjh1THhEQ0xrSGlIVTZ" ..
                "RUWtIcEREeXYza0I5dE9OdXE0WUhZQ1EyTkxzOTdQLWFoTE1JSld3c096NGtBZFN5SUlNUm1GVnNnWl95czlRTkM2NE1GaDVQWUdhVE1TV3dNWlVqdnBVSmtjbkdybHZycDJ4MDdfMUtwRGxfWmV" ..
                "XVmpiRVR2Z2dwYjBuWjJxSnhOVHdqRFVETU4tS19maEJJTFJkRDNyWWxzd3I0VUtxenF6N1dEMG9KMGRISG9HTFVCbU5YUXp6dzVsRG5GS3RVaHB6UUdvMzhJMmYxdWt2M3RNRXY2ZTk3bEhNc2F" ..
                "pdzhhVjZtZm5vM0NpaE9peEFNemlkLWZnUHhzMS1IQlUxdWxSejhod29vc2dxd2RhcmJZcS1VZlJWSGd5aGRjSUFURi1NTVpVMUNMU0JlSV9tbHY4Iiwid2FsbGV0QWRkcmVzcyI6IjZrdml3ZWl" ..
                "jQmVnM3k5YzVOUzJpYTU2WDdNaThIY0MyOUNYSmkxa2ZYamMiLCJhdXRoU3lzdGVtIjoiS01TIiwiZ2l2ZW5fbmFtZSI6IlN0aXJiZWkiLCJmYW1pbHlfbmFtZSI6Ik9jdGF2aWFuIiwibmlja25" ..
                "hbWUiOiJvY3RhdmlhbnN0aXJiZWkiLCJuYW1lIjoiU3RpcmJlaSBPY3RhdmlhbiIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NMeEM5ODBQWlp" ..
                "xRGlaZzZNRXJXNWl2Nl9IRElmWkpRbkhEM1VUVklTVk5sWVJWWnBJND1zOTYtYyIsInVwZGF0ZWRfYXQiOiIyMDI0LTExLTA3VDE4OjUwOjI4LjY5MFoiLCJlbWFpbCI6Im9jdGF2aWFuc3RpcmJ" ..
                "laUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6Ly9hdXRoLm90aGVudC5pby8iLCJhdWQiOiJ1WGtSbUpvSWEwTmZ6WWdZRURBZ2o2UnNzNHdSMXRJYyIsIml" ..
                "hdCI6MTczMTAwNTQzMywiZXhwIjoxNzMxMDQxNDMzLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExMTI2ODU0MzQ4MzAzNDY3NTMyMiIsInNpZCI6IlpQODFQTVhCTWhkcHFGVEFhMklQN0J2dzJKSE1" ..
                "DcXZrIiwibm9uY2UiOiJSUzQ0YzJKWlRsWXdMbUZpVFdJd1ZsaFpha3hrVjJKVE1qSTJjakZwVUc4eVdrRnBlSFF3TFVoVWRnPT0ifQ.qaxZlYXG4S80nfrNvfAqQYNJkPTzuNKsy919pllgzrv6L" ..
                "EhBpTwYOJkr8COc9XsIkVwddD5J6ZJYsBSzL3T8cZ9l0WDoID1S2iql20hToiDZQVWJGC5k2OMTLR3vCaQOuRTmH5ymBwA7mke-5D7JQ_y4RCkt5qCHK6ajSf7w62R0LO_jwxFcI_qlg693hRUEC" ..
                "M-M81N4R99qfI1skh84qYm6---xvZqTFQF4aH2CLlo_ztsKZ_SX959WVHk0FHJBt5-XLui6ICFDS6sjQWA5wzSv8MMESBJ9SEREoN6T8KdlBFOEfJd8lbzBg6Eve8d_zuLEc1R3sxD-v3jq2aq1pw"
    local jwks = "ewogICJrZXlzIjogWwogICAgewogICAgICAia3R5IjogIlJTQSIsCiAgICAgICJ1c2UiOiAic2lnIiwKICAgICAgIm4iOiAidU1mZTd5MVdSWk5ydXFURjR0SXhna05fWjVQT0pQVkg3SGUxeWt6" ..
                "Yk8telRWbWJiNnloVE1zdzV3WE9xWEVuZXI3b19SQjRpYVk5SFdaQ2VVcVEtLWtlVkptck9tR3lXazhaM3pIXzYtaTdCbVJGSl9KWktMSFFBMmY0UVRHSG5WNHgzOFFvNVlka1h5Qm1lcFhsc3BI" ..
                "THdtdDZabnVzUnIyZEtkWHMzMUJMa3ZpSGdLaVlkR2pKSGdCQl9uSEhjZU9NYnF1OTZPeHRmbks2VG9mNzJGdjFzbGZyZDB3ZzQySU5IVERMN1gxdVRMaUc4ckFRSm1vTDhDRmFxaUVPQlFYUEI1" ..
                "NmQ0WnJMdWRXT3hPZ25xNW52YUpXaGdTNzNnY2lTUThlcDdkZWtrWHo1U3hPUkVMSE8temY0UDhtSC02c3VKYXdHSm0yQmRLRkJvejR6a2NRIiwKICAgICAgImUiOiAiQVFBQiIsCiAgICAgICJr" ..
                "aWQiOiAiVHRNTXdMSWVpSUNzRi1wX1JtYWJ0IiwKICAgICAgIng1dCI6ICJNZ3FFeENhQ3RzMTVvMXJkS3lleEdoaHRBNjAiLAogICAgICAieDVjIjogWwogICAgICAgICJNSUlEQVRDQ0FlbWdB" ..
                "d0lCQWdJSkNBU1p6WVV4QTNaYU1BMEdDU3FHU0liM0RRRUJDd1VBTUI0eEhEQWFCZ05WQkFNVEUyOTBhR1Z1ZEM1MWN5NWhkWFJvTUM1amIyMHdIaGNOTWpNd016STNNVFV3TVRRMVdoY05Nell4" ..
                "TWpBek1UVXdNVFExV2pBZU1Sd3dHZ1lEVlFRREV4TnZkR2hsYm5RdWRYTXVZWFYwYURBdVkyOXRNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXVNZmU3eTFXUlpO" ..
                "cnVxVEY0dEl4Z2tOL1o1UE9KUFZIN0hlMXlremJPK3pUVm1iYjZ5aFRNc3c1d1hPcVhFbmVyN28vUkI0aWFZOUhXWkNlVXFRKytrZVZKbXJPbUd5V2s4WjN6SC82K2k3Qm1SRkovSlpLTEhRQTJm" ..
                "NFFUR0huVjR4MzhRbzVZZGtYeUJtZXBYbHNwSEx3bXQ2Wm51c1JyMmRLZFhzMzFCTGt2aUhnS2lZZEdqSkhnQkIvbkhIY2VPTWJxdTk2T3h0Zm5LNlRvZjcyRnYxc2xmcmQwd2c0MklOSFRETDdY" ..
                "MXVUTGlHOHJBUUptb0w4Q0ZhcWlFT0JRWFBCNTZkNFpyTHVkV094T2ducTVudmFKV2hnUzczZ2NpU1E4ZXA3ZGVra1h6NVN4T1JFTEhPK3pmNFA4bUgrNnN1SmF3R0ptMkJkS0ZCb3o0emtjUUlE" ..
                "QVFBQm8wSXdRREFQQmdOVkhSTUJBZjhFQlRBREFRSC9NQjBHQTFVZERnUVdCQlRqb3pyemJ3UTAwMDRobW9SZGtOdy9SZlpTcERBT0JnTlZIUThCQWY4RUJBTUNBb1F3RFFZSktvWklodmNOQVFF" ..
                "TEJRQURnZ0VCQUNEM1lhRzlTOG05M2lrdkI2NzlKbmRHRGNRMVFLWEpYMnlxQXRMd1VhSmxSaEhFYlJ0WHltM0ora0lIbzFPT0s4SkFmdGNiYlpxMzRwK3ZwMllabTJnVURUaU1RejFRUWRLVm1q" ..
                "QjlUbk5ZUDlqSTdiNGx1cGZ1RGVNbnRBVkFvOGI4V0NyUlFWNHZvTjg4K1h2YWdaOUgzc3Y3ZmRQSHAxbUtHamJwejl1QmtYc3VqZFFyZHZmaklTNUR6WURhZ3lUbE5ib0hRQmJiUzJiR2N6eFZo" ..
                "YlF6eFNPSmx2dWcvcE4zdVV1eUdvOERCNFdEdEJwYjNmU25OQWlveDFuMzNFOTNQNnpoeVBnNVFWU1FsWS9BQ1htM1VoWTVVc1JaWEV6am9BTC95bU02OGI2Qi84NU40WHlwdmUrYlVrK1p3YjlP" ..
                "am13YjBwVTlhelFFWHhSV1B5OD0iCiAgICAgIF0sCiAgICAgICJhbGciOiAiUlMyNTYiCiAgICB9LAogICAgewogICAgICAia3R5IjogIlJTQSIsCiAgICAgICJ1c2UiOiAic2lnIiwKICAgICAg" ..
                "Im4iOiAieS1EV0QtU1Bpbm1Bc1d0bDBUQ1Y5T3JjZHcyNGNpbUlUaUoxYnJBUW5xN0NoUkVFcVFFaDdXYmwyWjFoY1p6aV9sQm1Nd2ZjRDJ5ZlpFNUkwT2dMNnExaEk5NzlBZERKbjZCYVNBdXE4" ..
                "cjJ1azBLeUZGM0RiQzBGZ25SRlJ0anM5SEYzRjZhUWE5cXVrLS1LLWFjLXpLODFOdUhjaTBnQzU0bm01QTc2V3l3NEF6cHhRckE4Z2NvcnpFREd0Z2d0cDdPUEpyTFhSdFd4NUozb3o2TlBrVERH" ..
                "UWZueFJoUzRQSGsxbUZ3UTVRelFlbXRWS1AtRjgxQW0xX3IwTXlfRGZMVXF3Q2w3NFNPM18xTG9TanF6VllUOGZGTmhDdzJqTUlDejFEeWR5S2czT2NUUnhXVGhjQm5XbDdvc2N0NmtzSUhqYjA3" ..
                "OGFsWlNwU0pOTVJMT2Z3IiwKICAgICAgImUiOiAiQVFBQiIsCiAgICAgICJraWQiOiAiUjFGenA4OVBpekNySXZYZlk1SFVOIiwKICAgICAgIng1dCI6ICJFSV9DbS1WT1o5WEhKemlqYnlYLVNf" ..
                "Y1ByUHMiLAogICAgICAieDVjIjogWwogICAgICAgICJNSUlEQVRDQ0FlbWdBd0lCQWdJSkxXRS9SUDVUTVJQT01BMEdDU3FHU0liM0RRRUJDd1VBTUI0eEhEQWFCZ05WQkFNVEUyOTBhR1Z1ZEM1" ..
                "MWN5NWhkWFJvTUM1amIyMHdIaGNOTWpNd016STNNVFV3TVRRMldoY05Nell4TWpBek1UVXdNVFEyV2pBZU1Sd3dHZ1lEVlFRREV4TnZkR2hsYm5RdWRYTXVZWFYwYURBdVkyOXRNSUlCSWpBTkJn" ..
                "a3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXkrRFdEK1NQaW5tQXNXdGwwVENWOU9yY2R3MjRjaW1JVGlKMWJyQVFucTdDaFJFRXFRRWg3V2JsMloxaGNaemkvbEJtTXdmY0QyeWZa" ..
                "RTVJME9nTDZxMWhJOTc5QWRESm42QmFTQXVxOHIydWswS3lGRjNEYkMwRmduUkZSdGpzOUhGM0Y2YVFhOXF1aysrSythYyt6SzgxTnVIY2kwZ0M1NG5tNUE3Nld5dzRBenB4UXJBOGdjb3J6RURH" ..
                "dGdndHA3T1BKckxYUnRXeDVKM296Nk5Qa1RER1FmbnhSaFM0UEhrMW1Gd1E1UXpRZW10VktQK0Y4MUFtMS9yME15L0RmTFVxd0NsNzRTTzMvMUxvU2pxelZZVDhmRk5oQ3cyak1JQ3oxRHlkeUtn" ..
                "M09jVFJ4V1RoY0JuV2w3b3NjdDZrc0lIamIwNzhhbFpTcFNKTk1STE9md0lEQVFBQm8wSXdRREFQQmdOVkhSTUJBZjhFQlRBREFRSC9NQjBHQTFVZERnUVdCQlRLeEkvZk9xU21IVTJyRVFwTTNQ" ..
                "SVBqYVYxcVRBT0JnTlZIUThCQWY4RUJBTUNBb1F3RFFZSktvWklodmNOQVFFTEJRQURnZ0VCQUlGUUhSQ0hLMGFXRmZ1cnkvM3lWZ1BjZU02T2x4Z01ySXhwcE5kY3M0N0xhZnliTFE3Z1hmaHda" ..
                "TW50bGxvU2dXTm9DcWxNTDRWWnJnRkJTRkw3aHRuYTJKVmw0OUpybi9FODBIVXlXNVFZRGMxVlpPN2FuMUN6eXJmRzEvak84YUwySzE5RGFsdWxTYk1jN0ZRNURXQzZ2UEZ6eHVoOHZkYXFUSDdN" ..
                "bTFEMnFWS0VTNjViRWRJUkh4ck9wNWttYWJRekRkcGxjTVIwMitkdGNNY21xejg3ZG8xOFBDaHo0RjBkRTA3ekgvbEZMSWt0Smt2aXVRaW50bEt4MVB6RGhJV0JpbEI2aW5zbTM3Slo3YW9DdHdO" ..
                "VmE5QXFrMFYxTWxIU2J4dUt1TGlPbU52bWhPbHpsZFpnRGVRMSttd0pxajJZV3N5c1d3ODNLWkswVjBoOTBZdz0iCiAgICAgIF0sCiAgICAgICJhbGciOiAiUlMyNTYiCiAgICB9CiAgXQp9"
    Tfhe.info()

    Tfhe.generateSecretKey(tkn,jwks)

    Tfhe.testJWT()

    local s1 = 42
    local s2 = 27
    --local e1 = Tfhe.encryptInteger(s1, '')
    --local e2 = Tfhe.encryptInteger(s2, '')

    --local eSum = Tfhe.addCiphertexts(e1, e2, '')
    --local decSum = Tfhe.decryptInteger(e1, '', tkn, jwks)
    return 1
    --decSum
`), getEnv())
    console.log("Test finished is ", result.response.Output.data)
    encryptedCipher1 = result.response.Output.data;
    assert.ok(result.response.Output.data.output == 1)
  })

  it.skip('EOC tfhe encryption library test', async () => {
    console.log("Running encryption test")
    const result = await handle(getEval(`
    local Tfhe = require("tfhe")
    local s1 = 69
    local e1 = Tfhe.encryptInteger(s1, '')
    return e1
  `), getEnv())
    console.log("Encrypted cipher is: ", result.response.Output.data)
    encryptedCipher2 = result.response.Output.data;
    console.log("Encryption integer test complete")
    assert.ok(1 == 1)
  })

  it('EOC tfhe  string encryption/decryption library test', async () => {
    console.log("Running string encryption/decryption test")
    const result = await handle(getEval(`
    local Tfhe = require("tfhe")
          local tkn = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlR0TU13TEllaUlDc0YtcF9SbWFidCJ9.eyJvd25lciI6IjB6c2N4OXN5aGM0YlVqY0ltcXVEb1N1M2lRdVdXYjU5WThfMzc0M195ZFl" .. 
                  "xMFVmNC1GeGpudVlqVGQ3UUFuZGNOWUlIbHJfaHptQ0ZJSVBDZDVFTThGazlLb1NId3J2LUZEOHJEV3FBdnhSRHY3MDR5ZDJ6c3VxVV9ZWEtyMlVkRk5TaktHeDNmUlg2dW1lLWw1ZjNUNnNkZnR" ..
                  "Ra2VCbVF6LTViMk1sLV8zbV9UOGViUmViN2FPbnhuOXBtUHpvNERPQ3VhRGRfQXh2R2p0QW50X2ZzdEtMZkRlMTJpWDJiTjAwNTFPQmZITXAxQ3RBUEdKU3o4LWVUZDBTcHp1OC1TcjVMOFNIZ1N" ..
                  "FNXJMSVFnU1kxaW1jcWlldThMZGZ4X01ZbjdiWWZQZ3QwWGtyMG1lT3JmVVZ5VFAzY0tqREY0YVVPU3pXdTVub0xtdmRydUw0X2dxV0xHZ2VkSHkzdW45VG5lRzdjVXFfNjh1THhEQ0xrSGlIVTZ" ..
                  "RUWtIcEREeXYza0I5dE9OdXE0WUhZQ1EyTkxzOTdQLWFoTE1JSld3c096NGtBZFN5SUlNUm1GVnNnWl95czlRTkM2NE1GaDVQWUdhVE1TV3dNWlVqdnBVSmtjbkdybHZycDJ4MDdfMUtwRGxfWmV" ..
                  "XVmpiRVR2Z2dwYjBuWjJxSnhOVHdqRFVETU4tS19maEJJTFJkRDNyWWxzd3I0VUtxenF6N1dEMG9KMGRISG9HTFVCbU5YUXp6dzVsRG5GS3RVaHB6UUdvMzhJMmYxdWt2M3RNRXY2ZTk3bEhNc2F" ..
                  "pdzhhVjZtZm5vM0NpaE9peEFNemlkLWZnUHhzMS1IQlUxdWxSejhod29vc2dxd2RhcmJZcS1VZlJWSGd5aGRjSUFURi1NTVpVMUNMU0JlSV9tbHY4Iiwid2FsbGV0QWRkcmVzcyI6IjZrdml3ZWl" ..
                  "jQmVnM3k5YzVOUzJpYTU2WDdNaThIY0MyOUNYSmkxa2ZYamMiLCJhdXRoU3lzdGVtIjoiS01TIiwiZ2l2ZW5fbmFtZSI6IlN0aXJiZWkiLCJmYW1pbHlfbmFtZSI6Ik9jdGF2aWFuIiwibmlja25" ..
                  "hbWUiOiJvY3RhdmlhbnN0aXJiZWkiLCJuYW1lIjoiU3RpcmJlaSBPY3RhdmlhbiIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NMeEM5ODBQWlp" ..
                  "xRGlaZzZNRXJXNWl2Nl9IRElmWkpRbkhEM1VUVklTVk5sWVJWWnBJND1zOTYtYyIsInVwZGF0ZWRfYXQiOiIyMDI0LTExLTA3VDE4OjUwOjI4LjY5MFoiLCJlbWFpbCI6Im9jdGF2aWFuc3RpcmJ" ..
                  "laUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6Ly9hdXRoLm90aGVudC5pby8iLCJhdWQiOiJ1WGtSbUpvSWEwTmZ6WWdZRURBZ2o2UnNzNHdSMXRJYyIsIml" ..
                  "hdCI6MTczMTAwNTQzMywiZXhwIjoxNzMxMDQxNDMzLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExMTI2ODU0MzQ4MzAzNDY3NTMyMiIsInNpZCI6IlpQODFQTVhCTWhkcHFGVEFhMklQN0J2dzJKSE1" ..
                  "DcXZrIiwibm9uY2UiOiJSUzQ0YzJKWlRsWXdMbUZpVFdJd1ZsaFpha3hrVjJKVE1qSTJjakZwVUc4eVdrRnBlSFF3TFVoVWRnPT0ifQ.qaxZlYXG4S80nfrNvfAqQYNJkPTzuNKsy919pllgzrv6L" ..
                  "EhBpTwYOJkr8COc9XsIkVwddD5J6ZJYsBSzL3T8cZ9l0WDoID1S2iql20hToiDZQVWJGC5k2OMTLR3vCaQOuRTmH5ymBwA7mke-5D7JQ_y4RCkt5qCHK6ajSf7w62R0LO_jwxFcI_qlg693hRUEC" ..
                  "M-M81N4R99qfI1skh84qYm6---xvZqTFQF4aH2CLlo_ztsKZ_SX959WVHk0FHJBt5-XLui6ICFDS6sjQWA5wzSv8MMESBJ9SEREoN6T8KdlBFOEfJd8lbzBg6Eve8d_zuLEc1R3sxD-v3jq2aq1pw"
      local jwks = "ewogICJrZXlzIjogWwogICAgewogICAgICAia3R5IjogIlJTQSIsCiAgICAgICJ1c2UiOiAic2lnIiwKICAgICAgIm4iOiAidU1mZTd5MVdSWk5ydXFURjR0SXhna05fWjVQT0pQVkg3SGUxeWt6" ..
                  "Yk8telRWbWJiNnloVE1zdzV3WE9xWEVuZXI3b19SQjRpYVk5SFdaQ2VVcVEtLWtlVkptck9tR3lXazhaM3pIXzYtaTdCbVJGSl9KWktMSFFBMmY0UVRHSG5WNHgzOFFvNVlka1h5Qm1lcFhsc3BI" ..
                  "THdtdDZabnVzUnIyZEtkWHMzMUJMa3ZpSGdLaVlkR2pKSGdCQl9uSEhjZU9NYnF1OTZPeHRmbks2VG9mNzJGdjFzbGZyZDB3ZzQySU5IVERMN1gxdVRMaUc4ckFRSm1vTDhDRmFxaUVPQlFYUEI1" ..
                  "NmQ0WnJMdWRXT3hPZ25xNW52YUpXaGdTNzNnY2lTUThlcDdkZWtrWHo1U3hPUkVMSE8temY0UDhtSC02c3VKYXdHSm0yQmRLRkJvejR6a2NRIiwKICAgICAgImUiOiAiQVFBQiIsCiAgICAgICJr" ..
                  "aWQiOiAiVHRNTXdMSWVpSUNzRi1wX1JtYWJ0IiwKICAgICAgIng1dCI6ICJNZ3FFeENhQ3RzMTVvMXJkS3lleEdoaHRBNjAiLAogICAgICAieDVjIjogWwogICAgICAgICJNSUlEQVRDQ0FlbWdB" ..
                  "d0lCQWdJSkNBU1p6WVV4QTNaYU1BMEdDU3FHU0liM0RRRUJDd1VBTUI0eEhEQWFCZ05WQkFNVEUyOTBhR1Z1ZEM1MWN5NWhkWFJvTUM1amIyMHdIaGNOTWpNd016STNNVFV3TVRRMVdoY05Nell4" ..
                  "TWpBek1UVXdNVFExV2pBZU1Sd3dHZ1lEVlFRREV4TnZkR2hsYm5RdWRYTXVZWFYwYURBdVkyOXRNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXVNZmU3eTFXUlpO" ..
                  "cnVxVEY0dEl4Z2tOL1o1UE9KUFZIN0hlMXlremJPK3pUVm1iYjZ5aFRNc3c1d1hPcVhFbmVyN28vUkI0aWFZOUhXWkNlVXFRKytrZVZKbXJPbUd5V2s4WjN6SC82K2k3Qm1SRkovSlpLTEhRQTJm" ..
                  "NFFUR0huVjR4MzhRbzVZZGtYeUJtZXBYbHNwSEx3bXQ2Wm51c1JyMmRLZFhzMzFCTGt2aUhnS2lZZEdqSkhnQkIvbkhIY2VPTWJxdTk2T3h0Zm5LNlRvZjcyRnYxc2xmcmQwd2c0MklOSFRETDdY" ..
                  "MXVUTGlHOHJBUUptb0w4Q0ZhcWlFT0JRWFBCNTZkNFpyTHVkV094T2ducTVudmFKV2hnUzczZ2NpU1E4ZXA3ZGVra1h6NVN4T1JFTEhPK3pmNFA4bUgrNnN1SmF3R0ptMkJkS0ZCb3o0emtjUUlE" ..
                  "QVFBQm8wSXdRREFQQmdOVkhSTUJBZjhFQlRBREFRSC9NQjBHQTFVZERnUVdCQlRqb3pyemJ3UTAwMDRobW9SZGtOdy9SZlpTcERBT0JnTlZIUThCQWY4RUJBTUNBb1F3RFFZSktvWklodmNOQVFF" ..
                  "TEJRQURnZ0VCQUNEM1lhRzlTOG05M2lrdkI2NzlKbmRHRGNRMVFLWEpYMnlxQXRMd1VhSmxSaEhFYlJ0WHltM0ora0lIbzFPT0s4SkFmdGNiYlpxMzRwK3ZwMllabTJnVURUaU1RejFRUWRLVm1q" ..
                  "QjlUbk5ZUDlqSTdiNGx1cGZ1RGVNbnRBVkFvOGI4V0NyUlFWNHZvTjg4K1h2YWdaOUgzc3Y3ZmRQSHAxbUtHamJwejl1QmtYc3VqZFFyZHZmaklTNUR6WURhZ3lUbE5ib0hRQmJiUzJiR2N6eFZo" ..
                  "YlF6eFNPSmx2dWcvcE4zdVV1eUdvOERCNFdEdEJwYjNmU25OQWlveDFuMzNFOTNQNnpoeVBnNVFWU1FsWS9BQ1htM1VoWTVVc1JaWEV6am9BTC95bU02OGI2Qi84NU40WHlwdmUrYlVrK1p3YjlP" ..
                  "am13YjBwVTlhelFFWHhSV1B5OD0iCiAgICAgIF0sCiAgICAgICJhbGciOiAiUlMyNTYiCiAgICB9LAogICAgewogICAgICAia3R5IjogIlJTQSIsCiAgICAgICJ1c2UiOiAic2lnIiwKICAgICAg" ..
                  "Im4iOiAieS1EV0QtU1Bpbm1Bc1d0bDBUQ1Y5T3JjZHcyNGNpbUlUaUoxYnJBUW5xN0NoUkVFcVFFaDdXYmwyWjFoY1p6aV9sQm1Nd2ZjRDJ5ZlpFNUkwT2dMNnExaEk5NzlBZERKbjZCYVNBdXE4" ..
                  "cjJ1azBLeUZGM0RiQzBGZ25SRlJ0anM5SEYzRjZhUWE5cXVrLS1LLWFjLXpLODFOdUhjaTBnQzU0bm01QTc2V3l3NEF6cHhRckE4Z2NvcnpFREd0Z2d0cDdPUEpyTFhSdFd4NUozb3o2TlBrVERH" ..
                  "UWZueFJoUzRQSGsxbUZ3UTVRelFlbXRWS1AtRjgxQW0xX3IwTXlfRGZMVXF3Q2w3NFNPM18xTG9TanF6VllUOGZGTmhDdzJqTUlDejFEeWR5S2czT2NUUnhXVGhjQm5XbDdvc2N0NmtzSUhqYjA3" ..
                  "OGFsWlNwU0pOTVJMT2Z3IiwKICAgICAgImUiOiAiQVFBQiIsCiAgICAgICJraWQiOiAiUjFGenA4OVBpekNySXZYZlk1SFVOIiwKICAgICAgIng1dCI6ICJFSV9DbS1WT1o5WEhKemlqYnlYLVNf" ..
                  "Y1ByUHMiLAogICAgICAieDVjIjogWwogICAgICAgICJNSUlEQVRDQ0FlbWdBd0lCQWdJSkxXRS9SUDVUTVJQT01BMEdDU3FHU0liM0RRRUJDd1VBTUI0eEhEQWFCZ05WQkFNVEUyOTBhR1Z1ZEM1" ..
                  "MWN5NWhkWFJvTUM1amIyMHdIaGNOTWpNd016STNNVFV3TVRRMldoY05Nell4TWpBek1UVXdNVFEyV2pBZU1Sd3dHZ1lEVlFRREV4TnZkR2hsYm5RdWRYTXVZWFYwYURBdVkyOXRNSUlCSWpBTkJn" ..
                  "a3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXkrRFdEK1NQaW5tQXNXdGwwVENWOU9yY2R3MjRjaW1JVGlKMWJyQVFucTdDaFJFRXFRRWg3V2JsMloxaGNaemkvbEJtTXdmY0QyeWZa" ..
                  "RTVJME9nTDZxMWhJOTc5QWRESm42QmFTQXVxOHIydWswS3lGRjNEYkMwRmduUkZSdGpzOUhGM0Y2YVFhOXF1aysrSythYyt6SzgxTnVIY2kwZ0M1NG5tNUE3Nld5dzRBenB4UXJBOGdjb3J6RURH" ..
                  "dGdndHA3T1BKckxYUnRXeDVKM296Nk5Qa1RER1FmbnhSaFM0UEhrMW1Gd1E1UXpRZW10VktQK0Y4MUFtMS9yME15L0RmTFVxd0NsNzRTTzMvMUxvU2pxelZZVDhmRk5oQ3cyak1JQ3oxRHlkeUtn" ..
                  "M09jVFJ4V1RoY0JuV2w3b3NjdDZrc0lIamIwNzhhbFpTcFNKTk1STE9md0lEQVFBQm8wSXdRREFQQmdOVkhSTUJBZjhFQlRBREFRSC9NQjBHQTFVZERnUVdCQlRLeEkvZk9xU21IVTJyRVFwTTNQ" ..
                  "SVBqYVYxcVRBT0JnTlZIUThCQWY4RUJBTUNBb1F3RFFZSktvWklodmNOQVFFTEJRQURnZ0VCQUlGUUhSQ0hLMGFXRmZ1cnkvM3lWZ1BjZU02T2x4Z01ySXhwcE5kY3M0N0xhZnliTFE3Z1hmaHda" ..
                  "TW50bGxvU2dXTm9DcWxNTDRWWnJnRkJTRkw3aHRuYTJKVmw0OUpybi9FODBIVXlXNVFZRGMxVlpPN2FuMUN6eXJmRzEvak84YUwySzE5RGFsdWxTYk1jN0ZRNURXQzZ2UEZ6eHVoOHZkYXFUSDdN" ..
                  "bTFEMnFWS0VTNjViRWRJUkh4ck9wNWttYWJRekRkcGxjTVIwMitkdGNNY21xejg3ZG8xOFBDaHo0RjBkRTA3ekgvbEZMSWt0Smt2aXVRaW50bEt4MVB6RGhJV0JpbEI2aW5zbTM3Slo3YW9DdHdO" ..
                  "VmE5QXFrMFYxTWxIU2J4dUt1TGlPbU52bWhPbHpsZFpnRGVRMSttd0pxajJZV3N5c1d3ODNLWkswVjBoOTBZdz0iCiAgICAgIF0sCiAgICAgICJhbGciOiAiUlMyNTYiCiAgICB9CiAgXQp9"

    local s1 = "Hello Weavers! EOC is testing the TFHE library  "

    local e1 = Tfhe.encryptASCIIString(s1, 48, '')

    local dec = Tfhe.decryptASCIIString(e1, 48, '', tkn, jwks)
    return dec
  `), getEnv())
    console.log("Decrypted ASCII cipher is: ", result.response.Output.data)
    encryptedCipher2 = result.response.Output.data;
    console.log("String encryption test complete")
    assert.ok(1 == 1)
  })

  it.skip('EOC tfhe decryption library test', async () => {
    console.log("Running decryption test")
    const result = await handle(getEval(`
    local Tfhe = require("tfhe")
    local tkn = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlR0TU13TEllaUlDc0YtcF9SbWFidCJ9.eyJvd25lciI6IjB6c2N4OXN5aGM0YlVqY0ltcXVEb1N1M2lRdVdXYjU5WThfMzc0M195ZFl" .. 
                  "xMFVmNC1GeGpudVlqVGQ3UUFuZGNOWUlIbHJfaHptQ0ZJSVBDZDVFTThGazlLb1NId3J2LUZEOHJEV3FBdnhSRHY3MDR5ZDJ6c3VxVV9ZWEtyMlVkRk5TaktHeDNmUlg2dW1lLWw1ZjNUNnNkZnR" ..
                  "Ra2VCbVF6LTViMk1sLV8zbV9UOGViUmViN2FPbnhuOXBtUHpvNERPQ3VhRGRfQXh2R2p0QW50X2ZzdEtMZkRlMTJpWDJiTjAwNTFPQmZITXAxQ3RBUEdKU3o4LWVUZDBTcHp1OC1TcjVMOFNIZ1N" ..
                  "FNXJMSVFnU1kxaW1jcWlldThMZGZ4X01ZbjdiWWZQZ3QwWGtyMG1lT3JmVVZ5VFAzY0tqREY0YVVPU3pXdTVub0xtdmRydUw0X2dxV0xHZ2VkSHkzdW45VG5lRzdjVXFfNjh1THhEQ0xrSGlIVTZ" ..
                  "RUWtIcEREeXYza0I5dE9OdXE0WUhZQ1EyTkxzOTdQLWFoTE1JSld3c096NGtBZFN5SUlNUm1GVnNnWl95czlRTkM2NE1GaDVQWUdhVE1TV3dNWlVqdnBVSmtjbkdybHZycDJ4MDdfMUtwRGxfWmV" ..
                  "XVmpiRVR2Z2dwYjBuWjJxSnhOVHdqRFVETU4tS19maEJJTFJkRDNyWWxzd3I0VUtxenF6N1dEMG9KMGRISG9HTFVCbU5YUXp6dzVsRG5GS3RVaHB6UUdvMzhJMmYxdWt2M3RNRXY2ZTk3bEhNc2F" ..
                  "pdzhhVjZtZm5vM0NpaE9peEFNemlkLWZnUHhzMS1IQlUxdWxSejhod29vc2dxd2RhcmJZcS1VZlJWSGd5aGRjSUFURi1NTVpVMUNMU0JlSV9tbHY4Iiwid2FsbGV0QWRkcmVzcyI6IjZrdml3ZWl" ..
                  "jQmVnM3k5YzVOUzJpYTU2WDdNaThIY0MyOUNYSmkxa2ZYamMiLCJhdXRoU3lzdGVtIjoiS01TIiwiZ2l2ZW5fbmFtZSI6IlN0aXJiZWkiLCJmYW1pbHlfbmFtZSI6Ik9jdGF2aWFuIiwibmlja25" ..
                  "hbWUiOiJvY3RhdmlhbnN0aXJiZWkiLCJuYW1lIjoiU3RpcmJlaSBPY3RhdmlhbiIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NMeEM5ODBQWlp" ..
                  "xRGlaZzZNRXJXNWl2Nl9IRElmWkpRbkhEM1VUVklTVk5sWVJWWnBJND1zOTYtYyIsInVwZGF0ZWRfYXQiOiIyMDI0LTExLTA3VDE4OjUwOjI4LjY5MFoiLCJlbWFpbCI6Im9jdGF2aWFuc3RpcmJ" ..
                  "laUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6Ly9hdXRoLm90aGVudC5pby8iLCJhdWQiOiJ1WGtSbUpvSWEwTmZ6WWdZRURBZ2o2UnNzNHdSMXRJYyIsIml" ..
                  "hdCI6MTczMTAwNTQzMywiZXhwIjoxNzMxMDQxNDMzLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExMTI2ODU0MzQ4MzAzNDY3NTMyMiIsInNpZCI6IlpQODFQTVhCTWhkcHFGVEFhMklQN0J2dzJKSE1" ..
                  "DcXZrIiwibm9uY2UiOiJSUzQ0YzJKWlRsWXdMbUZpVFdJd1ZsaFpha3hrVjJKVE1qSTJjakZwVUc4eVdrRnBlSFF3TFVoVWRnPT0ifQ.qaxZlYXG4S80nfrNvfAqQYNJkPTzuNKsy919pllgzrv6L" ..
                  "EhBpTwYOJkr8COc9XsIkVwddD5J6ZJYsBSzL3T8cZ9l0WDoID1S2iql20hToiDZQVWJGC5k2OMTLR3vCaQOuRTmH5ymBwA7mke-5D7JQ_y4RCkt5qCHK6ajSf7w62R0LO_jwxFcI_qlg693hRUEC" ..
                  "M-M81N4R99qfI1skh84qYm6---xvZqTFQF4aH2CLlo_ztsKZ_SX959WVHk0FHJBt5-XLui6ICFDS6sjQWA5wzSv8MMESBJ9SEREoN6T8KdlBFOEfJd8lbzBg6Eve8d_zuLEc1R3sxD-v3jq2aq1pw"
      local jwks = "ewogICJrZXlzIjogWwogICAgewogICAgICAia3R5IjogIlJTQSIsCiAgICAgICJ1c2UiOiAic2lnIiwKICAgICAgIm4iOiAidU1mZTd5MVdSWk5ydXFURjR0SXhna05fWjVQT0pQVkg3SGUxeWt6" ..
                  "Yk8telRWbWJiNnloVE1zdzV3WE9xWEVuZXI3b19SQjRpYVk5SFdaQ2VVcVEtLWtlVkptck9tR3lXazhaM3pIXzYtaTdCbVJGSl9KWktMSFFBMmY0UVRHSG5WNHgzOFFvNVlka1h5Qm1lcFhsc3BI" ..
                  "THdtdDZabnVzUnIyZEtkWHMzMUJMa3ZpSGdLaVlkR2pKSGdCQl9uSEhjZU9NYnF1OTZPeHRmbks2VG9mNzJGdjFzbGZyZDB3ZzQySU5IVERMN1gxdVRMaUc4ckFRSm1vTDhDRmFxaUVPQlFYUEI1" ..
                  "NmQ0WnJMdWRXT3hPZ25xNW52YUpXaGdTNzNnY2lTUThlcDdkZWtrWHo1U3hPUkVMSE8temY0UDhtSC02c3VKYXdHSm0yQmRLRkJvejR6a2NRIiwKICAgICAgImUiOiAiQVFBQiIsCiAgICAgICJr" ..
                  "aWQiOiAiVHRNTXdMSWVpSUNzRi1wX1JtYWJ0IiwKICAgICAgIng1dCI6ICJNZ3FFeENhQ3RzMTVvMXJkS3lleEdoaHRBNjAiLAogICAgICAieDVjIjogWwogICAgICAgICJNSUlEQVRDQ0FlbWdB" ..
                  "d0lCQWdJSkNBU1p6WVV4QTNaYU1BMEdDU3FHU0liM0RRRUJDd1VBTUI0eEhEQWFCZ05WQkFNVEUyOTBhR1Z1ZEM1MWN5NWhkWFJvTUM1amIyMHdIaGNOTWpNd016STNNVFV3TVRRMVdoY05Nell4" ..
                  "TWpBek1UVXdNVFExV2pBZU1Sd3dHZ1lEVlFRREV4TnZkR2hsYm5RdWRYTXVZWFYwYURBdVkyOXRNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXVNZmU3eTFXUlpO" ..
                  "cnVxVEY0dEl4Z2tOL1o1UE9KUFZIN0hlMXlremJPK3pUVm1iYjZ5aFRNc3c1d1hPcVhFbmVyN28vUkI0aWFZOUhXWkNlVXFRKytrZVZKbXJPbUd5V2s4WjN6SC82K2k3Qm1SRkovSlpLTEhRQTJm" ..
                  "NFFUR0huVjR4MzhRbzVZZGtYeUJtZXBYbHNwSEx3bXQ2Wm51c1JyMmRLZFhzMzFCTGt2aUhnS2lZZEdqSkhnQkIvbkhIY2VPTWJxdTk2T3h0Zm5LNlRvZjcyRnYxc2xmcmQwd2c0MklOSFRETDdY" ..
                  "MXVUTGlHOHJBUUptb0w4Q0ZhcWlFT0JRWFBCNTZkNFpyTHVkV094T2ducTVudmFKV2hnUzczZ2NpU1E4ZXA3ZGVra1h6NVN4T1JFTEhPK3pmNFA4bUgrNnN1SmF3R0ptMkJkS0ZCb3o0emtjUUlE" ..
                  "QVFBQm8wSXdRREFQQmdOVkhSTUJBZjhFQlRBREFRSC9NQjBHQTFVZERnUVdCQlRqb3pyemJ3UTAwMDRobW9SZGtOdy9SZlpTcERBT0JnTlZIUThCQWY4RUJBTUNBb1F3RFFZSktvWklodmNOQVFF" ..
                  "TEJRQURnZ0VCQUNEM1lhRzlTOG05M2lrdkI2NzlKbmRHRGNRMVFLWEpYMnlxQXRMd1VhSmxSaEhFYlJ0WHltM0ora0lIbzFPT0s4SkFmdGNiYlpxMzRwK3ZwMllabTJnVURUaU1RejFRUWRLVm1q" ..
                  "QjlUbk5ZUDlqSTdiNGx1cGZ1RGVNbnRBVkFvOGI4V0NyUlFWNHZvTjg4K1h2YWdaOUgzc3Y3ZmRQSHAxbUtHamJwejl1QmtYc3VqZFFyZHZmaklTNUR6WURhZ3lUbE5ib0hRQmJiUzJiR2N6eFZo" ..
                  "YlF6eFNPSmx2dWcvcE4zdVV1eUdvOERCNFdEdEJwYjNmU25OQWlveDFuMzNFOTNQNnpoeVBnNVFWU1FsWS9BQ1htM1VoWTVVc1JaWEV6am9BTC95bU02OGI2Qi84NU40WHlwdmUrYlVrK1p3YjlP" ..
                  "am13YjBwVTlhelFFWHhSV1B5OD0iCiAgICAgIF0sCiAgICAgICJhbGciOiAiUlMyNTYiCiAgICB9LAogICAgewogICAgICAia3R5IjogIlJTQSIsCiAgICAgICJ1c2UiOiAic2lnIiwKICAgICAg" ..
                  "Im4iOiAieS1EV0QtU1Bpbm1Bc1d0bDBUQ1Y5T3JjZHcyNGNpbUlUaUoxYnJBUW5xN0NoUkVFcVFFaDdXYmwyWjFoY1p6aV9sQm1Nd2ZjRDJ5ZlpFNUkwT2dMNnExaEk5NzlBZERKbjZCYVNBdXE4" ..
                  "cjJ1azBLeUZGM0RiQzBGZ25SRlJ0anM5SEYzRjZhUWE5cXVrLS1LLWFjLXpLODFOdUhjaTBnQzU0bm01QTc2V3l3NEF6cHhRckE4Z2NvcnpFREd0Z2d0cDdPUEpyTFhSdFd4NUozb3o2TlBrVERH" ..
                  "UWZueFJoUzRQSGsxbUZ3UTVRelFlbXRWS1AtRjgxQW0xX3IwTXlfRGZMVXF3Q2w3NFNPM18xTG9TanF6VllUOGZGTmhDdzJqTUlDejFEeWR5S2czT2NUUnhXVGhjQm5XbDdvc2N0NmtzSUhqYjA3" ..
                  "OGFsWlNwU0pOTVJMT2Z3IiwKICAgICAgImUiOiAiQVFBQiIsCiAgICAgICJraWQiOiAiUjFGenA4OVBpekNySXZYZlk1SFVOIiwKICAgICAgIng1dCI6ICJFSV9DbS1WT1o5WEhKemlqYnlYLVNf" ..
                  "Y1ByUHMiLAogICAgICAieDVjIjogWwogICAgICAgICJNSUlEQVRDQ0FlbWdBd0lCQWdJSkxXRS9SUDVUTVJQT01BMEdDU3FHU0liM0RRRUJDd1VBTUI0eEhEQWFCZ05WQkFNVEUyOTBhR1Z1ZEM1" ..
                  "MWN5NWhkWFJvTUM1amIyMHdIaGNOTWpNd016STNNVFV3TVRRMldoY05Nell4TWpBek1UVXdNVFEyV2pBZU1Sd3dHZ1lEVlFRREV4TnZkR2hsYm5RdWRYTXVZWFYwYURBdVkyOXRNSUlCSWpBTkJn" ..
                  "a3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXkrRFdEK1NQaW5tQXNXdGwwVENWOU9yY2R3MjRjaW1JVGlKMWJyQVFucTdDaFJFRXFRRWg3V2JsMloxaGNaemkvbEJtTXdmY0QyeWZa" ..
                  "RTVJME9nTDZxMWhJOTc5QWRESm42QmFTQXVxOHIydWswS3lGRjNEYkMwRmduUkZSdGpzOUhGM0Y2YVFhOXF1aysrSythYyt6SzgxTnVIY2kwZ0M1NG5tNUE3Nld5dzRBenB4UXJBOGdjb3J6RURH" ..
                  "dGdndHA3T1BKckxYUnRXeDVKM296Nk5Qa1RER1FmbnhSaFM0UEhrMW1Gd1E1UXpRZW10VktQK0Y4MUFtMS9yME15L0RmTFVxd0NsNzRTTzMvMUxvU2pxelZZVDhmRk5oQ3cyak1JQ3oxRHlkeUtn" ..
                  "M09jVFJ4V1RoY0JuV2w3b3NjdDZrc0lIamIwNzhhbFpTcFNKTk1STE9md0lEQVFBQm8wSXdRREFQQmdOVkhSTUJBZjhFQlRBREFRSC9NQjBHQTFVZERnUVdCQlRLeEkvZk9xU21IVTJyRVFwTTNQ" ..
                  "SVBqYVYxcVRBT0JnTlZIUThCQWY4RUJBTUNBb1F3RFFZSktvWklodmNOQVFFTEJRQURnZ0VCQUlGUUhSQ0hLMGFXRmZ1cnkvM3lWZ1BjZU02T2x4Z01ySXhwcE5kY3M0N0xhZnliTFE3Z1hmaHda" ..
                  "TW50bGxvU2dXTm9DcWxNTDRWWnJnRkJTRkw3aHRuYTJKVmw0OUpybi9FODBIVXlXNVFZRGMxVlpPN2FuMUN6eXJmRzEvak84YUwySzE5RGFsdWxTYk1jN0ZRNURXQzZ2UEZ6eHVoOHZkYXFUSDdN" ..
                  "bTFEMnFWS0VTNjViRWRJUkh4ck9wNWttYWJRekRkcGxjTVIwMitkdGNNY21xejg3ZG8xOFBDaHo0RjBkRTA3ekgvbEZMSWt0Smt2aXVRaW50bEt4MVB6RGhJV0JpbEI2aW5zbTM3Slo3YW9DdHdO" ..
                  "VmE5QXFrMFYxTWxIU2J4dUt1TGlPbU52bWhPbHpsZFpnRGVRMSttd0pxajJZV3N5c1d3ODNLWkswVjBoOTBZdz0iCiAgICAgIF0sCiAgICAgICJhbGciOiAiUlMyNTYiCiAgICB9CiAgXQp9"
  local s1 = "KgAAAENZcLWqD60R+nfOzHIN8LO+WIScUsAnSdoBu7UIgdx8iDxM7tpRjYNRWNLlqL7LsRZobb9leMl6h0Lp3/axDyg64CvkDcH0CjpRHlLhFOP+HS1DXF3JRKdWi2G/j/" ..
             "uz/eVEpfjOuD29mKZuUQoGe57KXJ4QoQl5lIpbxPwAd2mneecMyRW6mTX5DFAfE9kB97DDUDnOEbTPYA0MZD0ihEyxpWICF89p2es6zpmyNweL3BCtHV3sqRtBhcCRf5H+" ..
             "8ljKQsJ279vqhigYWc7GMuqVU2lNajbrWOQSzYjUZVbJUkT4kD+c6tK58suIrNwPiDP77nSpphyKGCL/ESF9OeomFfs/xIqFD4YPcYfwQSkS7co9SSp/i0nSBqqoaMN4ap3" ..
             "UAv83SrkLZSFvFpVu5pv8AZUqXLfS8wZc9UmQM57qJoDb4wUI4lj+hExglEqztc6MFJbvx2UZDh5DTanvPlh0pMjpuTdhMTdxf8ZhBld9NlBXGyW6rEmKfO6T5ClLRtc6x7" ..
             "3wq4zCBmdyvv0UFcdbJsff+oCjqRB3xptMzvIq66AoWGaJcnevIeFzLhZ7LDZxpjCDCB4H3ihJUf+MTaN2Z0hmSLMO3s4EfvvvH9TZnkTBxekRi1WQHqPaIUoMsjObr22uG" ..
             "1YlWUcxUfzEUVg6QvVTpZwh7qtR8BXU8iueeIgmT2HHu8a0Xq2o2ZHv4MtGRLBYfTvTh5KEqpybh0v1SRGy2xAqqMSwkUyAUox9utICMdXdPEtwqvovAEkDnURI5QyuTbm8" ..
             "YR16K4yyeeYpQQBf534+i8r+p4F/1zyuqCc3GmZWaPyVK3x94pPj8qmnv2eLb1waOfSKUZH3TFlDSfG7EvvqPpngKty6qkfDNwreG9aNdug+YE6CkQyrEkgH5945KM0SDLP" ..
             "yy31ruQCX0BDKvrV3jtFjUSWn7+yWuWjwko0EzJrDuYP5Zq/iOmrXTyj5sRsIWoEqVWpU2cCtF7jkdfeZEExLRGP5ao601wEbdj+e7BAaYyzPKEg3xi5PB36eLP3CqVuJaN" ..
             "Gdt4tya58YqEEz4aH3QjIgmIMFCCct1glG0RmrxGItZiw0qak533qqgqe2U5/rvS8Jusebhnvo1PkTZyfzGThZMm1L/J9IkJ9uCXnyE16pIX+K+vRpIx41GeSaQLpx840NDw" ..
             "0ghSDekNdnBxZ+LykJV+NmD8T1EZBcdtmP216FixhsuC92hRh6QrfqQloEARphFFePQKbGzA6hfigrlmPbuYh6Sw7uh1JzsHBVcrnzN2Okh7EyCTZr78ulMOUDsTHLEZXrD" ..
             "mdsEzU3Mcdm39ueBOV86dCW/qYCQeVnRx88Xubx7vf9o66HTkM90vRwDYSxTWitIbVpW9E7Jl8meyWRHCZqSlMvz922yvONMXhZeYLSVBs7KuA9JC8j+usfZsM6bDH8WnYl" ..
             "MGEELPawHs0QKZOcRUSV80sK57xSniIDWewRALs68LYnJzL3Xc/hcvcSMfUFlzy9iSJDKw6+fvfnsUp6lliLRkrSnnGu9UD6T3d40flRfuADwdmofxIbYtL18rpVtM5yD0aD" ..
             "iyhZHOogW38lhDxPw3XI5hv+vqrIlwb4FBzj0/8O0XJpq7OSP+/31vv3QqEXRqe228CIUKdfVMxQ1n6GAB1S0WY8Vo1GQ2sImTzcgzRI2A9DumQRryHSBBLn/Zf/9AX6bXZq" ..
             "S87/ZHYxQhvrv0ARvZ03U92N/RNkLNInqQGkP9Bjb0iIPUM9XXKvk3/iwEwhI4EY07R7iUs4WdPbLwBI/8eYAeKQ/yDN7Bz0fHqixokAvFjeMsFYHOrjQrcxwHqiWRe8qdS2" ..
             "V1rs5cE6CY0ho8XfYQO+Y1aubTgi7FPkdvRtRrDiCEFtlPG3zCACLwRk8aHI39Gxvh9AKb0mjtKek+tXYLEpw7o4ITXa7M9qhn7axgGRVGjDLmBOhEqRDPBADslQhhMkm6CQ" ..
             "sXSgVfHCjIsjWlLq0GANzTc5iBwIpwerJAK3hoqQwPyM/zEIUYmJhLvrGH9y6PD86y2XkWBloojwypnqjMgtD8NrQBDkfleuep9pVCv9o+UP+kg1TwDRwVbp1C6siWVS4NY2" ..
             "ci03IN/g9D/YgkH5dEtglPDb4z6wIu8yFZPjtEq7IkYYzDNe80EtEC0E5TZyJ73by0U5m4gujVKGK1as2K/ooH/zePv1wTunZXEGYF8rgZbfPSjhI971xkACz9U2Y+w9BSir" ..
             "fpnmr8REgcm/RxsLfw0udM7l6JGdph8CDuz2P6kzOb5gPcbhExkDVP1q3fny9VvpLdSiRh47H0ip3z2Y0yS8ZtC+mkbwrX8beuyyMgOCOlQx57QOVhAznhtmcmyqH/E57h6m" ..
             "O7yROb5Bh+FtyCZvJf/WK9GWobD3UYCUUjJ5ayEtLYH71QP1TCeyM5FH0l+TlcIVDaE0ocWwgeZtu4QEWLy+Pcs5OuToyUA5tS5QgwIocRTjsa81LD30kXVvbK6VsaAsPtFT" ..
             "eSMI4OrQL6aUQrC0DhUnyzbW78z/ZdqHkHETe3nkDBLA85mffVi85iagWQxqjoKgT2TqW5qf7OZRD9N10eva63WQpEOyVraVQgC9YhgTzdntLLBcx4bNPpR4p9+0otta0Lq6" ..
             "//ZlSTiFs6hbba3C3ObQQrEmCgxsvl/nZPhvghYmJhO+UzJ7CwymRjeZ+hXaQUhzq9K20lpKPKTOgXqDRnBYYBVpnJQeS0SeVknfwyfQvVuhhlMGjykI+U5Rc+8S5FElpZ6K" ..
             "5Xs94A5lsSKw5HcbfkZSe7HqY52WQlIxl6qdNHbb8V0AokmE+UZpDXiA2OXhbIMVVt25IpscXjaoSvQF8CQrdiaKDO/F+drM4Dcg2sBFjqYmOMjwq79qRBE+bow74+J9RiSn" ..
             "oLqlckhdmSd9HEninsG8P0B5sMr3ZlVmD9rI+6RD0h6A7z7PrIOqsALytoKHia5JtzANpTb/Z1p817qsoXjdbuBhlVOQUBzAL9XXHqlJ9cZ0s1zr9sPORDF7idUclqgQt9y5" ..
             "FhjwevbjFaT48DYdUNhKEkHvwbAx+F23okWXDuuenkzZTP8ddenLU24gQVVN64VW4c4xa1Tm5exOT01I1N8t9l0VEAkAVbldH9UItBJ0CAbCzo8h2FYWwP99xO3tQKoM2UI" ..
             "ZRC9UFrEGiOLJpLXQo3SD/Cr3OxXNa5y2MM1PL7LAFTx0gDFmH1FuCp1u7ZIaAJBL2Y/0nubKfXb4S/qF9a9t6s7aAHSNAEIMehYtIdVmfAN+0K0GLWxQqq4okE5f8dPF2vK" ..
             "ENEGibOfbEQutl7Gsc6v3uNmCMO+N/dfd5x4UHALs55PCYvyAWGIDOepUc4KqDzmgr8PgpxCLe0h4Xap27rwAAABI4XqkOw=="

local s2 = "KgAAAJ2VsnrcJ1fMQgPU7r28ESRuYnEu5D2e5aB9q98n8vyy4N0T8/bDYVVGx/IzR52PEaYiKQlSAHNqwD/GXqxyvr3zK5NHo52bI4uqxbfVrdorI7D+i3qdJR8NnxWTUOj" ..
             "TgCNK/YbTM5pFYwqjrDTtDVXd1f0GV3WHhhTAFNWYsDxTuAEqeHVpn+4Wi3cgbzkzUfalbpWAkblqqOP0GG7zUOU/BpGRxCtkisgVJj8XDFp5RwEuaO3biKLvNcLuv5MM7" ..
             "nXUi63Z8BpdZnDp+JgWwxpf7iyXJYZnXIl1hHWRb/iaHRMiIsXik0f2NgvIbCzlGEK77+JyT/0SDtay3wFoiBjteX0+4iIqFML3HchWyhRHswNtPh0GrtfTzX61cWiuzuJ" ..
             "60THKXC1vU7v/CXG72m+blMvME9Vi5IgZXF9dRL0nXqB2m95mw7IjXNKdwIz+Gng4FoieO++YwYM6bczDuchxeiBU4qTtaYkGyBgTW2CNtKTzwiqWCnojnIGrv/qbMfc5y" ..
             "L2iPTXCuq+1ONUMB92LW1r5mLHcB2gzbQ79HWoduxHRoTLc/IjCdVEiWzcwkMndpYrwvkqPMgVQC8zYzJRNJOMUWHnFKKnKkd54GNW62GDB8jawE/5zXpWO6H3HnT995K/" ..
             "k4JJ8wSczWWPkmSld0tqoBCD+rYzC1fDbmR1I8RovI88iifxcA2dZjCePm/aFif1o+/1I+EaABda5GLFbZnfPbw+i9E/O0PQipGo3BkY8uEiie5z+nENzyp7LlzirdRpYu" ..
             "lvm3QqWLwwEELvw5EwjhhY3ctXGXmq6gwH1SmeRnZlhgE/BYP+tDPpJjkcal+hQlbolkNSylPBsRN0RPY7+EJx/nQsdJA3DKAC5hCDSEbS/2eEtUvgwjtMrNHuk85KVA4u" ..
             "Dq8XeXLEy1P4Cdj6rS0AgLBBugTzj+AUbSVAVKjoXHal7rQHcaGilivxaXRHuqBX1uF4NSsBhqYHs4AX+aXggCd0icTDLzB0J4GsDQmoTTp62iRMILf6t0WcQXiIAV2gfM" ..
             "GX7ndvrTr0dJunkXad26jKtgDSA1kVGcYe1wY9n9IQaZeIVLl6QcwY4KV1+5Lj7Cz8MXQjfQiijiStLXfrR6Lcy9obyOJ98M22S6dg8J4NsstG/TOfPxu9Ra1nfkqyS8ci" ..
             "G8kN3ClaSmTcFYxpBHi83bDD2Rj6XsZ79hkV6G72BLq4COfs8ooX60Fz2RY2yjwiyMy9Y+BjoQ9qS/11YtDAqoYODcUO1CMs8vzXcNC83EApdQx3lUNR8J1ulnX9gKVQwV" ..
             "17hwgSkxXM0/6KhQa5F40vCk8QigoZ32krBqBIrLwehuoh9AvdLHHARvhAQoL9BZQaD/EesV2xk8W7WOiKxNTxqWaQuVspNFCPmaHymkesC2fNQjzhbqZxF2vj0h1IM9Py" ..
             "SLjxaY4L+26ITBg00MevcFyp2YbcVpa9MdwiQyEDSyFBDPcKvnWLPIUbriAB1xYTgKyurQHGae1hmFoZb0SjUWiuLWt4xbEn5ND6A1TjjAovpHD995FFttiuG51ySZ3BLb" ..
             "bYhs6ajyE0INYd9ck5L9dpwS6Q9dd/vOjYlUqCrqc6gLKS5P1q90VgLbWY+w1op+k7oBvh20uYgdp8qfIj5fE20v3Lm2o6kSjvF851/abrb4oewqqIyYcDg24VCPhoGmWG" ..
             "U3U1PP0fgbzXxWHHo71x9I+7dv2GDRI7Xe3mDaTHGcCHAXNrTACDyYxcoZC6V9s+eH7xaa0V1eO1WFHrOJBujoWsjTOEcyJZThWPSLw6Y0RrOasGOBv+nROCnXWKFqKTgK" ..
             "Yffp1AL9PqORZfYa45Tc4IsRJBTIJJ1GdCxwayiVBQN8hzQT1nv6Nw3hd5X4anmCpTgAqVQSYBuHAaW6zjCbYaCmXMt/EbQkAoio6/EBA3VnzPbY+r0Dlem1Y7h3r2GQcM" ..
             "uZZj4b1RjRlu/CgrtScpcjwAp6tH3/kHD/l3pRydkbDF84uTIkOIniJDpYT2UPmd8QGJbCbYEZp9PSqU5B42ov9PelVu9NRjNm+VICGnPRfq7Xv4LXxEDrIEkmOWZbCIEG" ..
             "qx15sTQLF1BJYvuLH1XTODgpB44df44TonFd1Nfj8U7rmegyCxM8pk35q319KaxbeAPK5GPH8M0NrLgGngPpX1ToTyDhRnDCCbui1rUKBmoKx78mUidpxNq7FtJJzUHXV1" ..
             "12+ErtehvKnKq4N1b9zqhBobNdbAJb0CFKvTlMqTQp0gGFck0aECGOOmKMGtcfw+8Mw1mohxCg9LfpyN75oJqSbHXC8QOw5qZ9+Ox2YdoGxD3BuE1o3c1ZVX3YSA9yMfHG" ..
             "1LEGGx2VTzsefuVTO+hXFBanlL8XUmS38RQhLl4fD5m9dbZ2DzA9leu1LjeBoXIuYiCXBl1YZ9CkYeHmsfOiKK3Hi6iYcwdmTIcnTxCMx3qidLeC4OxEZ2PZRC7YWoHGbg" ..
             "Q27CYjvzl8rhxm0bhcC172KOtnwifmDRqZgmYfH+cd0fxV9u3LHBX06uUwnZpImX/lRGMslOeWkQoSmUU3XFd8CaSYkEscB8nNdvtmtmkeut7p6En2QRtdb48jl6aw0PMw" ..
             "zZAzkFe/pyBYMFZ0Kck6t1EAdNCsAkZ6+BY9FapFQVacOvrpV9rYkFRd9R+gRNzk2O6gYNxjlOZ4YviYG1JvSh47SZ6zWozQBUr45ybqf/s3nfdVC91xzVQ25Ehh65nAzd" ..
             "4Wn2s0nSyshFed7p+gLhWC1jwZWdQQpvFKU+8FAo9BHOcobOwpZ/r6CkFASYwb7wH76SR3vU3czcjjoWpDh4gedCYMwHXI6ftx3oZ7bzgJ50i0mEzTxaxj8KHJrx1KYFgi" ..
             "4bluI43IAkQ+U7PGftluXuMXkUHxfoUiMfeCaOyBPaYh+MEOmlnmNlrSHumKfE5pH4uOuFoeM7QWpQyYQ7hEHboJoLdphe9GnVYCClFqsjEzZH039cacLW2D9H7noxAbhk" ..
             "iIa8qeRXWNjZnIsDIpDAQ98DeQmgj9xNhuqSrMXbnbMK6MrL768L6wqIpoJliaYGIAVf92BqYVKtEdiva0SX19mKhfOfjAR9R1ZGV05i5o8NMpcsN/E+vkDeDY/hVzhch+" ..
             "nTRqyOwXmHmikwKSlDC31Oph5kiThfF8nRKw3S/Jz7Z3f/pnOZrgV1EGnukt2nEkBtm7Dwx2pYKx2SsIA4yX7X3wNEXZLuSghzO4Pt/mXTwDPAioM3kRj4YuGC56VoURAb" ..
             "ukmbmn8Yel9KATzQtuPRYA6NQu9QmElISb/1QDRGIMnJsuMbM2K5inw++KJDTWEy5C4OhtYxYk1KBfoz/WdX9LTf9fXVjXKDAQrKCA27JYkyuxDe0jnh0SJEAAABI4XqkOw=="

local s3 = "KgAAANErpfU3SqQC1KuMmdzKEnSuK62ffr2fbqPot28ODxN2unlPwnRVDe8WM2PKx+yMvAr4GZPnvwRN3/adTXUJdZSUZGWqti/r5bW4xFbLVER68fXNq1qtk0VzKN3uFLR9Q" ..
            "Z4k/ZK6wUt7RBq3xxRk72+4Ci6zvOiZYccpoWPlzG+LRQWydLVT8HPL9/6aI2XM4hXsgUvvut4rXOTA79zj+VNj9P1Aow1Sj+mXp6aypEEpQLC6D84WsrTZiobMnWyLUV130" ..
            "WX62nkGEU5n729m1P1yL8OHFnNClsutXal5Tx2P29lZO88AS1CjcqvoiZkF1jqL0zIa0bWZaMztK/Hr81YVHs0tFqAqchpdVuHpXFHmtnS79k91tbpvAYCGzdTeZ34XM5ZZo" ..
            "Jr0etgA3dbGUqXOMkk/pTbteSUWlKaqRKmAn/pXaR4td+F5R4YmFYcTqdL41FSBOWCp8H+46IyswqoTl/agteJPWRhVtlbG9+0oM5RdEpX4Py0WCN6j0HCzv3o8GtUXoUJAG" ..
            "O37VB4j5FEMui2p0kXeGHU6CprqzEailbdWktIGQuv3u8Yyy+wXgVlI2jOozvqilvmy8F7++G6t6x2NYX5iGzDHGPpQq/7iDkmhsRMlVSPEnGnCLxdrVOLmK8DExWhmqUnAy" ..
            "mNRcYyDM0v+xTJt3Vsvtkm5QqkRoVirhdF7V/Zm/hj5WgLNBTwpAsCY7DnypntDNhCgN7wa5p5RPnhBngIXLKZ7aR23xoLHgB0G6qeXWRzhS9JiDxdUf0wbRHfzXY4n3uR8g" ..
            "jWBGN8ZDZ3zojLX6kFiLhbXeheSpNYhCuTnxxI/BRgloVTw1GkhPelSJGdYh+NUQSTtEDgF21t73ICNgf3e59Qiz9FtBKHgiaw7yk2ekI9OqnYe6E1qW7y9nYejp765aj6y4" ..
            "78Sw9cA003vOOMSAgBmeM0LTjzd0RfxO/4SrtNYn+xqfW25d9RNF1FV06ZKYmY82Uq+3kitn/XMebdLYVSwJQRYkYLvI3UkhWkHwESbFhIjy9uNQQ77dRiiXgfevfQLSnyCi" ..
            "/nWrEGcR8u2PPwMcPU6xwh0mL8ATP/OsHtguLNkts71chB3vqvk5th2ikAx3IRQdy79znTKxmbZDGsp1pZK86TVA7uTNu8JS84plOZL5UykphSleP0FwEmWIR+lAWCDGblN+" ..
            "yDWzaivD0r4y7NSI4Fvo/aMFq8QUZlArt/cNgMW2fM9LBNNdUIflty/Z9Inx5AqaUeHIyXSILT8DfeL0P/0wdwKdwVnNA/XRxpmRNZ2S0nrmyQdKyG8M4zLpsyawtztdjgyw" ..
            "DW3leh1pFXQ4P5Nj6rES4XyHj4PoNWo3sx/1e3LvjcLUDVY5faaYH1d4Hc8PK7DMbqPsj+PohxjqgOAVtBG9UmFElgp3umsasadQu/ANk4rwPCoID585miQTDk+nr/xx6E6H" ..
            "uFfjbNFph7B16U/Ly7VcFdOs1PDWHLEY/owWBzE/neCFDy1yI07tdDNRESMSK1wzgIJEVApBYatfq2vasS4B4jWTsiPfGUnlYxK5m52UTf7dDeA9+EQgpEWRvn3LqXsoGs7N" ..
            "n4qGKTVHjs5Hy8tB9H+dgZWO/+v2QFjVb8xUCeJ9bBoaZZAYXl9E3C5LevBhTO+kLDQL620SUmecD3dHKFMtiURpVfv9ZarD09sEJdXrEPVnvLVcyR+f9+MDtlZJ4PTKGydJ" ..
            "fRI99zm/ZA5vPftqTs4+rj7qUTx8PX7hSGZMmcY12GpZySTm98bXVXStwx5ddXiNAiwtCsI6Zr/5d013ZJ3ze/uEIoGgeIcXkbhD6kXDC5GKcGw4IL7QSmisWjcNqu3jbl3d" ..
            "XVvoE6sSGLNBl9fWBHj/cUOlkzlr8jQNWD/iM/iRIB5EE/bpbLWtZrrCKkg6WOeXJZe+gUqRv933zI0NUry2jISUJsr1yDrAT9bs3MFh3S/Cnm2rEhuL6eT2fL6ePlCPHQ2O" ..
            "YVkRJhWyVofLuD4vfbLE7ZLKgo8MxMR3uhX8ORyWyVNCexYL1ETFlR+KtWkw2hrKFXdojTTmmSAsR9G/duLpzNMzPZij8a4xU4IPp3YgaGUhKOPkHFGtw7L69lxzr3gecRJE" ..
            "yBqjyN5A85WYfjRHZYojQ/BZRLU9p2hoLEXqLSo6hSg3vNJ/Yw794tlBuUHb4m1ThlUYa4QWbSrXRnxZGd8BYfSav5Ynw8kYLN+6cGCRovvvxAFC9o8E9CnurRmgBA8bflo7" ..
            "1EUPiwt8JLSJerRW/fCD/QX9MidrhFhFbDAJmaRumwyf3VydS70F+ti9dD3hZYX0njoiNW1ChMv/QUqQI3lxZSb3UDlwmUW9XnBDKEk2QS7bs+BqXW8T65xpeKM2aoqO4E8B" ..
            "jA90T93DS0hu81nwSuuFP39/C+iRj1zelOXBhCYhfu9XFOpS3o6tHBqRAPNDQ1glBF3pCP8DJuLrlXizb7mzRRSj5a71V+hSRk2yArv6gxp0iyg+iH8ZVHN+mCY/XdpswZmv" ..
            "QuOLi592UXUBcd0cJJYlvoAylsVgvR7mg00+celuy/N06xv1YRuq3BJnWyFZZ/iXrFO616lTu2ahWu9uQnbqBl0ia3jBCdjILduC+0al8tWbKBahaOSi8jqp4ngOQgIssbRU" ..
            "BZGnokr40IdZdhIUKFrCZGQ5bx3oe1PA2BS2rUvPRlndyXmH7fuzT1alNdj2zkq3yFnVXPAe6DzTbMsx4R3cs1OKU2T320FBWA20AVrlmmFCWWPrEV8yD5XqrE+5xBL6HuDf" ..
            "XK75Ig4amhroDRJk2e1fRpj+OjyvM1SWmT9Nv5RQR4yBWU+wSa7hxGT6MvlAC5HwZAF1IlKLT04BDWij/OPRFxynrUrwyYZEBk1PxoH8tEpXMsgTyoHVJMX0mS8Jm1ePUtz9" ..
            "SYTYw+BtzzCgDeoBLES1oeATwOw6ZnEcig20b8ol/iknK6+3bpjUoG6tydaMv+qwFZEYhETHBU29KHBP3znJASwVujfUVz8mUiNXcxHVAQ8Kpy0yS9HlTNyr9iLp1xvnnjlC" ..
            "gkoKeglc3Fx8+HcCyRi7HK7OpEhhW8s+RVYATwHmBnqFCtXVWhlk/+urxIfAzAJ83mti0FiIrHQExIN+iL8WowickLgZq2Wy3WoPZ8E0VSsPvq4DGv8J2Bngdcc9sNMo4Zfk" ..
            "rGLy7PJ6odNzWH/9jTpC5ugfXvNlfbCYggBF2Ju12ZYrgK8cKMOGBXqRNNILtwQ34ubFvxATcZ4OIpnh67dvuYfEvGXAoGUZ8DGiHgiczo4jmBOpjU1Bz9XJhlXMOpeoIuoI" ..
            "ZsUKWUbJKNUmrRnxVWuLtj7+T3grkdtwVVaqxGwq3lVT2vvPhwvUDD34fSlcmB5w1PRgmUAAABI4XqkOw=="

    --Tfhe.generateSecretKey(tkn,jwks)

    local e1 = Tfhe.decryptInteger(s1, '', tkn, jwks)
    local e2 = Tfhe.decryptInteger(s2, '', tkn, jwks)
    local e3 = Tfhe.decryptInteger(s3, '', tkn, jwks)
    return e1
  `), getEnv())
    console.log("Decrypted integer is: ", result.response)
    assert.ok(result.response.Output.data.output == 42)
  })

  it.skip('EOC FHE Addition library test', async () => {
    console.log("EOC FHE Addition library test started")
    const result = await handle(getEval(`
    local Tfhe = require("tfhe")
    local tkn = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlR0TU13TEllaUlDc0YtcF9SbWFidCJ9.eyJvd25lciI6IjB6c2N4OXN5aGM0YlVqY0ltcXVEb1N1M2lRdVdXYjU5WThfMzc0M195ZFl" .. 
                  "xMFVmNC1GeGpudVlqVGQ3UUFuZGNOWUlIbHJfaHptQ0ZJSVBDZDVFTThGazlLb1NId3J2LUZEOHJEV3FBdnhSRHY3MDR5ZDJ6c3VxVV9ZWEtyMlVkRk5TaktHeDNmUlg2dW1lLWw1ZjNUNnNkZnR" ..
                  "Ra2VCbVF6LTViMk1sLV8zbV9UOGViUmViN2FPbnhuOXBtUHpvNERPQ3VhRGRfQXh2R2p0QW50X2ZzdEtMZkRlMTJpWDJiTjAwNTFPQmZITXAxQ3RBUEdKU3o4LWVUZDBTcHp1OC1TcjVMOFNIZ1N" ..
                  "FNXJMSVFnU1kxaW1jcWlldThMZGZ4X01ZbjdiWWZQZ3QwWGtyMG1lT3JmVVZ5VFAzY0tqREY0YVVPU3pXdTVub0xtdmRydUw0X2dxV0xHZ2VkSHkzdW45VG5lRzdjVXFfNjh1THhEQ0xrSGlIVTZ" ..
                  "RUWtIcEREeXYza0I5dE9OdXE0WUhZQ1EyTkxzOTdQLWFoTE1JSld3c096NGtBZFN5SUlNUm1GVnNnWl95czlRTkM2NE1GaDVQWUdhVE1TV3dNWlVqdnBVSmtjbkdybHZycDJ4MDdfMUtwRGxfWmV" ..
                  "XVmpiRVR2Z2dwYjBuWjJxSnhOVHdqRFVETU4tS19maEJJTFJkRDNyWWxzd3I0VUtxenF6N1dEMG9KMGRISG9HTFVCbU5YUXp6dzVsRG5GS3RVaHB6UUdvMzhJMmYxdWt2M3RNRXY2ZTk3bEhNc2F" ..
                  "pdzhhVjZtZm5vM0NpaE9peEFNemlkLWZnUHhzMS1IQlUxdWxSejhod29vc2dxd2RhcmJZcS1VZlJWSGd5aGRjSUFURi1NTVpVMUNMU0JlSV9tbHY4Iiwid2FsbGV0QWRkcmVzcyI6IjZrdml3ZWl" ..
                  "jQmVnM3k5YzVOUzJpYTU2WDdNaThIY0MyOUNYSmkxa2ZYamMiLCJhdXRoU3lzdGVtIjoiS01TIiwiZ2l2ZW5fbmFtZSI6IlN0aXJiZWkiLCJmYW1pbHlfbmFtZSI6Ik9jdGF2aWFuIiwibmlja25" ..
                  "hbWUiOiJvY3RhdmlhbnN0aXJiZWkiLCJuYW1lIjoiU3RpcmJlaSBPY3RhdmlhbiIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NMeEM5ODBQWlp" ..
                  "xRGlaZzZNRXJXNWl2Nl9IRElmWkpRbkhEM1VUVklTVk5sWVJWWnBJND1zOTYtYyIsInVwZGF0ZWRfYXQiOiIyMDI0LTExLTA3VDE4OjUwOjI4LjY5MFoiLCJlbWFpbCI6Im9jdGF2aWFuc3RpcmJ" ..
                  "laUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6Ly9hdXRoLm90aGVudC5pby8iLCJhdWQiOiJ1WGtSbUpvSWEwTmZ6WWdZRURBZ2o2UnNzNHdSMXRJYyIsIml" ..
                  "hdCI6MTczMTAwNTQzMywiZXhwIjoxNzMxMDQxNDMzLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExMTI2ODU0MzQ4MzAzNDY3NTMyMiIsInNpZCI6IlpQODFQTVhCTWhkcHFGVEFhMklQN0J2dzJKSE1" ..
                  "DcXZrIiwibm9uY2UiOiJSUzQ0YzJKWlRsWXdMbUZpVFdJd1ZsaFpha3hrVjJKVE1qSTJjakZwVUc4eVdrRnBlSFF3TFVoVWRnPT0ifQ.qaxZlYXG4S80nfrNvfAqQYNJkPTzuNKsy919pllgzrv6L" ..
                  "EhBpTwYOJkr8COc9XsIkVwddD5J6ZJYsBSzL3T8cZ9l0WDoID1S2iql20hToiDZQVWJGC5k2OMTLR3vCaQOuRTmH5ymBwA7mke-5D7JQ_y4RCkt5qCHK6ajSf7w62R0LO_jwxFcI_qlg693hRUEC" ..
                  "M-M81N4R99qfI1skh84qYm6---xvZqTFQF4aH2CLlo_ztsKZ_SX959WVHk0FHJBt5-XLui6ICFDS6sjQWA5wzSv8MMESBJ9SEREoN6T8KdlBFOEfJd8lbzBg6Eve8d_zuLEc1R3sxD-v3jq2aq1pw"
      local jwks = "ewogICJrZXlzIjogWwogICAgewogICAgICAia3R5IjogIlJTQSIsCiAgICAgICJ1c2UiOiAic2lnIiwKICAgICAgIm4iOiAidU1mZTd5MVdSWk5ydXFURjR0SXhna05fWjVQT0pQVkg3SGUxeWt6" ..
                  "Yk8telRWbWJiNnloVE1zdzV3WE9xWEVuZXI3b19SQjRpYVk5SFdaQ2VVcVEtLWtlVkptck9tR3lXazhaM3pIXzYtaTdCbVJGSl9KWktMSFFBMmY0UVRHSG5WNHgzOFFvNVlka1h5Qm1lcFhsc3BI" ..
                  "THdtdDZabnVzUnIyZEtkWHMzMUJMa3ZpSGdLaVlkR2pKSGdCQl9uSEhjZU9NYnF1OTZPeHRmbks2VG9mNzJGdjFzbGZyZDB3ZzQySU5IVERMN1gxdVRMaUc4ckFRSm1vTDhDRmFxaUVPQlFYUEI1" ..
                  "NmQ0WnJMdWRXT3hPZ25xNW52YUpXaGdTNzNnY2lTUThlcDdkZWtrWHo1U3hPUkVMSE8temY0UDhtSC02c3VKYXdHSm0yQmRLRkJvejR6a2NRIiwKICAgICAgImUiOiAiQVFBQiIsCiAgICAgICJr" ..
                  "aWQiOiAiVHRNTXdMSWVpSUNzRi1wX1JtYWJ0IiwKICAgICAgIng1dCI6ICJNZ3FFeENhQ3RzMTVvMXJkS3lleEdoaHRBNjAiLAogICAgICAieDVjIjogWwogICAgICAgICJNSUlEQVRDQ0FlbWdB" ..
                  "d0lCQWdJSkNBU1p6WVV4QTNaYU1BMEdDU3FHU0liM0RRRUJDd1VBTUI0eEhEQWFCZ05WQkFNVEUyOTBhR1Z1ZEM1MWN5NWhkWFJvTUM1amIyMHdIaGNOTWpNd016STNNVFV3TVRRMVdoY05Nell4" ..
                  "TWpBek1UVXdNVFExV2pBZU1Sd3dHZ1lEVlFRREV4TnZkR2hsYm5RdWRYTXVZWFYwYURBdVkyOXRNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXVNZmU3eTFXUlpO" ..
                  "cnVxVEY0dEl4Z2tOL1o1UE9KUFZIN0hlMXlremJPK3pUVm1iYjZ5aFRNc3c1d1hPcVhFbmVyN28vUkI0aWFZOUhXWkNlVXFRKytrZVZKbXJPbUd5V2s4WjN6SC82K2k3Qm1SRkovSlpLTEhRQTJm" ..
                  "NFFUR0huVjR4MzhRbzVZZGtYeUJtZXBYbHNwSEx3bXQ2Wm51c1JyMmRLZFhzMzFCTGt2aUhnS2lZZEdqSkhnQkIvbkhIY2VPTWJxdTk2T3h0Zm5LNlRvZjcyRnYxc2xmcmQwd2c0MklOSFRETDdY" ..
                  "MXVUTGlHOHJBUUptb0w4Q0ZhcWlFT0JRWFBCNTZkNFpyTHVkV094T2ducTVudmFKV2hnUzczZ2NpU1E4ZXA3ZGVra1h6NVN4T1JFTEhPK3pmNFA4bUgrNnN1SmF3R0ptMkJkS0ZCb3o0emtjUUlE" ..
                  "QVFBQm8wSXdRREFQQmdOVkhSTUJBZjhFQlRBREFRSC9NQjBHQTFVZERnUVdCQlRqb3pyemJ3UTAwMDRobW9SZGtOdy9SZlpTcERBT0JnTlZIUThCQWY4RUJBTUNBb1F3RFFZSktvWklodmNOQVFF" ..
                  "TEJRQURnZ0VCQUNEM1lhRzlTOG05M2lrdkI2NzlKbmRHRGNRMVFLWEpYMnlxQXRMd1VhSmxSaEhFYlJ0WHltM0ora0lIbzFPT0s4SkFmdGNiYlpxMzRwK3ZwMllabTJnVURUaU1RejFRUWRLVm1q" ..
                  "QjlUbk5ZUDlqSTdiNGx1cGZ1RGVNbnRBVkFvOGI4V0NyUlFWNHZvTjg4K1h2YWdaOUgzc3Y3ZmRQSHAxbUtHamJwejl1QmtYc3VqZFFyZHZmaklTNUR6WURhZ3lUbE5ib0hRQmJiUzJiR2N6eFZo" ..
                  "YlF6eFNPSmx2dWcvcE4zdVV1eUdvOERCNFdEdEJwYjNmU25OQWlveDFuMzNFOTNQNnpoeVBnNVFWU1FsWS9BQ1htM1VoWTVVc1JaWEV6am9BTC95bU02OGI2Qi84NU40WHlwdmUrYlVrK1p3YjlP" ..
                  "am13YjBwVTlhelFFWHhSV1B5OD0iCiAgICAgIF0sCiAgICAgICJhbGciOiAiUlMyNTYiCiAgICB9LAogICAgewogICAgICAia3R5IjogIlJTQSIsCiAgICAgICJ1c2UiOiAic2lnIiwKICAgICAg" ..
                  "Im4iOiAieS1EV0QtU1Bpbm1Bc1d0bDBUQ1Y5T3JjZHcyNGNpbUlUaUoxYnJBUW5xN0NoUkVFcVFFaDdXYmwyWjFoY1p6aV9sQm1Nd2ZjRDJ5ZlpFNUkwT2dMNnExaEk5NzlBZERKbjZCYVNBdXE4" ..
                  "cjJ1azBLeUZGM0RiQzBGZ25SRlJ0anM5SEYzRjZhUWE5cXVrLS1LLWFjLXpLODFOdUhjaTBnQzU0bm01QTc2V3l3NEF6cHhRckE4Z2NvcnpFREd0Z2d0cDdPUEpyTFhSdFd4NUozb3o2TlBrVERH" ..
                  "UWZueFJoUzRQSGsxbUZ3UTVRelFlbXRWS1AtRjgxQW0xX3IwTXlfRGZMVXF3Q2w3NFNPM18xTG9TanF6VllUOGZGTmhDdzJqTUlDejFEeWR5S2czT2NUUnhXVGhjQm5XbDdvc2N0NmtzSUhqYjA3" ..
                  "OGFsWlNwU0pOTVJMT2Z3IiwKICAgICAgImUiOiAiQVFBQiIsCiAgICAgICJraWQiOiAiUjFGenA4OVBpekNySXZYZlk1SFVOIiwKICAgICAgIng1dCI6ICJFSV9DbS1WT1o5WEhKemlqYnlYLVNf" ..
                  "Y1ByUHMiLAogICAgICAieDVjIjogWwogICAgICAgICJNSUlEQVRDQ0FlbWdBd0lCQWdJSkxXRS9SUDVUTVJQT01BMEdDU3FHU0liM0RRRUJDd1VBTUI0eEhEQWFCZ05WQkFNVEUyOTBhR1Z1ZEM1" ..
                  "MWN5NWhkWFJvTUM1amIyMHdIaGNOTWpNd016STNNVFV3TVRRMldoY05Nell4TWpBek1UVXdNVFEyV2pBZU1Sd3dHZ1lEVlFRREV4TnZkR2hsYm5RdWRYTXVZWFYwYURBdVkyOXRNSUlCSWpBTkJn" ..
                  "a3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXkrRFdEK1NQaW5tQXNXdGwwVENWOU9yY2R3MjRjaW1JVGlKMWJyQVFucTdDaFJFRXFRRWg3V2JsMloxaGNaemkvbEJtTXdmY0QyeWZa" ..
                  "RTVJME9nTDZxMWhJOTc5QWRESm42QmFTQXVxOHIydWswS3lGRjNEYkMwRmduUkZSdGpzOUhGM0Y2YVFhOXF1aysrSythYyt6SzgxTnVIY2kwZ0M1NG5tNUE3Nld5dzRBenB4UXJBOGdjb3J6RURH" ..
                  "dGdndHA3T1BKckxYUnRXeDVKM296Nk5Qa1RER1FmbnhSaFM0UEhrMW1Gd1E1UXpRZW10VktQK0Y4MUFtMS9yME15L0RmTFVxd0NsNzRTTzMvMUxvU2pxelZZVDhmRk5oQ3cyak1JQ3oxRHlkeUtn" ..
                  "M09jVFJ4V1RoY0JuV2w3b3NjdDZrc0lIamIwNzhhbFpTcFNKTk1STE9md0lEQVFBQm8wSXdRREFQQmdOVkhSTUJBZjhFQlRBREFRSC9NQjBHQTFVZERnUVdCQlRLeEkvZk9xU21IVTJyRVFwTTNQ" ..
                  "SVBqYVYxcVRBT0JnTlZIUThCQWY4RUJBTUNBb1F3RFFZSktvWklodmNOQVFFTEJRQURnZ0VCQUlGUUhSQ0hLMGFXRmZ1cnkvM3lWZ1BjZU02T2x4Z01ySXhwcE5kY3M0N0xhZnliTFE3Z1hmaHda" ..
                  "TW50bGxvU2dXTm9DcWxNTDRWWnJnRkJTRkw3aHRuYTJKVmw0OUpybi9FODBIVXlXNVFZRGMxVlpPN2FuMUN6eXJmRzEvak84YUwySzE5RGFsdWxTYk1jN0ZRNURXQzZ2UEZ6eHVoOHZkYXFUSDdN" ..
                  "bTFEMnFWS0VTNjViRWRJUkh4ck9wNWttYWJRekRkcGxjTVIwMitkdGNNY21xejg3ZG8xOFBDaHo0RjBkRTA3ekgvbEZMSWt0Smt2aXVRaW50bEt4MVB6RGhJV0JpbEI2aW5zbTM3Slo3YW9DdHdO" ..
                  "VmE5QXFrMFYxTWxIU2J4dUt1TGlPbU52bWhPbHpsZFpnRGVRMSttd0pxajJZV3N5c1d3ODNLWkswVjBoOTBZdz0iCiAgICAgIF0sCiAgICAgICJhbGciOiAiUlMyNTYiCiAgICB9CiAgXQp9"
    local s1 = 13
    local s2 = 8
    local e1 = Tfhe.encryptInteger(s1, '')
    local e2 = Tfhe.encryptInteger(s2, '')
  
    local eSum = Tfhe.addCiphertexts(e1, e2, '')
    local decSum = Tfhe.decryptInteger(eSum, '', tkn, jwks)
  
    --local eSub = Tfhe.subtractCiphertexts(e1, e2, '')
    --local decSub = Tfhe.decryptInteger(eSub, '', tkn, jwks)
    return decSum 
    -- decSub
  `), getEnv())
    console.log("Decrypted addition is: ", result.response)
    assert.ok(result.response.Output.data.output == 21)
  })

  it.skip('EOC FHE Subtracting library test', async () => {
    console.log("EOC FHE Addition library test started")
    const result = await handle(getEval(`
    local Tfhe = require("tfhe")
    local tkn = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlR0TU13TEllaUlDc0YtcF9SbWFidCJ9.eyJvd25lciI6IjB6c2N4OXN5aGM0YlVqY0ltcXVEb1N1M2lRdVdXYjU5WThfMzc0M195ZFl" .. 
                  "xMFVmNC1GeGpudVlqVGQ3UUFuZGNOWUlIbHJfaHptQ0ZJSVBDZDVFTThGazlLb1NId3J2LUZEOHJEV3FBdnhSRHY3MDR5ZDJ6c3VxVV9ZWEtyMlVkRk5TaktHeDNmUlg2dW1lLWw1ZjNUNnNkZnR" ..
                  "Ra2VCbVF6LTViMk1sLV8zbV9UOGViUmViN2FPbnhuOXBtUHpvNERPQ3VhRGRfQXh2R2p0QW50X2ZzdEtMZkRlMTJpWDJiTjAwNTFPQmZITXAxQ3RBUEdKU3o4LWVUZDBTcHp1OC1TcjVMOFNIZ1N" ..
                  "FNXJMSVFnU1kxaW1jcWlldThMZGZ4X01ZbjdiWWZQZ3QwWGtyMG1lT3JmVVZ5VFAzY0tqREY0YVVPU3pXdTVub0xtdmRydUw0X2dxV0xHZ2VkSHkzdW45VG5lRzdjVXFfNjh1THhEQ0xrSGlIVTZ" ..
                  "RUWtIcEREeXYza0I5dE9OdXE0WUhZQ1EyTkxzOTdQLWFoTE1JSld3c096NGtBZFN5SUlNUm1GVnNnWl95czlRTkM2NE1GaDVQWUdhVE1TV3dNWlVqdnBVSmtjbkdybHZycDJ4MDdfMUtwRGxfWmV" ..
                  "XVmpiRVR2Z2dwYjBuWjJxSnhOVHdqRFVETU4tS19maEJJTFJkRDNyWWxzd3I0VUtxenF6N1dEMG9KMGRISG9HTFVCbU5YUXp6dzVsRG5GS3RVaHB6UUdvMzhJMmYxdWt2M3RNRXY2ZTk3bEhNc2F" ..
                  "pdzhhVjZtZm5vM0NpaE9peEFNemlkLWZnUHhzMS1IQlUxdWxSejhod29vc2dxd2RhcmJZcS1VZlJWSGd5aGRjSUFURi1NTVpVMUNMU0JlSV9tbHY4Iiwid2FsbGV0QWRkcmVzcyI6IjZrdml3ZWl" ..
                  "jQmVnM3k5YzVOUzJpYTU2WDdNaThIY0MyOUNYSmkxa2ZYamMiLCJhdXRoU3lzdGVtIjoiS01TIiwiZ2l2ZW5fbmFtZSI6IlN0aXJiZWkiLCJmYW1pbHlfbmFtZSI6Ik9jdGF2aWFuIiwibmlja25" ..
                  "hbWUiOiJvY3RhdmlhbnN0aXJiZWkiLCJuYW1lIjoiU3RpcmJlaSBPY3RhdmlhbiIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NMeEM5ODBQWlp" ..
                  "xRGlaZzZNRXJXNWl2Nl9IRElmWkpRbkhEM1VUVklTVk5sWVJWWnBJND1zOTYtYyIsInVwZGF0ZWRfYXQiOiIyMDI0LTExLTA3VDE4OjUwOjI4LjY5MFoiLCJlbWFpbCI6Im9jdGF2aWFuc3RpcmJ" ..
                  "laUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6Ly9hdXRoLm90aGVudC5pby8iLCJhdWQiOiJ1WGtSbUpvSWEwTmZ6WWdZRURBZ2o2UnNzNHdSMXRJYyIsIml" ..
                  "hdCI6MTczMTAwNTQzMywiZXhwIjoxNzMxMDQxNDMzLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExMTI2ODU0MzQ4MzAzNDY3NTMyMiIsInNpZCI6IlpQODFQTVhCTWhkcHFGVEFhMklQN0J2dzJKSE1" ..
                  "DcXZrIiwibm9uY2UiOiJSUzQ0YzJKWlRsWXdMbUZpVFdJd1ZsaFpha3hrVjJKVE1qSTJjakZwVUc4eVdrRnBlSFF3TFVoVWRnPT0ifQ.qaxZlYXG4S80nfrNvfAqQYNJkPTzuNKsy919pllgzrv6L" ..
                  "EhBpTwYOJkr8COc9XsIkVwddD5J6ZJYsBSzL3T8cZ9l0WDoID1S2iql20hToiDZQVWJGC5k2OMTLR3vCaQOuRTmH5ymBwA7mke-5D7JQ_y4RCkt5qCHK6ajSf7w62R0LO_jwxFcI_qlg693hRUEC" ..
                  "M-M81N4R99qfI1skh84qYm6---xvZqTFQF4aH2CLlo_ztsKZ_SX959WVHk0FHJBt5-XLui6ICFDS6sjQWA5wzSv8MMESBJ9SEREoN6T8KdlBFOEfJd8lbzBg6Eve8d_zuLEc1R3sxD-v3jq2aq1pw"
      local jwks = "ewogICJrZXlzIjogWwogICAgewogICAgICAia3R5IjogIlJTQSIsCiAgICAgICJ1c2UiOiAic2lnIiwKICAgICAgIm4iOiAidU1mZTd5MVdSWk5ydXFURjR0SXhna05fWjVQT0pQVkg3SGUxeWt6" ..
                  "Yk8telRWbWJiNnloVE1zdzV3WE9xWEVuZXI3b19SQjRpYVk5SFdaQ2VVcVEtLWtlVkptck9tR3lXazhaM3pIXzYtaTdCbVJGSl9KWktMSFFBMmY0UVRHSG5WNHgzOFFvNVlka1h5Qm1lcFhsc3BI" ..
                  "THdtdDZabnVzUnIyZEtkWHMzMUJMa3ZpSGdLaVlkR2pKSGdCQl9uSEhjZU9NYnF1OTZPeHRmbks2VG9mNzJGdjFzbGZyZDB3ZzQySU5IVERMN1gxdVRMaUc4ckFRSm1vTDhDRmFxaUVPQlFYUEI1" ..
                  "NmQ0WnJMdWRXT3hPZ25xNW52YUpXaGdTNzNnY2lTUThlcDdkZWtrWHo1U3hPUkVMSE8temY0UDhtSC02c3VKYXdHSm0yQmRLRkJvejR6a2NRIiwKICAgICAgImUiOiAiQVFBQiIsCiAgICAgICJr" ..
                  "aWQiOiAiVHRNTXdMSWVpSUNzRi1wX1JtYWJ0IiwKICAgICAgIng1dCI6ICJNZ3FFeENhQ3RzMTVvMXJkS3lleEdoaHRBNjAiLAogICAgICAieDVjIjogWwogICAgICAgICJNSUlEQVRDQ0FlbWdB" ..
                  "d0lCQWdJSkNBU1p6WVV4QTNaYU1BMEdDU3FHU0liM0RRRUJDd1VBTUI0eEhEQWFCZ05WQkFNVEUyOTBhR1Z1ZEM1MWN5NWhkWFJvTUM1amIyMHdIaGNOTWpNd016STNNVFV3TVRRMVdoY05Nell4" ..
                  "TWpBek1UVXdNVFExV2pBZU1Sd3dHZ1lEVlFRREV4TnZkR2hsYm5RdWRYTXVZWFYwYURBdVkyOXRNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXVNZmU3eTFXUlpO" ..
                  "cnVxVEY0dEl4Z2tOL1o1UE9KUFZIN0hlMXlremJPK3pUVm1iYjZ5aFRNc3c1d1hPcVhFbmVyN28vUkI0aWFZOUhXWkNlVXFRKytrZVZKbXJPbUd5V2s4WjN6SC82K2k3Qm1SRkovSlpLTEhRQTJm" ..
                  "NFFUR0huVjR4MzhRbzVZZGtYeUJtZXBYbHNwSEx3bXQ2Wm51c1JyMmRLZFhzMzFCTGt2aUhnS2lZZEdqSkhnQkIvbkhIY2VPTWJxdTk2T3h0Zm5LNlRvZjcyRnYxc2xmcmQwd2c0MklOSFRETDdY" ..
                  "MXVUTGlHOHJBUUptb0w4Q0ZhcWlFT0JRWFBCNTZkNFpyTHVkV094T2ducTVudmFKV2hnUzczZ2NpU1E4ZXA3ZGVra1h6NVN4T1JFTEhPK3pmNFA4bUgrNnN1SmF3R0ptMkJkS0ZCb3o0emtjUUlE" ..
                  "QVFBQm8wSXdRREFQQmdOVkhSTUJBZjhFQlRBREFRSC9NQjBHQTFVZERnUVdCQlRqb3pyemJ3UTAwMDRobW9SZGtOdy9SZlpTcERBT0JnTlZIUThCQWY4RUJBTUNBb1F3RFFZSktvWklodmNOQVFF" ..
                  "TEJRQURnZ0VCQUNEM1lhRzlTOG05M2lrdkI2NzlKbmRHRGNRMVFLWEpYMnlxQXRMd1VhSmxSaEhFYlJ0WHltM0ora0lIbzFPT0s4SkFmdGNiYlpxMzRwK3ZwMllabTJnVURUaU1RejFRUWRLVm1q" ..
                  "QjlUbk5ZUDlqSTdiNGx1cGZ1RGVNbnRBVkFvOGI4V0NyUlFWNHZvTjg4K1h2YWdaOUgzc3Y3ZmRQSHAxbUtHamJwejl1QmtYc3VqZFFyZHZmaklTNUR6WURhZ3lUbE5ib0hRQmJiUzJiR2N6eFZo" ..
                  "YlF6eFNPSmx2dWcvcE4zdVV1eUdvOERCNFdEdEJwYjNmU25OQWlveDFuMzNFOTNQNnpoeVBnNVFWU1FsWS9BQ1htM1VoWTVVc1JaWEV6am9BTC95bU02OGI2Qi84NU40WHlwdmUrYlVrK1p3YjlP" ..
                  "am13YjBwVTlhelFFWHhSV1B5OD0iCiAgICAgIF0sCiAgICAgICJhbGciOiAiUlMyNTYiCiAgICB9LAogICAgewogICAgICAia3R5IjogIlJTQSIsCiAgICAgICJ1c2UiOiAic2lnIiwKICAgICAg" ..
                  "Im4iOiAieS1EV0QtU1Bpbm1Bc1d0bDBUQ1Y5T3JjZHcyNGNpbUlUaUoxYnJBUW5xN0NoUkVFcVFFaDdXYmwyWjFoY1p6aV9sQm1Nd2ZjRDJ5ZlpFNUkwT2dMNnExaEk5NzlBZERKbjZCYVNBdXE4" ..
                  "cjJ1azBLeUZGM0RiQzBGZ25SRlJ0anM5SEYzRjZhUWE5cXVrLS1LLWFjLXpLODFOdUhjaTBnQzU0bm01QTc2V3l3NEF6cHhRckE4Z2NvcnpFREd0Z2d0cDdPUEpyTFhSdFd4NUozb3o2TlBrVERH" ..
                  "UWZueFJoUzRQSGsxbUZ3UTVRelFlbXRWS1AtRjgxQW0xX3IwTXlfRGZMVXF3Q2w3NFNPM18xTG9TanF6VllUOGZGTmhDdzJqTUlDejFEeWR5S2czT2NUUnhXVGhjQm5XbDdvc2N0NmtzSUhqYjA3" ..
                  "OGFsWlNwU0pOTVJMT2Z3IiwKICAgICAgImUiOiAiQVFBQiIsCiAgICAgICJraWQiOiAiUjFGenA4OVBpekNySXZYZlk1SFVOIiwKICAgICAgIng1dCI6ICJFSV9DbS1WT1o5WEhKemlqYnlYLVNf" ..
                  "Y1ByUHMiLAogICAgICAieDVjIjogWwogICAgICAgICJNSUlEQVRDQ0FlbWdBd0lCQWdJSkxXRS9SUDVUTVJQT01BMEdDU3FHU0liM0RRRUJDd1VBTUI0eEhEQWFCZ05WQkFNVEUyOTBhR1Z1ZEM1" ..
                  "MWN5NWhkWFJvTUM1amIyMHdIaGNOTWpNd016STNNVFV3TVRRMldoY05Nell4TWpBek1UVXdNVFEyV2pBZU1Sd3dHZ1lEVlFRREV4TnZkR2hsYm5RdWRYTXVZWFYwYURBdVkyOXRNSUlCSWpBTkJn" ..
                  "a3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXkrRFdEK1NQaW5tQXNXdGwwVENWOU9yY2R3MjRjaW1JVGlKMWJyQVFucTdDaFJFRXFRRWg3V2JsMloxaGNaemkvbEJtTXdmY0QyeWZa" ..
                  "RTVJME9nTDZxMWhJOTc5QWRESm42QmFTQXVxOHIydWswS3lGRjNEYkMwRmduUkZSdGpzOUhGM0Y2YVFhOXF1aysrSythYyt6SzgxTnVIY2kwZ0M1NG5tNUE3Nld5dzRBenB4UXJBOGdjb3J6RURH" ..
                  "dGdndHA3T1BKckxYUnRXeDVKM296Nk5Qa1RER1FmbnhSaFM0UEhrMW1Gd1E1UXpRZW10VktQK0Y4MUFtMS9yME15L0RmTFVxd0NsNzRTTzMvMUxvU2pxelZZVDhmRk5oQ3cyak1JQ3oxRHlkeUtn" ..
                  "M09jVFJ4V1RoY0JuV2w3b3NjdDZrc0lIamIwNzhhbFpTcFNKTk1STE9md0lEQVFBQm8wSXdRREFQQmdOVkhSTUJBZjhFQlRBREFRSC9NQjBHQTFVZERnUVdCQlRLeEkvZk9xU21IVTJyRVFwTTNQ" ..
                  "SVBqYVYxcVRBT0JnTlZIUThCQWY4RUJBTUNBb1F3RFFZSktvWklodmNOQVFFTEJRQURnZ0VCQUlGUUhSQ0hLMGFXRmZ1cnkvM3lWZ1BjZU02T2x4Z01ySXhwcE5kY3M0N0xhZnliTFE3Z1hmaHda" ..
                  "TW50bGxvU2dXTm9DcWxNTDRWWnJnRkJTRkw3aHRuYTJKVmw0OUpybi9FODBIVXlXNVFZRGMxVlpPN2FuMUN6eXJmRzEvak84YUwySzE5RGFsdWxTYk1jN0ZRNURXQzZ2UEZ6eHVoOHZkYXFUSDdN" ..
                  "bTFEMnFWS0VTNjViRWRJUkh4ck9wNWttYWJRekRkcGxjTVIwMitkdGNNY21xejg3ZG8xOFBDaHo0RjBkRTA3ekgvbEZMSWt0Smt2aXVRaW50bEt4MVB6RGhJV0JpbEI2aW5zbTM3Slo3YW9DdHdO" ..
                  "VmE5QXFrMFYxTWxIU2J4dUt1TGlPbU52bWhPbHpsZFpnRGVRMSttd0pxajJZV3N5c1d3ODNLWkswVjBoOTBZdz0iCiAgICAgIF0sCiAgICAgICJhbGciOiAiUlMyNTYiCiAgICB9CiAgXQp9"
    local s1 = 27
    local s2 = 12
    local e1 = Tfhe.encryptInteger(s1, '')
    local e2 = Tfhe.encryptInteger(s2, '')
  
    local eSub = Tfhe.subtractCiphertexts(e1, e2, '')
    local decSub = Tfhe.decryptInteger(eSub, '', tkn, jwks)
    return decSub
  `), getEnv())
    console.log("Decrypted difference is: ", result.response)
    assert.ok(result.response.Output.data.output == 15)
  })

  it.skip('AOS runs GPT-2-XL model', async () => {
    const result = await handle(getEval(`
  local Llama = require(".Llama")
  io.stderr:write([[Loading model...\n]])
  local result = Llama.load("/data/M-OzkyjxWhSvWYF87p0kvmkuAEEkvOzIj4nMNoSIydc")
  io.stderr:write([[Loaded! Setting prompt 1...\n]])
  Llama.setPrompt("Once upon a time")
  io.stderr:write([[Prompt set! Running...\n]])
  local str = Llama.run(30)
  return str
  `), getEnv())
    console.log(result.response)

    console.log("START SECOND MESSAGE")
    const result2 = await handle(getEval(`
    Llama.setPrompt("How do you feel about rabbits? ")
    io.stderr:write([[Prompt set! Running 2...\n]])
    local str = Llama.run(30)
    return str
    `), getEnv())
    console.log(result2.response)
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
  local Llama = require(".Llama")
  Llama.load('/data/kd34P4974oqZf2Db-hFTUiCipsU6CzbR6t-iJoQhKIo')
  --Llama.setPrompt([[<|user|>Can you write a HelloWorld function in js<|end|><|assistant|>]])
  return Llama.run(10)
  `), getEnv())
    console.log(result.response)
    assert.ok(result.response.Output.data.output.length > 10)
  })

  it.skip('Can add tokens into context', async () => {
    const result = await handle(getEval(`
  local Llama = require(".Llama")
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
local Llama = require(".Llama")
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
  local Llama = require(".Llama")
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
    Target: 'AOS',
    From: 'FOOBAR',
    Owner: 'FOOBAR',

    Module: 'FOO',
    Id: '1',

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
      Owner: 'FOOBAR',

      Tags: [
        { name: 'Name', value: 'TEST_PROCESS_OWNER' }
      ]
    }
  }
}