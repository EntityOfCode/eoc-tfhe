#include <sstream>
#include <iostream>
#include <fstream>
#include <ctime>
#include <string>
#include <vector>
#include <cstring>
#include "polynomials.h"
#include <set>
#include "tfhe.h"
#include <memory>
#include <cstdlib>
#include <array>
#include <algorithm>

// Optional features
#define ENABLE_JWT 1
#define ENABLE_OPENSSL 1

#if ENABLE_JWT
#include "jwt/jwt_all.h"
using json = nlohmann::json;
#endif

#if ENABLE_OPENSSL
#include <openssl/bio.h>
#include <openssl/evp.h>
#include <openssl/pem.h>
#include <openssl/rsa.h>
#endif

using namespace std;

int16_t minimum_lambda = 128;
static const int32_t Msize = (1LL << 31) - 1;
static const double alpha = 1. / (10. * Msize);

unique_ptr<TFheGateBootstrappingSecretKeySet> globalSecretKey = nullptr;
unique_ptr<TFheGateBootstrappingCloudKeySet> globalPublicKey = nullptr;
LweSample* globalString = nullptr;

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

#if ENABLE_JWT
// Basic JWT validation without using JWT::Decode to avoid exceptions
bool validateJWT(const std::string &token, const std::string &jwksBase64) 
{
    std::cout << "Validating JWT token...:" << token << std::endl;
    
    // Basic format validation
    if (token.empty()) {
        std::cout << "JWT validation failed: Empty token" << std::endl;
        return false;
    }

    // JWT must have 3 parts separated by dots
    size_t first_dot = token.find('.');
    size_t last_dot = token.rfind('.');
    
    if (first_dot == std::string::npos || last_dot == std::string::npos || 
        first_dot == last_dot || first_dot == 0 || last_dot == token.length() - 1) {
        std::cout << "JWT validation failed: Invalid token format" << std::endl;
        return false;
    }

    // Extract parts without decoding
    std::string header_b64 = token.substr(0, first_dot);
    std::string payload_b64 = token.substr(first_dot + 1, last_dot - first_dot - 1);
    std::string signature_b64 = token.substr(last_dot + 1);

    // Basic validation that each part is non-empty and contains valid base64 characters
    auto is_base64 = [](const std::string &s) {
        return !s.empty() && s.find_first_not_of(
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=") 
            == std::string::npos;
    };

    if (!is_base64(header_b64) || !is_base64(payload_b64) || !is_base64(signature_b64)) {
        std::cout << "JWT validation failed: Invalid base64 encoding" << std::endl;
        return false;
    }

    return true;
}
#else
bool validateJWT(const std::string &token, const std::string &jwksBase64)
{
    // When JWT is disabled, always return true
    return true;
}
#endif

LweSample *encrypt8BitASCII(string &msg, const int16_t msgLength, TFheGateBootstrappingSecretKeySet *key)
{
    LweSample *ciphertext = new_gate_bootstrapping_ciphertext_array(msg.length(), key->params);
    Torus32 msgT = modSwitchToTorus32(static_cast<int32_t>(msg.at(0)), Msize);
    for (int16_t i = 0; i < msgLength; i++)
    {
        msgT = modSwitchToTorus32(static_cast<int32_t>(msg.at(i)), Msize);
        lweSymEncrypt(ciphertext + i, msgT, alpha, key->lwe_key);
    }
    return ciphertext;
}

string decrypt8BitASCII(LweSample *ciphertext, const int16_t msgLength, const TFheGateBootstrappingSecretKeySet *key)
{
    Torus32 decryptedT;
    string decrypted;
    for (int16_t i = 0; i < msgLength; i++)
    {
        decryptedT = lweSymDecrypt(ciphertext + i, key->lwe_key, Msize);
        decryptedT = lwePhase(ciphertext + i, key->lwe_key);
        decrypted.push_back(static_cast<char>(modSwitchFromTorus32(decryptedT, Msize)));
    }
    return decrypted;
}

extern "C" void info()
{
    std::cout << "TFHE Library: Enabling fully homomorphic encryption computations on encrypted data." << std::endl;
    #if ENABLE_JWT
    std::cout << "JWT support: Enabled" << std::endl;
    #else
    std::cout << "JWT support: Disabled" << std::endl;
    #endif
    
    #if ENABLE_OPENSSL
    std::cout << "OpenSSL support: Enabled" << std::endl;
    #else
    std::cout << "OpenSSL support: Disabled" << std::endl;
    #endif
}

extern "C" void testJWT()
{
    std::cout << "Testing JWT validation using a static token and a static jwks.json" << std::endl;
    std::cout << "Short ASCII string inside job test using Hello Weavers! as demo string" << std::endl;

    string str1 = "Hello Weavers!";
    LweSample *str1Cipher = new_gate_bootstrapping_ciphertext_array(str1.length(), globalSecretKey->params);
    str1Cipher = encrypt8BitASCII(str1, str1.length(), globalSecretKey.get());

    string decryptedMsg = decrypt8BitASCII(str1Cipher, str1.length(), globalSecretKey.get());

    std::cout << "Decrypted message internal test: " << decryptedMsg << std::endl;

    #if ENABLE_JWT
    std::string token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlR0TU13TEllaUlDc0YtcF9SbWFidCJ9...";
    std::string jwksBase64 = "ewogICJrZXlzIjogWwogICAgewogICAgICAia3R5IjogIlJTQSIsCiAgICAgICJ1c2UiOiAic2lnIiwKI...";
    bool isValid = validateJWT(token, jwksBase64);
    if (isValid)
    {
        std::cout << "Token is valid." << std::endl;
    }
    else
    {
        std::cout << "Token is invalid." << std::endl;
    }
    #else
    std::cout << "JWT validation skipped (disabled at compile time)" << std::endl;
    #endif
}

extern "C" const char *generateSecretKey(const char *jwtToken, const char *jwksBase64)
{
    if (!validateJWT(jwtToken, jwksBase64))
    {
        std::cerr << "Invalid JWT token. Exiting..." << std::endl;
        return nullptr;
    }

    if (!globalSecretKey)
    {
        std::cout << "Generating secret key started..." << std::endl;
        clock_t start = clock();
        uint32_t seed = lrand48();
        srand(seed);
        tfhe_random_generator_setSeed(&seed, 1);

        TFheGateBootstrappingParameterSet *params = new_default_gate_bootstrapping_parameters(minimum_lambda);
        unique_ptr<TFheGateBootstrappingSecretKeySet> sk(new_random_gate_bootstrapping_secret_keyset(params));
        unique_ptr<TFheGateBootstrappingCloudKeySet> pk(const_cast<TFheGateBootstrappingCloudKeySet *>(&sk->cloud));
        globalSecretKey = std::move(sk);
        globalPublicKey = std::move(pk);
        std::ostringstream oss;
        export_tfheGateBootstrappingSecretKeySet_toStream(oss, globalSecretKey.get());
        std::string encodedKey = base64_encode(reinterpret_cast<const unsigned char *>(oss.str().data()), oss.str().size());

        clock_t end = clock();
        std::cout << "Generating secret key finished in " << (end - start) << " ms" << std::endl;
        char *encodedKeyCStr = new char[encodedKey.size() + 1];
        strcpy(encodedKeyCStr, encodedKey.c_str());
        return encodedKeyCStr;
    }
    else
    {
        std::cout << "Secret key is already generated for this instance..." << std::endl;
        return nullptr;
    }
}

extern "C" const char *encryptInteger_dummy(int value, const char *base64Key)
{
    std::cout << "Encrypting integer DUMMY DUMMY DUMMY " << value << " started..." << std::endl;
    clock_t start = clock();

    if (globalSecretKey)
    {
        LweSample *ciphertext = new_gate_bootstrapping_ciphertext(globalSecretKey.get()->params);
        Torus32 torusValue = modSwitchToTorus32(value, Msize);
        lweSymEncrypt(ciphertext, torusValue, alpha, globalSecretKey.get()->lwe_key);

        std::ostringstream oss;
        export_lweSample_toStream(oss, ciphertext, globalSecretKey.get()->params->in_out_params);
        std::string encodedCiphertext = base64_encode(reinterpret_cast<const unsigned char *>(oss.str().data()), oss.str().size());

        delete_gate_bootstrapping_ciphertext(ciphertext);

        clock_t end = clock();
        std::cout << "Encrypting integer completed in " << (end - start) << " ms" << std::endl;
        char *encodedCipherStr = new char[encodedCiphertext.size() + 1];
        strcpy(encodedCipherStr, encodedCiphertext.c_str());
        return encodedCipherStr;
    }
    else
    {
        std::cerr << "Secret key not initialized. Generate the secret key first." << std::endl;
        return nullptr;
    }
}

extern "C" const char *encryptInteger(int value, const char *base64Key)
{
    std::cout << "Encrypting integer " << value << " started..." << std::endl;
    clock_t start = clock();

    if (globalSecretKey)
    {
        LweSample *ciphertext = new_gate_bootstrapping_ciphertext(globalSecretKey.get()->params);
        Torus32 torusValue = modSwitchToTorus32(value, Msize);
        lweSymEncrypt(ciphertext, torusValue, alpha, globalSecretKey.get()->lwe_key);

        std::ostringstream oss;
        export_lweSample_toStream(oss, ciphertext, globalSecretKey.get()->params->in_out_params);
        std::string encodedCiphertext = base64_encode(reinterpret_cast<const unsigned char *>(oss.str().data()), oss.str().size());

        delete_gate_bootstrapping_ciphertext(ciphertext);

        clock_t end = clock();
        std::cout << "Encrypting integer completed in " << (end - start) << " ms" << std::endl;
        char *encodedCipherStr = new char[encodedCiphertext.size() + 1];
        strcpy(encodedCipherStr, encodedCiphertext.c_str());
        return encodedCipherStr;
    }
    else
    {
        std::cerr << "Secret key not initialized. Generate the secret key first." << std::endl;
        return nullptr;
    }
}

extern "C" const char *encrypt8BitASCIIString(const char *base64Ciphertext, const int16_t msgLength, const char *base64Key)
{
    clock_t start = clock();

    if (globalSecretKey)
    {
        std::string decodedCiphertext(base64Ciphertext);
        std::cout << "Encrypting 8bit ASCII String " << decodedCiphertext << " started..." << std::endl;
        std::cout << "Decoded ciphertext length: " << decodedCiphertext.length() << " Message length: " << msgLength << std::endl;
        
        LweSample *ciphertext = new_gate_bootstrapping_ciphertext_array(msgLength, globalSecretKey.get()->params);
        globalString = new_gate_bootstrapping_ciphertext_array(msgLength, globalSecretKey.get()->params);
        
        std::ostringstream oss;
        std::cout << "oss stream size: " << oss.str().size() << std::endl;

        globalString = encrypt8BitASCII(decodedCiphertext, msgLength, globalSecretKey.get());
  
        for (int i = 0; i < msgLength; ++i) {
            export_lweSample_toStream(oss, globalString+i, globalSecretKey.get()->params->in_out_params);
        }
        
        std::string encryptedCiphertext = base64_encode(reinterpret_cast<const unsigned char *>(oss.str().data()), oss.str().size());
        std::cout << "Encrypted string ciphertext length/size: " << encryptedCiphertext.length() << "/" << encryptedCiphertext.size() << std::endl;

        delete_gate_bootstrapping_ciphertext(ciphertext);

        clock_t end = clock();
        std::cout << "Encrypting 8bit ASCII string completed in " << (end - start) << " ms" << std::endl;
        char *encodedCipherStr = new char[encryptedCiphertext.size() + 1];
        strcpy(encodedCipherStr, encryptedCiphertext.c_str());
        return encodedCipherStr;
    }
    else
    {
        std::cerr << "Secret key not initialized. Generate the secret key first." << std::endl;
        return nullptr;
    }
}

extern "C" const char *decrypt8BitASCIIString(char *base64Ciphertext, const int16_t msgLength, const char *base64Key, const char *jwtToken, const char *jwksBase64)
{
    std::cout << "Decrypting ASCII string started..." << std::endl;
    
    if (!validateJWT(jwtToken, jwksBase64))
    {
        std::cerr << "Invalid JWT token. Exiting..." << std::endl;
        return nullptr;
    }
    
    clock_t start = clock();
    
    if (globalSecretKey)
    {
        std::string decodedCiphertext = base64_decode(base64Ciphertext);
        std::istringstream issCiphertext(decodedCiphertext);
        std::cout << "Decoded ciphertext length: " << decodedCiphertext.length() << " Message length: " << msgLength << std::endl;
        
        LweSample *ciphertext = new_gate_bootstrapping_ciphertext_array(msgLength, globalSecretKey.get()->params);
        for (int i = 0; i < msgLength; ++i) {
            import_lweSample_fromStream(issCiphertext, ciphertext+i, globalSecretKey.get()->params->in_out_params);
        }
        
        std::string decryptedValue = decrypt8BitASCII(ciphertext, msgLength, globalSecretKey.get());
        std::string decryptedMsg = decrypt8BitASCII(globalString, msgLength, globalSecretKey.get());

        delete_gate_bootstrapping_ciphertext(ciphertext);

        clock_t end = clock();
        std::cout << "Decrypting ASCII string completed in " << (end - start) << " ms" << std::endl;
        char *decryptedValueCStr = new char[decryptedValue.size() + 1];
        strcpy(decryptedValueCStr, decryptedValue.c_str());
        return decryptedValueCStr;
    }
    else
    {
        std::cerr << "Secret key not initialized. Generate the secret key first." << std::endl;
        return nullptr;
    }
}

extern "C" const int decryptInteger(char *base64Ciphertext, const char *base64Key, const char *jwtToken, const char *jwksBase64)
{
    if (!validateJWT(jwtToken, jwksBase64))
    {
        std::cerr << "Invalid JWT token. Exiting..." << std::endl;
        return -1;
    }
    std::cout << "Decrypting integer started..." << std::endl;
    clock_t start = clock();
    
    if (globalSecretKey)
    {
        std::string decodedCiphertext = base64_decode(base64Ciphertext);
        std::istringstream issCiphertext(decodedCiphertext);

        LweSample *ciphertext = new_gate_bootstrapping_ciphertext(globalSecretKey.get()->params);
        import_lweSample_fromStream(issCiphertext, ciphertext, globalSecretKey.get()->params->in_out_params);

        Torus32 decryptedTorus = lweSymDecrypt(ciphertext, globalSecretKey.get()->lwe_key, Msize);
        int decryptedValue = modSwitchFromTorus32(decryptedTorus, Msize);

        delete_gate_bootstrapping_ciphertext(ciphertext);

        clock_t end = clock();
        std::cout << "Decrypting integer completed in " << (end - start) << " ms" << std::endl;
        return decryptedValue;
    }
    else
    {
        std::cerr << "Secret key not initialized. Generate the secret key first." << std::endl;
        return -1;
    }
}

extern "C" const char *addCiphertexts(const char *base64Ciphertext1, const char *base64Ciphertext2, const char *base64PublicKey)
{
    std::cout << "Adding ciphertexts started..." << std::endl;
    clock_t start = clock();
    
    if (globalPublicKey)
    {
        std::string decodedCiphertext1 = base64_decode(base64Ciphertext1);
        std::string decodedCiphertext2 = base64_decode(base64Ciphertext2);

        std::istringstream iss1(decodedCiphertext1);
        std::istringstream iss2(decodedCiphertext2);

        LweSample *ciphertext1 = new_gate_bootstrapping_ciphertext(globalSecretKey.get()->params);
        LweSample *ciphertext2 = new_gate_bootstrapping_ciphertext(globalSecretKey.get()->params);
        LweSample *ciphertextSum = new_gate_bootstrapping_ciphertext(globalSecretKey.get()->params);

        import_lweSample_fromStream(iss1, ciphertext1, globalSecretKey.get()->params->in_out_params);
        import_lweSample_fromStream(iss2, ciphertext2, globalSecretKey.get()->params->in_out_params);

        lweCopy(ciphertextSum, ciphertext1, globalSecretKey.get()->params->in_out_params);
        lweAddTo(ciphertextSum, ciphertext2, globalSecretKey.get()->params->in_out_params);
        
        delete_gate_bootstrapping_ciphertext(ciphertext1);
        delete_gate_bootstrapping_ciphertext(ciphertext2);

        std::ostringstream oss;
        export_lweSample_toStream(oss, ciphertextSum, globalSecretKey.get()->params->in_out_params);
        delete_gate_bootstrapping_ciphertext(ciphertextSum);
        std::string encodedCiphertextSum = base64_encode(reinterpret_cast<const unsigned char *>(oss.str().data()), oss.str().size());

        char *encodedCipherStr = new char[encodedCiphertextSum.size() + 1];
        strcpy(encodedCipherStr, encodedCiphertextSum.c_str());

        clock_t end = clock();
        std::cout << "Adding ciphertexts completed in " << (end - start) << " ms" << std::endl;
        return encodedCipherStr;
    }
    else
    {
        std::cerr << "Public key not initialized. Generate the public key first." << std::endl;
        return nullptr;
    }
}

extern "C" const char *subtractCiphertexts(const char *base64Ciphertext1, const char *base64Ciphertext2, const char *base64PublicKey)
{
    clock_t start = clock();
    if (globalPublicKey)
    {
        std::string decodedCiphertext1 = base64_decode(base64Ciphertext1);
        std::string decodedCiphertext2 = base64_decode(base64Ciphertext2);

        std::istringstream iss1(decodedCiphertext1);
        std::istringstream iss2(decodedCiphertext2);

        LweSample *ciphertext1 = new_gate_bootstrapping_ciphertext(globalSecretKey.get()->params);
        LweSample *ciphertext2 = new_gate_bootstrapping_ciphertext(globalSecretKey.get()->params);
        LweSample *ciphertextSub = new_gate_bootstrapping_ciphertext(globalSecretKey.get()->params);

        import_lweSample_fromStream(iss1, ciphertext1, globalSecretKey.get()->params->in_out_params);
        import_lweSample_fromStream(iss2, ciphertext2, globalSecretKey.get()->params->in_out_params);

        lweCopy(ciphertextSub, ciphertext1, globalSecretKey.get()->params->in_out_params);
        lweSubTo(ciphertextSub, ciphertext2, globalSecretKey.get()->params->in_out_params);

        delete_gate_bootstrapping_ciphertext(ciphertext1);
        delete_gate_bootstrapping_ciphertext(ciphertext2);

        std::ostringstream oss;
        export_lweSample_toStream(oss, ciphertextSub, globalSecretKey.get()->params->in_out_params);
        delete_gate_bootstrapping_ciphertext(ciphertextSub);
        std::string encodedCiphertextSub = base64_encode(reinterpret_cast<const unsigned char *>(oss.str().data()), oss.str().size());

        char *encodedCipherStr = new char[encodedCiphertextSub.size() + 1];
        strcpy(encodedCipherStr, encodedCiphertextSub.c_str());

        clock_t end = clock();
        std::cout << "Subtracting ciphertexts completed in " << (end - start) << " ms" << std::endl;
        return encodedCipherStr;
    }
    else
    {
        std::cerr << "Public key not initialized. Generate the public key first." << std::endl;
        return nullptr;
    }
}
