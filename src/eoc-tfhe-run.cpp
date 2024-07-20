#include <sstream>
#include <iostream>
#include <fstream>
#include <time.h>
#include <string>
#include <vector>
#include <tfhe_gate_bootstrapping_functions.h>
#include <numeric_functions.h>
#include <lwe-functions.h>
#include <string.h>
#include <tgsw.h>
#include <tfhe_core.h>
#include <polynomials.h>
#include <set>
#include <tfhe_io.h>
#include <emscripten/bind.h>

using namespace std;

int32_t minimum_lambda = 100;
static const int32_t Msize = (1LL << 31) - 1;
static const double alpha = 1. / (10. * Msize);

TFheGateBootstrappingSecretKeySet* globalSecretKey = nullptr;
TFheGateBootstrappingCloudKeySet* globalPublicKey = nullptr;

// Base64 encoding function
static const std::string base64_chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "abcdefghijklmnopqrstuvwxyz"
    "0123456789+/";

std::string base64_encode(const unsigned char* data, size_t len) {
    std::string ret;
    int val = 0;
    int valb = -6;
    for (size_t i = 0; i < len; i++) {
        val = (val << 8) + data[i];
        valb += 8;
        while (valb >= 0) {
            ret.push_back(base64_chars[(val >> valb) & 0x3F]);
            valb -= 6;
        }
    }
    if (valb > -6) ret.push_back(base64_chars[((val << 8) >> (valb + 8)) & 0x3F]);
    while (ret.size() % 4) ret.push_back('=');
    return ret;
}

std::string base64_decode(const std::string &in) {
    std::string out;
    std::vector<int> T(256, -1);
    for (int i = 0; i < 64; i++) T["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[i]] = i;
    int val = 0, valb = -8;
    for (unsigned char c : in) {
        if (T[c] == -1) break;
        val = (val << 6) + T[c];
        valb += 6;
        if (valb >= 0) {
            out.push_back(char((val >> valb) & 0xFF));
            valb -= 8;
        }
    }
    return out;
}

extern "C" char* generateSecretKey() {
    TFheGateBootstrappingParameterSet* params = new_default_gate_bootstrapping_parameters(minimum_lambda);
    globalSecretKey = new_random_gate_bootstrapping_secret_keyset(params);
    std::ostringstream oss;
    export_tfheGateBootstrappingSecretKeySet_toStream(oss, globalSecretKey);

    std::string encoded = base64_encode(reinterpret_cast<const unsigned char*>(oss.str().data()), oss.str().size());
    char* msg = (char*)malloc(encoded.size() + 1);
    if (msg == nullptr) {
        return nullptr;
    }
    strcpy(msg, encoded.c_str());
    return msg;
}

extern "C" char* generatePublicKey(const char* base64SecretKey) {
    std::string decodedKey = base64_decode(base64SecretKey);
    std::istringstream iss(decodedKey);
    TFheGateBootstrappingSecretKeySet* secretKey = new_tfheGateBootstrappingSecretKeySet_fromStream(iss);
    globalPublicKey = const_cast<TFheGateBootstrappingCloudKeySet*>(&secretKey->cloud);

    std::ostringstream oss;
    export_tfheGateBootstrappingCloudKeySet_toStream(oss, globalPublicKey);

    std::string encoded = base64_encode(reinterpret_cast<const unsigned char*>(oss.str().data()), oss.str().size());
    char* msg = (char*)malloc(encoded.size() + 1);
    if (msg == nullptr) {
        return nullptr;
    }
    strcpy(msg, encoded.c_str());
    return msg;
}

extern "C" char* encryptInteger(int32_t value, const char* base64SecretKey = nullptr) {
    if (base64SecretKey != nullptr) {
        std::string decodedKey = base64_decode(base64SecretKey);
        std::istringstream iss(decodedKey);
        globalSecretKey = new_tfheGateBootstrappingSecretKeySet_fromStream(iss);
    }
    Torus32 valueT = modSwitchToTorus32(value, Msize);
    LweSample* ciphertext = new_gate_bootstrapping_ciphertext(globalSecretKey->params);
    lweSymEncrypt(ciphertext, valueT, alpha, globalSecretKey->lwe_key);

    std::ostringstream oss;
    export_lweSample_toStream(oss, ciphertext, globalSecretKey->params->in_out_params);

    std::string encodedCiphertext = base64_encode(reinterpret_cast<const unsigned char*>(oss.str().data()), oss.str().size());
    char* msg = (char*)malloc(encodedCiphertext.size() + 1);
    if (msg == nullptr) {
        return nullptr;
    }
    strcpy(msg, encodedCiphertext.c_str());
    return msg;
}

extern "C" int32_t decryptInteger(const char* base64Ciphertext, const char* base64SecretKey = nullptr) {
    if (base64SecretKey != nullptr) {
        std::string decodedKey = base64_decode(base64SecretKey);
        std::istringstream iss(decodedKey);
        globalSecretKey = new_tfheGateBootstrappingSecretKeySet_fromStream(iss);
    }

    std::string decodedCiphertext = base64_decode(base64Ciphertext);
    std::istringstream iss(decodedCiphertext);

    LweSample* ciphertext = new_gate_bootstrapping_ciphertext(globalSecretKey->params);
    import_lweSample_fromStream(iss, ciphertext, globalSecretKey->params->in_out_params);

    Torus32 decrypted = lweSymDecrypt(ciphertext, globalSecretKey->lwe_key, Msize);
    int32_t value = modSwitchFromTorus32(decrypted, Msize);
    return value;
}

extern "C" char* addCiphertexts(const char* base64Ciphertext1, const char* base64Ciphertext2, const char* base64PublicKey = nullptr) {
    if (base64PublicKey != nullptr) {
        std::string decodedKey = base64_decode(base64PublicKey);
        std::istringstream iss(decodedKey);
        globalPublicKey = new_tfheGateBootstrappingCloudKeySet_fromStream(iss);
    }

    std::string decodedCiphertext1 = base64_decode(base64Ciphertext1);
    std::string decodedCiphertext2 = base64_decode(base64Ciphertext2);

    std::istringstream iss1(decodedCiphertext1);
    std::istringstream iss2(decodedCiphertext2);

    LweSample* ciphertext1 = new_gate_bootstrapping_ciphertext(globalPublicKey->params);
    LweSample* ciphertext2 = new_gate_bootstrapping_ciphertext(globalPublicKey->params);
    LweSample* ciphertextSum = new_gate_bootstrapping_ciphertext(globalPublicKey->params);

    import_lweSample_fromStream(iss1, ciphertext1, globalPublicKey->params->in_out_params);
    import_lweSample_fromStream(iss2, ciphertext2, globalPublicKey->params->in_out_params);

    lweCopy(ciphertextSum, ciphertext1, globalPublicKey->params->in_out_params);
    lweAddTo(ciphertextSum, ciphertext2, globalPublicKey->params->in_out_params);

    std::ostringstream oss;
    export_lweSample_toStream(oss, ciphertextSum, globalPublicKey->params->in_out_params);

    std::string encodedCiphertextSum = base64_encode(reinterpret_cast<const unsigned char*>(oss.str().data()), oss.str().size());
    char* msg = (char*)malloc(encodedCiphertextSum.size() + 1);
    if (msg == nullptr) {
        return nullptr;
    }
    strcpy(msg, encodedCiphertextSum.c_str());
    return msg;
}

extern "C" char* subtractCiphertexts(const char* base64Ciphertext1, const char* base64Ciphertext2, const char* base64PublicKey = nullptr) {
    if (base64PublicKey != nullptr) {
        std::string decodedKey = base64_decode(base64PublicKey);
        std::istringstream iss(decodedKey);
        globalPublicKey = new_tfheGateBootstrappingCloudKeySet_fromStream(iss);
    }

    std::string decodedCiphertext1 = base64_decode(base64Ciphertext1);
    std::string decodedCiphertext2 = base64_decode(base64Ciphertext2);

    std::istringstream iss1(decodedCiphertext1);
    std::istringstream iss2(decodedCiphertext2);

    LweSample* ciphertext1 = new_gate_bootstrapping_ciphertext(globalPublicKey->params);
    LweSample* ciphertext2 = new_gate_bootstrapping_ciphertext(globalPublicKey->params);
    LweSample* ciphertextDiff = new_gate_bootstrapping_ciphertext(globalPublicKey->params);

    import_lweSample_fromStream(iss1, ciphertext1, globalPublicKey->params->in_out_params);
    import_lweSample_fromStream(iss2, ciphertext2, globalPublicKey->params->in_out_params);

    lweCopy(ciphertextDiff, ciphertext1, globalPublicKey->params->in_out_params);
    lweSubTo(ciphertextDiff, ciphertext2, globalPublicKey->params->in_out_params);

    std::ostringstream oss;
    export_lweSample_toStream(oss, ciphertextDiff, globalPublicKey->params->in_out_params);

    std::string encodedCiphertextDiff = base64_encode(reinterpret_cast<const unsigned char*>(oss.str().data()), oss.str().size());
    char* msg = (char*)malloc(encodedCiphertextDiff.size() + 1);
    if (msg == nullptr) {
        return nullptr;
    }
    strcpy(msg, encodedCiphertextDiff.c_str());
    return msg;
}

extern "C" void info() {
    std::cout << "TFHE Library: Enabling fully homomorphic encryption computations on encrypted data." << std::endl;
}

// Bind the functions using EMSCRIPTEN_BINDINGS
EMSCRIPTEN_BINDINGS(tfhe_module) {
    emscripten::function("generateSecretKey", &generateSecretKey);
    emscripten::function("generatePublicKey", &generatePublicKey);
    emscripten::function("encryptInteger", emscripten::select_overload<std::string(int)>(&encryptInteger));
    emscripten::function("decryptInteger", emscripten::select_overload<int(const std::string&)>(&decryptInteger));
    emscripten::function("addCiphertexts", emscripten::select_overload<std::string(const std::string&, const std::string&)>(&addCiphertexts));
    emscripten::function("subtractCiphertexts", emscripten::select_overload<std::string(const std::string&, const std::string&)>(&subtractCiphertexts));
}
