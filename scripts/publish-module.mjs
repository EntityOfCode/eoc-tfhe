#!/usr/bin/env node
import fs from "fs";
import { TurboFactory } from '@ardrive/turbo-sdk';

// load Arweave wallet
const wallet = JSON.parse(
  fs.readFileSync(process.env.WALLET, 'utf-8')
);

const main = async () => {
  const turbo = TurboFactory.authenticated({ privateKey: wallet });

  // prep file for upload
  const filePath = './process.wasm';
  const fileSize = fs.statSync(filePath).size;

  const tags = [
    { name: 'Content-Type', value: 'application/wasm' },
    { name: 'Data-Protocol', value: 'ao' },
    { name: 'Type', value: 'Module' },
    { name: 'Variant', value: 'ao.TN.1' },
    { name: 'Module-Format', value: 'wasm64-unknown-emscripten-draft_2024_02_15' },
    { name: 'Input-Encoding', value: 'JSON-1' },
    { name: 'Output-Encoding', value: 'JSON-1' },
    { name: 'Memory-Limit', value: '1-gb' },
    { name: 'Compute-Limit', value: '9000000000000' },
  ]

  const uploadResult = await turbo.uploadFile({
    fileStreamFactory: () => fs.createReadStream(filePath),
    fileSizeFactory: () => fileSize,
    dataItemOpts: {
      tags,
    },
  });

  console.log(uploadResult)
  console.log('ModuleID: ', uploadResult.id)
}

main()