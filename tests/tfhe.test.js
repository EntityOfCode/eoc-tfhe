import { test } from 'node:test';
import * as assert from 'node:assert';
import AoLoader from '@permaweb/ao-loader';
import fs from 'fs';
import weaveDrive from './weavedrive.js';

const wasm = fs.readFileSync('./process.wasm');
const options = {
  format: "wasm64-unknown-emscripten-draft_2024_02_15",
  admissableList: [],
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
};

// JWT token and JWKS for testing
const tkn = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlR0TU13TEllaUlDc0YtcF9SbWFidCJ9.eyJvd25lciI6IjB6c2N4OXN5aGM0YlVqY0ltcXVEb1N1M2lRdVdXYjU5WThfMzc0M195ZFl" + 
           "xMFVmNC1GeGpudVlqVGQ3UUFuZGNOWUlIbHJfaHptQ0ZJSVBDZDVFTThGazlLb1NId3J2LUZEOHJEV3FBdnhSRHY3MDR5ZDJ6c3VxVV9ZWEtyMlVkRk5TaktHeDNmUlg2dW1lLWw1ZjNUNnNkZnR" +
           "Ra2VCbVF6LTViMk1sLV8zbV9UOGViUmViN2FPbnhuOXBtUHpvNERPQ3VhRGRfQXh2R2p0QW50X2ZzdEtMZkRlMTJpWDJiTjAwNTFPQmZITXAxQ3RBUEdKU3o4LWVUZDBTcHp1OC1TcjVMOFNIZ1N" +
           "FNXJMSVFnU1kxaW1jcWlldThMZGZ4X01ZbjdiWWZQZ3QwWGtyMG1lT3JmVVZ5VFAzY0tqREY0YVVPU3pXdTVub0xtdmRydUw0X2dxV0xHZ2VkSHkzdW45VG5lRzdjVXFfNjh1THhEQ0xrSGlIVTZ" +
           "RUWtIcEREeXYza0I5dE9OdXE0WUhZQ1EyTkxzOTdQLWFoTE1JSld3c096NGtBZFN5SUlNUm1GVnNnWl95czlRTkM2NE1GaDVQWUdhVE1TV3dNWlVqdnBVSmtjbkdybHZycDJ4MDdfMUtwRGxfWmV" +
           "XVmpiRVR2Z2dwYjBuWjJxSnhOVHdqRFVETU4tS19maEJJTFJkRDNyWWxzd3I0VUtxenF6N1dEMG9KMGRISG9HTFVCbU5YUXp6dzVsRG5GS3RVaHB6UUdvMzhJMmYxdWt2M3RNRXY2ZTk3bEhNc2F" +
           "pdzhhVjZtZm5vM0NpaE9peEFNemlkLWZnUHhzMS1IQlUxdWxSejhod29vc2dxd2RhcmJZcS1VZlJWSGd5aGRjSUFURi1NTVpVMUNMU0JlSV9tbHY4";

const jwks = "ewogICJrZXlzIjogWwogICAgewogICAgICAia3R5IjogIlJTQSIsCiAgICAgICJ1c2UiOiAic2lnIiwKICAgICAgIm4iOiAidU1mZTd5MVdSWk5ydXFURjR0SXhna05fWjVQT0pQVkg3SGUxeWt6" +
             "Yk8telRWbWJiNnloVE1zdzV3WE9xWEVuZXI3b19SQjRpYVk5SFdaQ2VVcVEtLWtlVkptck9tR3lXazhaM3pIXzYtaTdCbVJGSl9KWktMSFFBMmY0UVRHSG5WNHgzOFFvNVlka1h5Qm1lcFhsc3BI";

let handle;
const env = {
  Process: {
    Id: 'AOS',
    Owner: 'FOOBAR',
    Tags: [
      { name: 'Name', value: 'Thomas' }
    ]
  }
};

// Initialize AoLoader before tests
test('Initialize AoLoader', async (t) => {
    handle = await AoLoader(wasm, options);
    assert.ok(handle, 'AoLoader should initialize successfully');
  });

test('TFHE info function returns library information', async (t) => {
    const msg = {
      Target: 'AOS',
      From: 'FOOBAR',
      Owner: 'FOOBAR',
      ['Block-Height']: "1000",
      Id: "test-info",
      Module: "TFHE",
      Tags: [{ name: 'Action', value: 'Eval' }],
      Data: `
        local tfhe = require(".tfhe")
        local info = tfhe.info()
        tfhe.testJWT();
        print(info)
        return "OK"
      `
    };

    const result = await handle(null, msg, env);
    assert.ok(result, 'Should get a result from TFHE info call');
  });

test('TFHE key generation and integer encryption/decryption', async (t) => {
    const msg = {
      Target: 'AOS',
      From: 'FOOBAR',
      Owner: 'FOOBAR',
      ['Block-Height']: "1000",
      Id: "test-int-encryption",
      Module: "TFHE",
      Tags: [{ name: 'Action', value: 'Eval' }],
      Data: `
        local tfhe = require(".tfhe")
        
        -- Generate secret key first
        tfhe.generateSecretKey("${tkn}", "${jwks}")
        
        -- Test integer encryption/decryption
        local original = 42
        local encrypted = tfhe.encryptInteger(original, '')
        local decrypted = tfhe.decryptInteger(encrypted, '', "${tkn}", "${jwks}")
        
        return tostring(decrypted)
      `
    };

    const result = await handle(null, msg, env);
    assert.strictEqual(result.response.Output.data.output, "42", 'Decrypted value should match original');
  });

test('TFHE string encryption/decryption', async (t) => {
    const msg = {
      Target: 'AOS',
      From: 'FOOBAR',
      Owner: 'FOOBAR',
      ['Block-Height']: "1000",
      Id: "test-string-encryption",
      Module: "TFHE",
      Tags: [{ name: 'Action', value: 'Eval' }],
      Data: `
        local tfhe = require(".tfhe")
        
        local text = "Hello TFHE!"
        local encrypted = tfhe.encryptASCIIString(text, #text, '')
        local decrypted = tfhe.decryptASCIIString(encrypted, #text, '', "${tkn}", "${jwks}")
        
        return decrypted
      `
    };

    const result = await handle(null, msg, env);
    assert.strictEqual(result.response.Output.data.output, "Hello TFHE!", 'Decrypted string should match original');
  });

test('TFHE homomorphic addition', async (t) => {
    const msg = {
      Target: 'AOS',
      From: 'FOOBAR',
      Owner: 'FOOBAR',
      ['Block-Height']: "1000",
      Id: "test-addition",
      Module: "TFHE",
      Tags: [{ name: 'Action', value: 'Eval' }],
      Data: `
        local tfhe = require(".tfhe")
        
        local a = 15
        local b = 27
        
        local enc_a = tfhe.encryptInteger(a, '')
        local enc_b = tfhe.encryptInteger(b, '')
        
        local enc_sum = tfhe.addCiphertexts(enc_a, enc_b, '')
        local sum = tfhe.decryptInteger(enc_sum, '', "${tkn}", "${jwks}")
        
        return tostring(sum)
      `
    };

    const result = await handle(null, msg, env);
    assert.strictEqual(result.response.Output.data.output, "42", 'Homomorphic addition should work correctly');
  });

test('TFHE homomorphic subtraction', async (t) => {
    const msg = {
      Target: 'AOS',
      From: 'FOOBAR',
      Owner: 'FOOBAR',
      ['Block-Height']: "1000",
      Id: "test-subtraction",
      Module: "TFHE",
      Tags: [{ name: 'Action', value: 'Eval' }],
      Data: `
        local tfhe = require(".tfhe")
        
        local a = 50
        local b = 8
        
        local enc_a = tfhe.encryptInteger(a, '')
        local enc_b = tfhe.encryptInteger(b, '')
        
        local enc_diff = tfhe.subtractCiphertexts(enc_a, enc_b, '')
        local diff = tfhe.decryptInteger(enc_diff, '', "${tkn}", "${jwks}")
        
        return tostring(diff)
      `
    };

    const result = await handle(null, msg, env);
    assert.strictEqual(result.response.Output.data.output, "58", 'Homomorphic subtraction should work correctly');
  });
