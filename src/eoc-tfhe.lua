local Tfhe = {}
Tfhe.backend = require("eoc_tfhe")

function Tfhe.eocTfheInfo()
    return Tfhe.backend.eocTfheInfo();
end

function Tfhe.addCiphertexts(cipher1, cipher2, public_key)
    return Tfhe.backend.addCiphertexts(cipher1, cipher2, public_key);
end

function Tfhe.subtractCiphertexts(cipher1, cipher2, public_key)
    return Tfhe.backend.addCiphertexts(cipher1, cipher2, public_key);
end

_G.Tfhe = Tfhe

return Tfhe