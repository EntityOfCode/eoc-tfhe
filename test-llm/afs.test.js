const { describe, it } = require('node:test')
const assert = require('assert')
const weaveDrive = require('./weavedrive.js')
const fs = require('fs')
const wasm = fs.readFileSync('./AOS.wasm')
// STEP 1 send a file id
const m = require(__dirname + '/AOS.js')

describe('EOC FHE + JWT Test', async () => {
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

  it('EOC JWT library test', async () => {
    const result = await handle(getEval(`
    local Tfhe = require("eoc_tfhe")

    Tfhe.testJWT()

    return 1
    `), getEnv())
    console.log("JWT Validation Success! ", result.response)
    assert.ok(result.response.Output.data.output == 1)
  })

  it('EOC tfhe Lua library test', async () => {
    const result = await handle(getEval(`
    local Tfhe = require("eoc_tfhe")
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

    local s1 = 42
    local s2 = 27
    --local e1 = Tfhe.encryptInteger(s1, '')
    --local e2 = Tfhe.encryptInteger(s2, '')

    --local eSum = Tfhe.addCiphertexts(e1, e2, '')
    --local decSum = Tfhe.decryptInteger(e1, '', tkn, jwks)
    return 69
    --decSum
`), getEnv())
    console.log("Decrypted computation is ", result.response)
    assert.ok(result.response.Output.data.output == 69)
  })
})

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