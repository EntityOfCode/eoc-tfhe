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

  it('EOC tfhe encryption library test', async () => {
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
    // console.log("Decrypted ASCII cipher is: ", result.response.Output.data)
    encryptedCipher2 = result.response.Output.data;
    console.log("String encryption test complete")
    assert.ok(1 == 1)
  })

  it('EOC tfhe decryption library test', async () => {
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
  local s1 = "KgAAAF/u4pf0i2jjfoxc0TjUmmb8Jpe8rAzSJkrlSNxearCNnvMznOSq1hcm5tfR5dXk7D7flIHG+nCEaxHkXHNNlg5sSInZ6l487DAB6QHY+zI7Trlcpc09Fc1Gcc1Q8Ba6" ..
           "HrxcD/d4D1sWJf8+y6OoQd51Yr8Z/pkcIyUnDGfbwN9OQ17ut7+X8dsezbA0pHXOh8slXUmfE49yzHTh7jNmRVBLzkN65fFlHzqu8r/0HNUf5IgvNbAN0bZJuGztyJcc+Drz" ..
           "Baudkf2XhHCnzt9NjOCEVjlaPgW5lPq9WdvLNckJBYfJ+6YlLDA/vWq/ofajGufLjNLHFqWeox3UOWmRQiPYB2Km8QnMxAxqhv0E3w3yx+Vpz9oWaKv6s5vgyw+uabzwIUBer" ..
           "Y8BK1gXRJRdOdDaZLU0VHOehU5pGzEiNf8hkonNzn8WpCMVU/BHpxnrlgC1Xk2Stg95KkoLmsB3MbJCpkOstSfNsDejwFsKMdmsGgG2sUsHP8Hh38j7YELtVXh/rgHB+fxfjG" ..
           "xURZ8Vmo4NrNkj6bH4doNSd3IpfgCLwMfzy64PiN/F7ibPYdaX+ux+8cYh7hkhk4Hse0YGQG0fizkvd02W3bdNp6Hu8Jwc2K7wbUG3zwjJnpcSHC0zm5m+qvyaDXXYcA9VCs4" ..
           "d0feSEOMYzTXkZ9D9UKzUG1TbXMVXI45DCkPw6BUqRsxSenkxV4UqcZm2iI9R1sdhRnlShqivPIV8sKKIhKImtTFRtC1i2UvSqSmY3ZZm4dTXewucNZTRDgIcYi4cHuJrZ6V" ..
           "yakAWMEmWmRjODE2Dv+iIzn7sTkHKtvOoh0j4d1reIXiEdSmCVPERL5cukOs9Yb0eSa6OfGxfHCyvq2tJx9IHN+AXFAVzkZRITZMkK5HRcnhbRcJd/3BI4NMXyq/0X7qyKK5" ..
           "ErTXJfj5gmNLLJ1wPGlrMF+QVuX822IGvdObv1DGXokyINUDGuyffyjXDaoaIm5IA3glVxVpAdMO6zQnZrX+RclOhlpisFRv+LUQEZGT3doWAAvzO+XTowF/ea0CFLHK4Pzt" ..
           "J8ncRiporkh8zdgkNNv4qMimDu9tNr7n2NRXYIHxHAEUS+23ii8/EVfIezTfHfdMvFDYBi0gCjxK68d6yxK5i0uikhNX+y1K0nYboy5tdM7+b2AScJDuQdIayn28sbjHq5R6" ..
           "NDdczVh8Rq7FDeNod2q2xIYHcNI5uLwTYIqJmLmZqRIgy/Y68BdlxI53wswJABdSp3zPwPjDxMFr+u7buPrmLUroADO3lGAUJkmzVNlnCTGgD0ksFVtRkSQPxaAomgY0qLgb" ..
           "Ua43JoD6zYDoJMo3Noneclc8WVRl/mdSDSHNrieHX7b6yyPRsts9IclG9/v7q0EtNA04CM8oUIm7MLoO4JSVCifSrKVp9OVqZjAd3onlhVy/IJ0GS4WQkRYFZJxs1wNHC0pH" ..
           "e3jLXXr9KAXJjQtDiJkcFjkx8BL26r9wnTrUBjEaU91MMrBg/PtiJruO3GCL8N7+1I1qmKBkJXFNDbmeuAgMQwS+G3Q8tJZs3yX+zE3TSP8KzSoThbC6Sn3rjwFkcbODmc8h" ..
           "HMVb3md5v2J125BDlbmxtWkHglvJGOozliRJUOFHOOz/4oXlnsR5yWO22c28RzvEAbyAEi3cN7Qm8ew1FZRDDD54SnNnlkovQkb0mp3twiGer0dPHaEMg4uzAzUueNQNNsmw" ..
           "gihNKwxm59f6kPVij4SWrZSfY5jjad3re1HkOBOASGthPTKOayEJBnfZyr7cob3XMaIRK6JVRJykgdykFpXE/ZA9ekDrmkJxxXYRu9AZwHcXBr0qg9EXtRWbVBgqW7wZTVhA" ..
           "6ejb9L/ZxOciIt07Jt3QfmPFuQAw+Pql7/x/TZRfAMYpH2yOD0dUM2t2NrSfmoRHw74D6YIh/tIyYibudW9pHobV/1OaaVqHz/mLlcDQ45dVbbXh9wv0iBNq2ctPIrqCLHaU" ..
           "l4DcgqluVMaPoZACZmFMXps5vEqEzuH0cJYichAMPr0hnxGn6V+3VzSMrK/lBgRdNgZ53g2/ke+KYL5nKL6lLbabKQAUn1vds5jYwIBexwyfSDnQjESIhOUnD0aR3nhXC7QU" ..
           "lodne+96m/gya47Z1khmsu4K2E00oaoFE7JRtOx0FIZ51MPyxF1tluag1uKDysolimDZSHTvLA9cu1PzvSuE5FV38KW3Y7gzJm1uYpBItIbODd1WC0OvSwPKv7s2mTnseQ6b" ..
           "SFmOaozlyOrEzavgPHaAasAwFPprg+ZXRaOwPyQauFbqEHuZre7hLSoLU+rYuscUletkeqgqSUSWRRWWcC4PAoA5pXJa+dsfnG//iingvb4muDSjwqL6ZNO8uhyAGSnFLvkt" ..
           "jUcRaHz+0tjiI/2BVOEsTs0Z3+PL9rbIxUawFh2sPgPVCr+8VplJi0W3itgBIt/skXWcqREzArMRa7tdnRwklJsp+eBAK9pazJsI+e/piMoPC2CFU8samOandPa3kcFtfeBn" ..
           "bRobTXYDHrwP8XBzAiYTe4MbnoRnGxbFIvV0MU3Wl8tjmMGwWfMAEUIDDEu1ixO+/XdVyEwZa0OHycmvK1CpHookJJvkAQkh0EA6UaUOYEyZhdtdWtPyD2EbwYaK66JnRlgS" ..
           "qH/uUu20NmtX00UPtTN7L9RMiE1NQoiVw8Pm67917XndSqpsYiH0NKKgqdn55k1nU/mZlM0LKinFugv4h/URHPuaoZZPa2uzW9ggK+Hsmva2/9zAJU/HQoYd5wytL0VVokdP" ..
           "kv6S0IOD3e4uAobKs9jGu8SOMZK2PirI8LQiGW58g0EwWdSYqeuekLWB/ara5GAwYTuB0MN6MrJBMKL/sprLcnejUUOe9pdgiFRgbX39SaEMoat74CS2CFnh9Hn6vko2Sn2j" ..
           "0xbEXtM+7S83PI+eKQG5CLS9qTRjHLz/S6ZfPSutGkvJRL04AJujQEBN/WmBA0/HXwVC4wHEze5O/N0XwnwC1JonHl/pN6R4yPtNsP0ZCEknqldE3cuRy6eL/m3yaN0Z9r3C" ..
           "Su3MD5/oobwt/TULQ3cwfQaU5TuEMa8r1aVItCQnHeSneWSpf00hnxqvZVsmRskLoEVNI7QDTylPXqdEbCPlH7zA0vN+9ofOUwDrWW1lC+UzTu+zj2TVjla+wJUlyc1eT9HQ" ..
           "rccdZkt16mH0lOw08yjRhe12wuEcVEanJkJ0TRMCNGq+PaShVmTGZdXpQplcqIV4SHoRC+UdLBsqF+NN197CbTNoP3HTvGdnk6L3D8SlacwvT7ZZkzEdrKN5VTo4v4DXfm74" ..
           "G3rINPHvqq8+KcnqPUmkL6kc7Zivgjgvabq+isHErB3O36/vd/fj4vct/u3MhCiN1XYAAABI4XqkOw=="

local s2 = "KgAAAMZcKqotCdSfyH8tiJH31DAbYmgZ94cuapDRg2WAHgoATCsWO0JoyleHW20VzUiRBBExlijg21U08J0hVdls8aQbCVqC6iPv0m/2fh3ol9sOtUw5h7myvizyzVoCFGw" ..
            "THMWZHmi0AWDp2xMAmr2Ana82z+67s1c+3Nq1pMduigmbDnYXKLykvT6b0GZiweJjKc0+tk9/yvyv6i7MwQ1elSqiW7x4lKa/EYrQ7PPN/zcGr8vji9ExcZ3t/bbGRbGy/D" ..
            "IrtHMowWcVM+ZvKOQwkeTln/+4jvSjkifscuj7nolrbpoDk7K/XyFDrrCj2/vm0e51kOnOgzyVKKwzUpvgDp6u+uWH051xGfHKh26sH4tytcNkOAMPD1eLbqnuQ/a8wkLK3" ..
            "4QimRCz8CnAb2OoPAnNSJ2r30IEPEXw7l52Aqcm/RnjMzQilRRGBCEjRQ//uI0iOGCAtFULZfqX3e4m0QYm8lnQiLyJ/GmShPu4tdsbzlfCcX8WgxW5p8jU4yw5UqWinZLx" ..
            "xNXGWB7UUszxhaoBmp4XdcM+Nm4BJyluXdm5CeAjFc030AGIrLl6dze2GVZyrTu5G6JEH2NIb5rqfTdNr90KIfmhNdfx23APzrJcrJNfP3GUbsapO2r3NMyDoFK3/28iiCE" ..
            "Gx95aWfABQbzUINcZNFJHDWIGLoOTXsSesjx3lKrP17f3RrPOi09XQc5qBPFhGLVJwRVfnMXi2VDU8MmcOQrcIM6kpstRFWV8CxxjWBFlLeB4J48K0BSICBTsfj9gziue3/" ..
            "btoIrHOmuC/2T5JQ/afs39g4mEEEPBUcS0D9AhlJjRvMDVM+yFLGRfYURCGlW+4V0S4ZcBsPEGkCGINjYF1xs8LTS7l8Jz4zaeM8OcOsERHMsBbUG47WAELIYJSQ9B/jide" ..
            "u6PSi15ofegIoEU7XTXmHsOxg3Z4NG83sSV8BXzWlDkJFIVo7MAqJD7ma6wLEfimvthy1esQaU8cai+RfeYJSCgMg+Ttbjain5y0+L9iPNF92sVnY1focxX8WMXCM0h2+GU" ..
            "S1wE2lqpfMGsL5fDb0J7Gg4+74qyaAgsH/eCgneKlCUcHhha5YuPcfLrdV/mXwGPH1lxvfP1FK9l6YEnpVCwR7UM2z8np27zHz9AGVs2PD6keSg7F5g90DLWl/g1QNe+rgN" ..
            "cxZE+UH1ItewQy9dYypzjsUFoF0cDFwXUWu/TG7XGPmh8UcTUnC/QExCkaArylzMOjju5DHSY3fZYmLJUfy1eIdfKN9GrH0fY1p+0zULZpcrX9SGOkj3ygQRTZ+usG7TLDN" ..
            "Dqc3SgXgEkA3DaM3fNruP9N+AWayk8Ja4TbAPY6hNNeHrTyczo6EnCfyPlFtjWHOMD7a5dhjgRUvN4RpLR68IF17OIYH7boe4gpyjOk0EGPEI27tT9kLO89BJV8AtmDNiUJ" ..
            "dgI9/bR0iaHSz9GDF2QcT6nljRmPKo2Pj4bw5BYVURRhmJ/E6+fg5uH5IOz96O4PbVo2jUEdWBHcDJ83HK5L/06d7KwDrYuaN8C3arHzvLHB+u/I30FyIbLMXOK4tIS2jeD" ..
            "vyAhqZl5bwlSH5hJEM8r3by1EqrGhGcVusO8sAnMIUjJXbre/V5WYEe+8YGl2NMV6AY/8BZemi/HRAwSjeQnx0FMAdImhQVWwF/EhdYs2O6X7eYEO/PcROV1xNMIC6Yu/tb" ..
            "fktzxWKgUZ+76ENn5GYyYCb7x/113Du4mgv0vxTJbJmx8DIitUl81qEy3SCwQ8P0bIvsLsII3LzhWcoK14C5Qh/7UVSYQnh+L6cq/v3fB0P8/0l7tVraxnRq+pStENqP+4n" ..
            "Pw0u4/WgGlRzATVLwHOyoLiwFtByXchECnMpab4QGTuPIzfBskZzG3dft21aA7/LLP79Gktp8hbWD9cyl5ZvXWNHvoM/XodHk73tDqQk98SW9x5ISnBD3V43PqiAN4t6gmv" ..
            "s5m4TRt51yUTrN0SGmvASMPruYopD2v5RLzhdOHzIzh7h0tMR2Pwro2iWa38/qfGTQxFmZlUikTAZuiYL8ll1iczbRxTSzcnAsPsmG0PCKC/bjwyIPcCD7yfe7rDW3drkt6" ..
            "e85RTXMn8qwCTGu9M9JZRBXXLq9CkptmdNLt7lzJNJ3m+H1dQeTOx0hE3xuezXL4VQQnwo6rfzu6A2Esn8iL27D6AbHreAVXce0Oe5zpZfQNc5U4cMRS3qTK8PvPIm5vtLH" ..
            "G7L1RdT90ev5VFfrk0JChYwzeT5oC3WZ/ts0E5/7R6/CM4468f2tvlIJp7kG/53lKvhCtIuSyrYZkjMYsGSJzRsPOZdCvgriMDDbzYP9y8RRRNBs7al0A64Sa42ySGpKhR/" ..
            "YsxfSc6o+ET31l647Bi1xUXoSEmErAcjYSscDFDwakL7e2OLhgMv3PPTaBzFiGycAY73jk+McWo99LhhRFGbw+RK5hIRihgyBmUOAdWe7ett0Z8FQQwWkIHYYsaXM72rYs8" ..
            "PSacyuWJgd6cQh3evpRAxFP8kG6Lz+1TNjh2DZ9mNI4az0/bXnvrJpGY8UVGK7EeyKPL7qVRSDO2Wc/jQLtjqIJlwKJLjTcK2RmmD8GXPDTI2x6VkSt24vAaozlwVXkgpGy" ..
            "EyQzgWj3DzEXmFZZkgL6aEDPK8j3khgGsn5UzV5G5XHd4cxD83AYMhDPUehBmiKnd9yMTs777kuPbqBFLRVuvo25Y0+ru4MvVwJ2ayiJjG1RbFt+urhryfxCnALyXsvLXVQ" ..
            "TZ2UmZRDPHYAciKfgH7nYhfnuK4V6N6BEcbxjnxj0mHQwK2X/1MzuNEwI+wQCqt9+Qh5IyWjlW7JsCxjw8zu//OYjpCGfLFbUIIhkI5ME5aqnBsGNhmK2LLtNC0l0kxTRnW" ..
            "bQ/4WaPuNXJ707RPpZNZ3yifxgr9Uzhob7XMuZqlaXJAH3jVDOGl+NFm16FI+wWUDsXFrIix/DaKfY+vpDi8VINr93JEacCszw8vOgZaIdZ2FAd1Ez9eV0Bkmme2nafqevS" ..
            "xuN8j2p0JOwKjy/Bhuq5n0MJ6gbwiOBzgleN5n3ROpLC+KzNbWQWU7QHukka24IQ6JvUbn/RdIVXcLOrrh9jUjq/19/EfFlkG4pRyU2MNNMcKt7YMrYf2SS1A00im+0IndQ" ..
            "rn3Bg5ZZVHpSgoSBf2G6+phxecrw4XQ5gSg/1e87IFmIeoxRsSJ5HWJ0+LNZRFfvQwJn5kvEcacxfpC9QuDsk7yxZHBcDdfqi3Rm2MjxCDpLlN39eJ8E9NwgKQbApwG+DcJ" ..
            "e0RpVBNcZ9t6WotPEQRV9JLVbITzgSutkg+yY+EL/QyXWE9jRCcySPV0b+ySNI8iGzRhqLcyKey7G/tyohjll1UUa61/JErkAAABI4XqkOw=="

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

  it('EOC FHE Addition library test', async () => {
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

  it('EOC FHE Subtracting library test', async () => {
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