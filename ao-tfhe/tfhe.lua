local Tfhe = {}
Tfhe.backend = require("tfhe")

function Tfhe.info()
    return Tfhe.backend.info();
end

function Tfhe.testJWT()
    return Tfhe.backend.testJWT();
end

function Tfhe.generateSecretKey(jwtToken, jwksBase64)
    -- io.stderr:write("Keys generation process started....\n")
    return Tfhe.backend.generateSecretKey(jwtToken, jwksBase64)
end

function Tfhe.generatePublicKey()
    -- io.stderr:write("Keys generation process started....\n")
    return Tfhe.backend.generatePublicKey()
end

function Tfhe.encryptInteger(value, key)
    -- io.stderr:write("Trying to encrypt" .. value .. "\n")
    return Tfhe.backend.encryptInteger(value, key)
end

function Tfhe.encryptInteger_dummy(value, key)
    -- io.stderr:write("Trying to encrypt" .. value .. "\n")
    return Tfhe.backend.encryptInteger_dummy(value, key)
end

function Tfhe.decryptInteger(value, key, jwtToken, jwksBase64)
    -- io.stderr:write("Trying to decrypt" .. value .. "\n")
    return Tfhe.backend.decryptInteger(value, key, jwtToken, jwksBase64)
end

function Tfhe.addCiphertexts(cipher1, cipher2, public_key)
    return Tfhe.backend.addCiphertexts(cipher1, cipher2, public_key);
end

function Tfhe.subtractCiphertexts(cipher1, cipher2, public_key)
    return Tfhe.backend.addCiphertexts(cipher1, cipher2, public_key);
end

function Tfhe.encryptASCIIString(value, length, key)
    -- io.stderr:write("Trying to encrypt" .. value .. "\n")
    return Tfhe.backend.encryptASCIIString(value, length, key)
end

function Tfhe.decryptASCIIString(value, length, key, jwtToken, jwksBase64)
    -- io.stderr:write("Trying to encrypt" .. value .. "\n")
    return Tfhe.backend.decryptASCIIString(value, length, key, jwtToken, jwksBase64)
end

-- -- Callback handling functions

-- Tfhe.logLevels = {
--     [2] = "error",
--     [3] = "warn",
--     [4] = "info",
--     [5] = "debug",
-- }

-- Tfhe.logLevel = 5
-- Tfhe.logToStderr = true
-- Tfhe.log = {}

-- function Tfhe.onLog(level, str)
--     if level <= Tfhe.logLevel then
--         if Tfhe.logToStderr then
--             io.stderr:write(Tfhe.logLevels[level] .. ": " .. str)
--             io.stderr:flush()
--         end
--         if not Tfhe.log[Tfhe.logLevels[level]] then
--             Tfhe.log[Tfhe.logLevels[level]] = {}
--         end
--         table.insert(Tfhe.log[Tfhe.logLevels[level]], str)
--     end
-- end

-- function Tfhe.onProgress(str)
--     io.stderr:write(".")
--     io.stderr:flush()
-- end

_G.Tfhe = Tfhe

return Tfhe