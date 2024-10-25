# eoc-tfhe
tfhe implementation for js, wasm and lua in aos image.
Run make in the root folder in order to build the library.
In order to test the library use the test from test-llm folder, the command for this is 
            node --test --test-timeout=100000000 --expose-gc --experimental-wasm-memory64  --max-old-space-size=32768 afs.test.js
