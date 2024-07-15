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
#include "eoc-tfhe-run.h"

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

const char* addCiphertexts(const char* base64_ciphertext1, const char* base64_ciphertext2, const char* base64_public_key) {
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

    char* result = (char*)malloc(encodedCiphertextSum.size() + 1);
    strcpy(result, encodedCiphertextSum.c_str());
    return result;
}

const char* subtractCiphertexts(const char* base64_ciphertext1, const char* base64_ciphertext2, const char* base64_public_key) {
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

    char* result = (char*)malloc(encodedCiphertextDiff.size() + 1);
    strcpy(result, encodedCiphertextDiff.c_str());
    return result;
}
