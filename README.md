# EOC-TFHE Project

This repository provides a WebAssembly-based Fully Homomorphic Encryption (FHE) module for the AO blockchain ecosystem - legacynet. It combines TFHE (Fast Fully Homomorphic Encryption) with secure authentication using JWT, enabling privacy-preserving computations on encrypted data.

## Features

- Fully Homomorphic Encryption using TFHE
- Secure key management with JWT authentication
- WebAssembly compilation for browser and Node.js environments
- AO blockchain integration
- Integer and ASCII string encryption support
- Homomorphic arithmetic operations

## Repository Structure

```
.
├── AO-Llama/          # AO Blockchain Integration (submodule)
├── ao-tfhe/           # TFHE Lua bindings and implementation
├── libs/              # External dependencies
│   ├── tfhe/         # TFHE library
│   ├── openssl/      # OpenSSL library
│   └── jwt/          # JWT library
├── scripts/          # Build and publishing scripts
├── tests/            # Test suite
└── build/            # Build artifacts
```

## Setup

1. Clone the repository with submodules:
```bash
git clone --recursive https://github.com/EntityOfCode/eoc-tfhe.git
cd eoc-tfhe
```

2. Initialize and update submodules:
```bash
git submodule update --init --recursive
```

## Building the Library

1. Install dependencies:
```bash
# Install system dependencies (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install build-essential cmake libssl-dev

# Install Node.js dependencies
npm install
```

2. Build the library:
```bash
# Build TFHE library and WebAssembly module
./build.sh

# Or use the EOC build script for additional optimizations
./eoc-build.sh
```

The build process will generate:
- WebAssembly module (`process.wasm`)
- JavaScript wrapper (`process.js`)
- Compiled TFHE libraries

## Running Tests

```bash
# Install test dependencies
cd tests
npm install

# Run the test suite
npm test

# Run specific tests
npm test -- tfhe.test.js
```

## Publishing the Module

The module can be published to the AO network using the provided scripts:

```bash
# Build and publish the module
node scripts/publish-module.mjs

# The script will output the module ID, save this for future reference
# Example: Module ID: 9qK8gsMKL2ZVOyP7DlPnEXKh_li2Fl_6liydOjprnPQ
```

## Using the Published Module

After publishing, the module can be used in any AO process:

```lua
-- Load the TFHE module using the published module ID
local tfhe = Process.load("9qK8gsMKL2ZVOyP7DlPnEXKh_li2Fl_6liydOjprnPQ")

-- See the module's README for detailed usage examples
```

For detailed usage instructions and examples, see the module's [README](9qK8gsMKL2ZVOyP7DlPnEXKh_li2Fl_6liydOjprnPQ/README.md).

## Contributing

Contributions are welcome! Please ensure your pull requests:
1. Include tests for new functionality
2. Pass all existing tests
3. Follow the existing code style
4. Update documentation as needed

## Credits

This project builds upon several excellent open-source projects:

- [TFHE Library](https://github.com/tfhe/tfhe) - Fast Fully Homomorphic Encryption
- [OpenSSL](https://www.openssl.org/) - Cryptography and SSL/TLS toolkit
- [AO](https://github.com/permaweb/ao) - The AO blockchain ecosystem
- [JSON Web Token](https://jwt.io/) - JWT implementation

Special thanks to:
- The TFHE team for their groundbreaking FHE implementation
- The AO team for their innovative blockchain platform
- All contributors to the dependent libraries

## License

[License details to be added]

## Security

This project deals with cryptographic operations. While we strive for security:
- Audit the code before using in production
- Keep secret keys secure
- Report security issues responsibly
- Follow cryptographic best practices

For security issues, please contact [contact information to be added].
