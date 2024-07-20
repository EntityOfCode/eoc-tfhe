local Tfhe = {}
Tfhe.backend = require("eoc_tfhe")

function Tfhe.info()
    return Tfhe.backend.info();
end

function Tfhe.generateSecretKey()
    -- io.stderr:write("Keys generation process started....\n")
    return Tfhe.backend.generateSecretKey()
end

function Tfhe.encryptInteger(value, key)
    -- io.stderr:write("Trying to encrypt" .. value .. "\n")
    return Tfhe.backend.encryptInteger(value, key)
end

function Tfhe.decryptInteger(value, key)
    -- io.stderr:write("Trying to decrypt" .. value .. "\n")
    return Tfhe.backend.decryptInteger(value, key)
end

function Tfhe.addCiphertexts(cipher1, cipher2, public_key)
    return Tfhe.backend.addCiphertexts(cipher1, cipher2, public_key);
end

function Tfhe.subtractCiphertexts(cipher1, cipher2, public_key)
    return Tfhe.backend.addCiphertexts(cipher1, cipher2, public_key);
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