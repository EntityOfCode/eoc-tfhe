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

// Global variables for keys
TFheGateBootstrappingSecretKeySet *globalSecretKey = nullptr;
TFheGateBootstrappingCloudKeySet *globalPublicKey = nullptr;

// Base64 encoding function
static const std::string base64_chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "abcdefghijklmnopqrstuvwxyz"
    "0123456789+/";

std::string base64_encode(const unsigned char *data, size_t len)
{
    std::string ret;
    int val = 0;
    int valb = -6;
    for (size_t i = 0; i < len; i++)
    {
        val = (val << 8) + data[i];
        valb += 8;
        while (valb >= 0)
        {
            ret.push_back(base64_chars[(val >> valb) & 0x3F]);
            valb -= 6;
        }
    }
    if (valb > -6)
        ret.push_back(base64_chars[((val << 8) >> (valb + 8)) & 0x3F]);
    while (ret.size() % 4)
        ret.push_back('=');
    return ret;
}

std::string base64_decode(const std::string &in)
{
    std::string out;
    std::vector<int> T(256, -1);
    for (int i = 0; i < 64; i++)
        T["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[i]] = i;
    int val = 0, valb = -8;
    for (unsigned char c : in)
    {
        if (T[c] == -1)
            break;
        val = (val << 6) + T[c];
        valb += 6;
        if (valb >= 0)
        {
            out.push_back(char((val >> valb) & 0xFF));
            valb -= 8;
        }
    }
    return out;
}

// Key generation functions
std::string generateSecretKey()
{
    std::cout << "Generating secret/public key started..." << std::endl;
    clock_t start = clock();
    TFheGateBootstrappingParameterSet *params = new_default_gate_bootstrapping_parameters(minimum_lambda);
    globalSecretKey = new_random_gate_bootstrapping_secret_keyset(params);
    globalPublicKey = const_cast<TFheGateBootstrappingCloudKeySet *>(&globalSecretKey->cloud);
    std::ostringstream oss;
    export_tfheGateBootstrappingSecretKeySet_toStream(oss, globalSecretKey);

    // Base64 encode the serialized string
    std::string encoded = base64_encode(reinterpret_cast<const unsigned char *>(oss.str().data()), oss.str().size());

    clock_t end = clock();
    std::cout << "Generating keys completed in " << (end - start) / CLOCKS_PER_SEC * 1000 << " ms" << std::endl;
    return encoded;
}

std::string generatePublicKey(const std::string &base64_secret_key)
{
    std::cout << "Generating public key started..." << std::endl;
    clock_t start = clock();
    std::string decodedSecretKey = base64_decode(base64_secret_key);
    std::istringstream iss(decodedSecretKey);
    globalSecretKey = new_tfheGateBootstrappingSecretKeySet_fromStream(iss);
    globalPublicKey = const_cast<TFheGateBootstrappingCloudKeySet *>(&globalSecretKey->cloud);

    std::ostringstream oss;
    export_tfheGateBootstrappingCloudKeySet_toStream(oss, globalPublicKey);

    // Base64 encode the serialized string
    std::string encoded = base64_encode(reinterpret_cast<const unsigned char *>(oss.str().data()), oss.str().size());

    clock_t end = clock();
    std::cout << "Generating public key completed in " << (end - start) / CLOCKS_PER_SEC * 1000 << " ms" << std::endl;
    return encoded;
}

// Encryption and decryption functions using the global secret key
std::string encryptInteger(int value)
{
    std::cout << "Encrypting integer started..." << std::endl;
    clock_t start = clock();
    if (!globalSecretKey)
    {
        throw std::runtime_error("Global secret key not initialized.");
    }
    Torus32 valueT = modSwitchToTorus32(value, Msize);
    LweSample *ciphertext = new_gate_bootstrapping_ciphertext(globalSecretKey->params);

    lweSymEncrypt(ciphertext, valueT, alpha, globalSecretKey->lwe_key);

    std::ostringstream oss;
    export_lweSample_toStream(oss, ciphertext, globalSecretKey->params->in_out_params);

    std::string encodedCiphertext = base64_encode(reinterpret_cast<const unsigned char *>(oss.str().data()), oss.str().size());

    delete_gate_bootstrapping_ciphertext(ciphertext);

    clock_t end = clock();
    std::cout << "Encrypting integer completed in " << (end - start) / CLOCKS_PER_SEC * 1000 << " ms" << std::endl;

    return encodedCiphertext;
}

int decryptInteger(const std::string &base64_ciphertext)
{
    std::cout << "Decrypting integer started..." << std::endl;
    clock_t start = clock();
    if (!globalSecretKey)
    {
        throw std::runtime_error("Global secret key not initialized.");
    }
    std::string decodedCiphertext = base64_decode(base64_ciphertext);
    std::istringstream iss(decodedCiphertext);

    LweSample *ciphertext = new_gate_bootstrapping_ciphertext(globalSecretKey->params);
    import_lweSample_fromStream(iss, ciphertext, globalSecretKey->params->in_out_params);

    Torus32 decrypted = lweSymDecrypt(ciphertext, globalSecretKey->lwe_key, Msize);

    delete_gate_bootstrapping_ciphertext(ciphertext);
    clock_t end = clock();
    std::cout << "Decrypting integer completed in " << (end - start) / CLOCKS_PER_SEC * 1000 << " ms" << std::endl;

    return modSwitchFromTorus32(decrypted, Msize);
}

// Computation functions using the global public key
std::string addCiphertexts(const std::string &base64_ciphertext1, const std::string &base64_ciphertext2)
{
    std::cout << "Adding ciphertexts started..." << std::endl;
    clock_t start = clock();
    if (!globalPublicKey)
    {
        throw std::runtime_error("Global public key not initialized.");
    }
    std::string decodedCiphertext1 = base64_decode(base64_ciphertext1);
    std::string decodedCiphertext2 = base64_decode(base64_ciphertext2);

    std::istringstream iss1(decodedCiphertext1);
    std::istringstream iss2(decodedCiphertext2);

    LweSample *ciphertext1 = new_gate_bootstrapping_ciphertext(globalPublicKey->params);
    LweSample *ciphertext2 = new_gate_bootstrapping_ciphertext(globalPublicKey->params);
    LweSample *ciphertextSum = new_gate_bootstrapping_ciphertext(globalPublicKey->params);

    import_lweSample_fromStream(iss1, ciphertext1, globalPublicKey->params->in_out_params);
    import_lweSample_fromStream(iss2, ciphertext2, globalPublicKey->params->in_out_params);

    lweCopy(ciphertextSum, ciphertext1, globalPublicKey->params->in_out_params);
    lweAddTo(ciphertextSum, ciphertext2, globalPublicKey->params->in_out_params);

    std::ostringstream oss;
    export_lweSample_toStream(oss, ciphertextSum, globalPublicKey->params->in_out_params);

    std::string encodedCiphertextSum = base64_encode(reinterpret_cast<const unsigned char *>(oss.str().data()), oss.str().size());

    delete_gate_bootstrapping_ciphertext(ciphertext1);
    delete_gate_bootstrapping_ciphertext(ciphertext2);
    delete_gate_bootstrapping_ciphertext(ciphertextSum);
    clock_t end = clock();
    std::cout << "Adding ciphertexts completed in " << (end - start) / CLOCKS_PER_SEC * 1000 << " ms" << std::endl;

    return encodedCiphertextSum;
}

std::string subtractCiphertexts(const std::string &base64_ciphertext1, const std::string &base64_ciphertext2)
{
    std::cout << "Subtracting ciphertexts started..." << std::endl;
    clock_t start = clock();
    if (!globalPublicKey)
    {
        throw std::runtime_error("Global public key not initialized.");
    }
    std::string decodedCiphertext1 = base64_decode(base64_ciphertext1);
    std::string decodedCiphertext2 = base64_decode(base64_ciphertext2);

    std::istringstream iss1(decodedCiphertext1);
    std::istringstream iss2(decodedCiphertext2);

    LweSample *ciphertext1 = new_gate_bootstrapping_ciphertext(globalPublicKey->params);
    LweSample *ciphertext2 = new_gate_bootstrapping_ciphertext(globalPublicKey->params);
    LweSample *ciphertextDiff = new_gate_bootstrapping_ciphertext(globalPublicKey->params);

    import_lweSample_fromStream(iss1, ciphertext1, globalPublicKey->params->in_out_params);
    import_lweSample_fromStream(iss2, ciphertext2, globalPublicKey->params->in_out_params);

    lweCopy(ciphertextDiff, ciphertext1, globalPublicKey->params->in_out_params);
    lweSubTo(ciphertextDiff, ciphertext2, globalPublicKey->params->in_out_params);

    std::ostringstream oss;
    export_lweSample_toStream(oss, ciphertextDiff, globalPublicKey->params->in_out_params);

    std::string encodedCiphertextDiff = base64_encode(reinterpret_cast<const unsigned char *>(oss.str().data()), oss.str().size());

    delete_gate_bootstrapping_ciphertext(ciphertext1);
    delete_gate_bootstrapping_ciphertext(ciphertext2);
    delete_gate_bootstrapping_ciphertext(ciphertextDiff);
    clock_t end = clock();
    std::cout << "Subtracting ciphertexts completed in " << (end - start) / CLOCKS_PER_SEC * 1000 << " ms" << std::endl;

    return encodedCiphertextDiff;
}

// Bind the functions using EMSCRIPTEN_BINDINGS
EMSCRIPTEN_BINDINGS(tfhe_module)
{
    emscripten::function("generateSecretKey", &generateSecretKey);
    emscripten::function("generatePublicKey", &generatePublicKey);
    emscripten::function("encryptInteger", emscripten::select_overload<std::string(int)>(&encryptInteger));
    emscripten::function("decryptInteger", emscripten::select_overload<int(const std::string &)>(&decryptInteger));
    emscripten::function("addCiphertexts", emscripten::select_overload<std::string(const std::string &, const std::string &)>(&addCiphertexts));
    emscripten::function("subtractCiphertexts", emscripten::select_overload<std::string(const std::string &, const std::string &)>(&subtractCiphertexts));
}
