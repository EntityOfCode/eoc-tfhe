local Tfhe = {}
Tfhe.backend = require("tfhe")

function Tfhe.info()
    return "A Fully Homomorphic Library over Torus."
end

function Tfhe.test()

    return Tfhe.backend.test()
end

_G.Tfhe = Tfhe

return Tfhe