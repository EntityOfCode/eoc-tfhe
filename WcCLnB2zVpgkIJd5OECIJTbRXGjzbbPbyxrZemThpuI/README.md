# TFHE Library Module

Module ID: WcCLnB2zVpgkIJd5OECIJTbRXGjzbbPbyxrZemThpuI

## Available Functions

The TFHE library provides the following functions:

1. `info()` - Returns information about the TFHE library
2. `generateSecretKey(jwtToken, jwksBase64)` - Generates a secret key for encryption
3. `generatePublicKey()` - Generates a public key for encryption
4. `encryptInteger(value, key)` - Encrypts an integer value using the provided key
5. `encryptInteger_dummy(value, key)` - Creates a dummy encrypted integer (for testing)
6. `decryptInteger(value, key, jwtToken, jwksBase64)` - Decrypts an encrypted integer
7. `addCiphertexts(cipher1, cipher2, public_key)` - Adds two encrypted values
8. `subtractCiphertexts(cipher1, cipher2, public_key)` - Subtracts two encrypted values
9. `encryptASCIIString(value, length, key)` - Encrypts an ASCII string
10. `decryptASCIIString(value, length, key, jwtToken, jwksBase64)` - Decrypts an encrypted ASCII string
11. `testJWT()` - Tests JWT functionality

## Important Note About JWT Functionality

Please note that OpenSSL/JWT functionalities are not yet implemented in this version. However, the functions that require JWT validation (such as decryption functions) will not return errors. The `jwtValidation` function will always return true, allowing the library to be used as if JWT validation is present.

This means you can:
- Pass any values for `jwtToken` and `jwksBase64` parameters
- Use decryption functions without worrying about JWT validation
- The `testJWT()` function will always succeed

Future versions will implement proper JWT validation. For now, you can proceed with using the encryption/decryption functionality without JWT-related concerns.
