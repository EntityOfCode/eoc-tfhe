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

std::string generateSecretKey() {
    TFheGateBootstrappingParameterSet *params = new_default_gate_bootstrapping_parameters(minimum_lambda);
    TFheGateBootstrappingSecretKeySet *keyset = new_random_gate_bootstrapping_secret_keyset(params);
    std::ostringstream oss;
    export_tfheGateBootstrappingSecretKeySet_toStream(oss, keyset);

    // Base64 encode the serialized string
    std::string encoded = base64_encode(reinterpret_cast<const unsigned char*>(oss.str().data()), oss.str().size());
    return encoded;
}

std::string generatePublicKey(const std::string &base64_secret_key) {
    std::string decoded = base64_decode(base64_secret_key);
    std::istringstream iss(decoded);
    TFheGateBootstrappingSecretKeySet* secret_keyset = new_tfheGateBootstrappingSecretKeySet_fromStream(iss);

    const TFheGateBootstrappingCloudKeySet* public_keyset = &secret_keyset->cloud;
    std::ostringstream oss;
    export_tfheGateBootstrappingCloudKeySet_toStream(oss, public_keyset);

    // Base64 encode the serialized public key
    std::string encoded = base64_encode(reinterpret_cast<const unsigned char*>(oss.str().data()), oss.str().size());

    delete_gate_bootstrapping_secret_keyset(secret_keyset);
    return encoded;
}

TFheGateBootstrappingSecretKeySet* createSecretKeyFromBase64(const std::string &base64_str) {
    std::string decoded = base64_decode(base64_str);
    std::istringstream iss(decoded);
    TFheGateBootstrappingSecretKeySet* keyset = new_tfheGateBootstrappingSecretKeySet_fromStream(iss);
    return keyset;
}

std::string encryptInteger(int32_t value, const std::string &base64_secret_key) {
    TFheGateBootstrappingSecretKeySet *keyset = createSecretKeyFromBase64(base64_secret_key);

    Torus32 valueT = modSwitchToTorus32(value, Msize);
    LweSample *ciphertext = new_gate_bootstrapping_ciphertext(keyset->params);
    lweSymEncrypt(ciphertext, valueT, alpha, keyset->lwe_key);

    std::ostringstream oss;
    export_lweSample_toStream(oss, ciphertext, keyset->params->in_out_params);

    // Base64 encode the serialized ciphertext
    std::string encodedCiphertext = base64_encode(reinterpret_cast<const unsigned char*>(oss.str().data()), oss.str().size());

    delete_gate_bootstrapping_ciphertext(ciphertext);
    delete_gate_bootstrapping_secret_keyset(keyset);

    return encodedCiphertext;
}

int32_t decryptInteger(const std::string &base64_ciphertext, const std::string &base64_secret_key) {
    TFheGateBootstrappingSecretKeySet *keyset = createSecretKeyFromBase64(base64_secret_key);

    std::string decodedCiphertext = base64_decode(base64_ciphertext);
    std::istringstream iss(decodedCiphertext);

    LweSample *ciphertext = new_gate_bootstrapping_ciphertext(keyset->params);
    import_lweSample_fromStream(iss, ciphertext, keyset->params->in_out_params);

    Torus32 decryptedT = lweSymDecrypt(ciphertext, keyset->lwe_key, Msize);
    int32_t decryptedValue = modSwitchFromTorus32(decryptedT, Msize);

    delete_gate_bootstrapping_ciphertext(ciphertext);
    delete_gate_bootstrapping_secret_keyset(keyset);

    return decryptedValue;
}

std::string addCiphertexts(const std::string &base64_ciphertext1, const std::string &base64_ciphertext2, const std::string &base64_public_key) {
    std::string decodedCiphertext1 = base64_decode(base64_ciphertext1);
    std::string decodedCiphertext2 = base64_decode(base64_ciphertext2);
    std::string decodedPublicKey = base64_decode(base64_public_key);

    std::istringstream iss1(decodedCiphertext1);
    std::istringstream iss2(decodedCiphertext2);
    std::istringstream issPublicKey(decodedPublicKey);

    TFheGateBootstrappingCloudKeySet* cloud_keyset = new_tfheGateBootstrappingCloudKeySet_fromStream(issPublicKey);

    LweSample *ciphertext1 = new_gate_bootstrapping_ciphertext(cloud_keyset->params);
    LweSample *ciphertext2 = new_gate_bootstrapping_ciphertext(cloud_keyset->params);
    LweSample *ciphertextSum = new_gate_bootstrapping_ciphertext(cloud_keyset->params);

    import_lweSample_fromStream(iss1, ciphertext1, cloud_keyset->params->in_out_params);
    import_lweSample_fromStream(iss2, ciphertext2, cloud_keyset->params->in_out_params);

    lweCopy(ciphertextSum, ciphertext1, cloud_keyset->params->in_out_params);
    lweAddTo(ciphertextSum, ciphertext2, cloud_keyset->params->in_out_params);

    std::ostringstream oss;
    export_lweSample_toStream(oss, ciphertextSum, cloud_keyset->params->in_out_params);

    std::string encodedCiphertextSum = base64_encode(reinterpret_cast<const unsigned char*>(oss.str().data()), oss.str().size());

    delete_gate_bootstrapping_ciphertext(ciphertext1);
    delete_gate_bootstrapping_ciphertext(ciphertext2);
    delete_gate_bootstrapping_ciphertext(ciphertextSum);
    delete_gate_bootstrapping_cloud_keyset(cloud_keyset);

    return encodedCiphertextSum;
}

std::string subtractCiphertexts(const std::string &base64_ciphertext1, const std::string &base64_ciphertext2, const std::string &base64_public_key) {
    std::string decodedCiphertext1 = base64_decode(base64_ciphertext1);
    std::string decodedCiphertext2 = base64_decode(base64_ciphertext2);
    std::string decodedPublicKey = base64_decode(base64_public_key);

    std::istringstream iss1(decodedCiphertext1);
    std::istringstream iss2(decodedCiphertext2);
    std::istringstream issPublicKey(decodedPublicKey);

    TFheGateBootstrappingCloudKeySet* cloud_keyset = new_tfheGateBootstrappingCloudKeySet_fromStream(issPublicKey);

    LweSample *ciphertext1 = new_gate_bootstrapping_ciphertext(cloud_keyset->params);
    LweSample *ciphertext2 = new_gate_bootstrapping_ciphertext(cloud_keyset->params);
    LweSample *ciphertextDiff = new_gate_bootstrapping_ciphertext(cloud_keyset->params);

    import_lweSample_fromStream(iss1, ciphertext1, cloud_keyset->params->in_out_params);
    import_lweSample_fromStream(iss2, ciphertext2, cloud_keyset->params->in_out_params);

    lweCopy(ciphertextDiff, ciphertext1, cloud_keyset->params->in_out_params);
    lweSubTo(ciphertextDiff, ciphertext2, cloud_keyset->params->in_out_params);

    std::ostringstream oss;
    export_lweSample_toStream(oss, ciphertextDiff, cloud_keyset->params->in_out_params);

    std::string encodedCiphertextDiff = base64_encode(reinterpret_cast<const unsigned char*>(oss.str().data()), oss.str().size());

    delete_gate_bootstrapping_ciphertext(ciphertext1);
    delete_gate_bootstrapping_ciphertext(ciphertext2);
    delete_gate_bootstrapping_ciphertext(ciphertextDiff);
    delete_gate_bootstrapping_cloud_keyset(cloud_keyset);

    return encodedCiphertextDiff;
}

std::string encryptString(const std::string &text, const std::string &base64_secret_key) {
    TFheGateBootstrappingSecretKeySet *keyset = createSecretKeyFromBase64(base64_secret_key);

    int length = text.length();
    LweSample *ciphertext = new_gate_bootstrapping_ciphertext_array(length, keyset->params);
    for (int i = 0; i < length; ++i) {
        Torus32 valueT = modSwitchToTorus32((int32_t)text[i], Msize);
        lweSymEncrypt(&ciphertext[i], valueT, alpha, keyset->lwe_key);
    }

    std::ostringstream oss;
    for (int i = 0; i < length; ++i) {
        export_lweSample_toStream(oss, &ciphertext[i], keyset->params->in_out_params);
    }

    // Base64 encode the serialized ciphertext
    std::string encodedCiphertext = base64_encode(reinterpret_cast<const unsigned char*>(oss.str().data()), oss.str().size());

    delete_gate_bootstrapping_ciphertext_array(length, ciphertext);
    delete_gate_bootstrapping_secret_keyset(keyset);

    return encodedCiphertext;
}

std::string decryptString(const std::string &base64_ciphertext, const std::string &base64_secret_key, int length) {
    TFheGateBootstrappingSecretKeySet *keyset = createSecretKeyFromBase64(base64_secret_key);

    std::string decodedCiphertext = base64_decode(base64_ciphertext);
    std::istringstream iss(decodedCiphertext);

    LweSample *ciphertext = new_gate_bootstrapping_ciphertext_array(length, keyset->params);
    for (int i = 0; i < length; ++i) {
        import_lweSample_fromStream(iss, &ciphertext[i], keyset->params->in_out_params);
    }

    std::string decryptedText;
    for (int i = 0; i < length; ++i) {
        Torus32 decryptedT = lweSymDecrypt(&ciphertext[i], keyset->lwe_key, Msize);
        decryptedText.push_back((char)modSwitchFromTorus32(decryptedT, Msize));
    }

    delete_gate_bootstrapping_ciphertext_array(length, ciphertext);
    delete_gate_bootstrapping_secret_keyset(keyset);

    return decryptedText;
}

// Bind the functions using EMSCRIPTEN_BINDINGS
EMSCRIPTEN_BINDINGS(tfhe_module) {
    emscripten::function("generateSecretKey", &generateSecretKey);
    emscripten::function("generatePublicKey", &generatePublicKey);
    emscripten::function("encryptInteger", &encryptInteger);
    emscripten::function("decryptInteger", &decryptInteger);
    emscripten::function("addCiphertexts", &addCiphertexts);
    emscripten::function("subtractCiphertexts", &subtractCiphertexts);
    emscripten::function("encryptString", &encryptString);
    emscripten::function("decryptString", &decryptString);
}