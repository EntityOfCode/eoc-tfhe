# TFHE Module for AO

This module provides Fully Homomorphic Encryption (FHE) capabilities for AO processes, allowing secure computations on encrypted data.

## Lua Interface

The module exposes the following functions:

```lua
-- Key Generation
generateSecretKey(jwtToken, jwksBase64) -- Generates a secret key for encryption/decryption
generatePublicKey()                     -- Generates a public key for encryption operations

-- Integer Operations
encryptInteger(value, key)              -- Encrypts an integer value using the provided key
encryptInteger_dummy(value, key)        -- Creates a dummy encrypted integer (for testing)
decryptInteger(value, key, jwtToken, jwksBase64) -- Decrypts an encrypted integer

-- Ciphertext Operations
addCiphertexts(cipher1, cipher2, public_key)     -- Adds two encrypted values
subtractCiphertexts(cipher1, cipher2, public_key) -- Subtracts two encrypted values

-- String Operations
encryptASCIIString(value, length, key)           -- Encrypts an ASCII string
decryptASCIIString(value, length, key, jwtToken, jwksBase64) -- Decrypts an encrypted string

-- Utility Functions
info()      -- Returns module information
testJWT()   -- Tests JWT functionality
```

## Usage Example

Here's a simple example of how to use the TFHE module in your AO process:

```lua
-- Load the TFHE module
local tfhe = Process.load("9qK8gsMKL2ZVOyP7DlPnEXKh_li2Fl_6liydOjprnPQ")

-- Generate keys
local jwt_token = "your-jwt-token"
local jwks = "your-jwks-base64"
local secret_key = tfhe.generateSecretKey(jwt_token, jwks)
local public_key = tfhe.generatePublicKey()

-- Encrypt some values
local encrypted_a = tfhe.encryptInteger(42, public_key)
local encrypted_b = tfhe.encryptInteger(23, public_key)

-- Perform encrypted computation
local encrypted_sum = tfhe.addCiphertexts(encrypted_a, encrypted_b, public_key)

-- Decrypt the result
local result = tfhe.decryptInteger(encrypted_sum, secret_key, jwt_token, jwks)
print("The sum is: " .. result)  -- Should print 65

-- Example with string encryption
local message = "Hello"
local encrypted_msg = tfhe.encryptASCIIString(message, #message, public_key)
local decrypted_msg = tfhe.decryptASCIIString(encrypted_msg, #message, secret_key, jwt_token, jwks)
print("Decrypted message: " .. decrypted_msg)
```

## Creating a New AO Process with TFHE

To create a new AO process that uses this TFHE module:

1. Create your process Lua file (e.g., `my-process.lua`):
```lua
-- my-process.lua
local tfhe = Process.load("9qK8gsMKL2ZVOyP7DlPnEXKh_li2Fl_6liydOjprnPQ")

-- Initialize process state
local state = {
    keys = nil,
    encrypted_data = {}
}

-- Handle process initialization
Handlers.add("init", function()
    -- Generate keys on initialization
    state.keys = {
        secret = tfhe.generateSecretKey(Process.env.JWT_TOKEN, Process.env.JWKS),
        public = tfhe.generatePublicKey()
    }
    return "Process initialized with TFHE capabilities"
end)

-- Add handler for encryption
Handlers.add("encrypt", function(msg)
    local value = tonumber(msg.data)
    if not value then return "Invalid input: number required" end
    
    local encrypted = tfhe.encryptInteger(value, state.keys.public)
    table.insert(state.encrypted_data, encrypted)
    return "Value encrypted and stored"
end)

-- Add handler for computation
Handlers.add("compute-sum", function()
    if #state.encrypted_data < 2 then
        return "Need at least 2 encrypted values"
    end
    
    local sum = state.encrypted_data[1]
    for i = 2, #state.encrypted_data do
        sum = tfhe.addCiphertexts(sum, state.encrypted_data[i], state.keys.public)
    end
    
    local result = tfhe.decryptInteger(sum, state.keys.secret, 
                                     Process.env.JWT_TOKEN, Process.env.JWKS)
    return "Sum of encrypted values: " .. result
end)
```

2. Create your process using the AO CLI:
```bash
aos create-process my-process.lua \
    --load-module 9qK8gsMKL2ZVOyP7DlPnEXKh_li2Fl_6liydOjprnPQ \
    --env JWT_TOKEN=your-jwt-token \
    --env JWKS=your-jwks-base64
```

3. Interact with your process:
```bash
# Encrypt some values
aos send-message my-process "encrypt" '{"data": "42"}'
aos send-message my-process "encrypt" '{"data": "23"}'

# Compute the sum of encrypted values
aos send-message my-process "compute-sum"
```

This will create an AO process that can perform secure computations on encrypted data using the TFHE module.
