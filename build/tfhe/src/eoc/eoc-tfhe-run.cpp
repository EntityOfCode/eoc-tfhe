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
#include <memory>

using namespace std;

int32_t minimum_lambda = 128;
static const int32_t Msize = (1LL << 31) - 1;
static const double alpha = 1. / (10. * Msize);

unique_ptr<TFheGateBootstrappingSecretKeySet> globalSecretKey = nullptr;
unique_ptr<TFheGateBootstrappingCloudKeySet> globalPublicKey = nullptr;

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

extern "C" void info()
{
    std::cout << "TFHE Library: Enabling fully homomorphic encryption computations on encrypted data. Test Version" << std::endl;
}

extern "C" char *generateSecretKey()
{
    if (!globalSecretKey)
    {
        std::cout << "Generating secret key started..." << std::endl;
        clock_t start = clock();

        TFheGateBootstrappingParameterSet *params = new_default_gate_bootstrapping_parameters(minimum_lambda);
        unique_ptr<TFheGateBootstrappingSecretKeySet> sk(new_random_gate_bootstrapping_secret_keyset(params));
        unique_ptr<TFheGateBootstrappingCloudKeySet> pk(const_cast<TFheGateBootstrappingCloudKeySet *>(&globalSecretKey->cloud));
        globalSecretKey = std::move(sk);//new_random_gate_bootstrapping_secret_keyset(params);
        globalPublicKey = std::move(pk);//const_cast<TFheGateBootstrappingCloudKeySet *>(&globalSecretKey->cloud);
        std::ostringstream oss;
        export_tfheGateBootstrappingSecretKeySet_toStream(oss, globalSecretKey.get());
        std::string encodedKey = base64_encode(reinterpret_cast<const unsigned char *>(oss.str().data()), oss.str().size());

        char *msg = (char *)malloc(encodedKey.size() + 1);
        if (msg == nullptr)
        {
            return nullptr;
        }
        strcpy(msg, encodedKey.c_str());

        clock_t end = clock();
        std::cout << "Generating secret key started at: " << start << " ended at " << end << " completed in " << (end - start) << " ms" << std::endl;
        return msg;
    }
    else
    {
        std::cout << "Secret key is already generated for this instance..." << std::endl;
        return nullptr;
    }
}

extern "C" char *generatePublicKey()
{
    std::cout << "Generating public key started..." << std::endl;
    clock_t start = clock();

    if (!globalSecretKey)
    {
        std::cerr << "Secret key not initialized. Generate the secret key first." << std::endl;
        return nullptr;
    }

    unique_ptr<TFheGateBootstrappingCloudKeySet> pk(const_cast<TFheGateBootstrappingCloudKeySet *>(&globalSecretKey->cloud));
    globalPublicKey = std::move(pk);//const_cast<TFheGateBootstrappingCloudKeySet *>(&globalSecretKey->cloud);

    std::ostringstream oss;
    export_tfheGateBootstrappingCloudKeySet_toStream(oss, globalPublicKey.get());
    std::string encodedKey = base64_encode(reinterpret_cast<const unsigned char *>(oss.str().data()), oss.str().size());

    char *msg = (char *)malloc(encodedKey.size() + 1);
    if (msg == nullptr)
    {
        return nullptr;
    }
    strcpy(msg, encodedKey.c_str());

    clock_t end = clock();
    std::cout << "Generating public key completed in " << (end - start) / CLOCKS_PER_SEC * 1000 << " ms" << std::endl;
    return nullptr;
}

extern "C" char *encryptInteger(int value, const char *base64Key)
{
    std::cout << "Encrypting integer " << value << " started..." << std::endl;
    clock_t start = clock();

    TFheGateBootstrappingSecretKeySet *keyset;
    if (base64Key == nullptr)
    {
        keyset = globalSecretKey.get();
    }
    else
    {
        std::string decodedKey = base64_decode(base64Key);
        std::istringstream iss(decodedKey);
        keyset = new_tfheGateBootstrappingSecretKeySet_fromStream(iss);
    }

    LweSample *ciphertext = new_gate_bootstrapping_ciphertext(keyset->params);
    Torus32 torusValue = modSwitchToTorus32(value, Msize);
    lweSymEncrypt(ciphertext, torusValue, alpha, keyset->lwe_key);

    std::ostringstream oss;
    export_lweSample_toStream(oss, ciphertext, keyset->params->in_out_params);
    std::string encodedCiphertext = base64_encode(reinterpret_cast<const unsigned char *>(oss.str().data()), oss.str().size());

    char *msg = (char *)malloc(encodedCiphertext.size() + 1);
    if (msg == nullptr)
    {
        return nullptr;
    }
    strcpy(msg, encodedCiphertext.c_str());

    delete_gate_bootstrapping_ciphertext(ciphertext);
    if (base64Key != nullptr)
    {
        delete_gate_bootstrapping_secret_keyset(keyset);
    }

    clock_t end = clock();
    std::cout << "Encrypting integer completed in " << (end - start)  << " ms" << std::endl;
    return msg;
}

extern "C" int decryptInteger(char *base64Ciphertext, const char *base64Key)
{
    std::cout << "Decrypting integer started..." << *base64Ciphertext << std::endl;
    clock_t start = clock();

    TFheGateBootstrappingSecretKeySet *keyset;
    if (base64Key == nullptr)
    {
        keyset = globalSecretKey.get();
    }
    else
    {
        std::string decodedKey = base64_decode(base64Key);
        std::istringstream iss(decodedKey);
        keyset = new_tfheGateBootstrappingSecretKeySet_fromStream(iss);
    }

    std::string decodedCiphertext = base64_decode(base64Ciphertext);
    std::istringstream issCiphertext(decodedCiphertext);

    LweSample *ciphertext = new_gate_bootstrapping_ciphertext(keyset->params);
    import_lweSample_fromStream(issCiphertext, ciphertext, keyset->params->in_out_params);

    Torus32 decryptedTorus = lweSymDecrypt(ciphertext, keyset->lwe_key, Msize);
    int decryptedValue = modSwitchFromTorus32(decryptedTorus, Msize);

    delete_gate_bootstrapping_ciphertext(ciphertext);
    if (base64Key != nullptr)
    {
        delete_gate_bootstrapping_secret_keyset(keyset);
    }

    clock_t end = clock();
    std::cout << "Decrypting " << decryptedValue <<" integer completed in " << (end - start)  << " ms" << std::endl;
    return decryptedValue;
}

extern "C" char *addCiphertexts(const char *base64Ciphertext1, const char *base64Ciphertext2, const char *base64PublicKey)
{
    std::cout << "Adding ciphertexts started..." << std::endl;
    clock_t start = clock();

    TFheGateBootstrappingCloudKeySet *keyset;
    if (base64PublicKey == nullptr)
    {
        keyset = globalPublicKey.get();
    }
    else
    {
        std::string decodedPublicKey = base64_decode(base64PublicKey);
        std::istringstream issPublicKey(decodedPublicKey);
        keyset = new_tfheGateBootstrappingCloudKeySet_fromStream(issPublicKey);
    }

    std::string decodedCiphertext1 = base64_decode(base64Ciphertext1);
    std::string decodedCiphertext2 = base64_decode(base64Ciphertext2);

    std::istringstream iss1(decodedCiphertext1);
    std::istringstream iss2(decodedCiphertext2);

    LweSample *ciphertext1 = new_gate_bootstrapping_ciphertext(keyset->params);
    LweSample *ciphertext2 = new_gate_bootstrapping_ciphertext(keyset->params);
    LweSample *ciphertextSum = new_gate_bootstrapping_ciphertext(keyset->params);

    import_lweSample_fromStream(iss1, ciphertext1, keyset->params->in_out_params);
    import_lweSample_fromStream(iss2, ciphertext2, keyset->params->in_out_params);

    lweCopy(ciphertextSum, ciphertext1, keyset->params->in_out_params);
    lweAddTo(ciphertextSum, ciphertext2, keyset->params->in_out_params);

    std::ostringstream oss;
    export_lweSample_toStream(oss, ciphertextSum, keyset->params->in_out_params);
    std::string encodedCiphertextSum = base64_encode(reinterpret_cast<const unsigned char *>(oss.str().data()), oss.str().size());

    char *msg = (char *)malloc(encodedCiphertextSum.size() + 1);
    if (msg == nullptr)
    {
        return nullptr;
    }
    strcpy(msg, encodedCiphertextSum.c_str());

    delete_gate_bootstrapping_ciphertext(ciphertext1);
    delete_gate_bootstrapping_ciphertext(ciphertext2);
    delete_gate_bootstrapping_ciphertext(ciphertextSum);
    if (base64PublicKey != nullptr)
    {
        delete_gate_bootstrapping_cloud_keyset(keyset);
    }

    clock_t end = clock();
    std::cout << "Adding ciphertexts completed in " << (end - start)  << " ms" << std::endl;
    return msg;
}

extern "C" char *subtractCiphertexts(const char *base64Ciphertext1, const char *base64Ciphertext2, const char *base64PublicKey)
{
    std::cout << "Subtracting ciphertexts started..." << std::endl;
    clock_t start = clock();

    TFheGateBootstrappingCloudKeySet *keyset;
    if (base64PublicKey == nullptr)
    {
        keyset = globalPublicKey.get();
    }
    else
    {
        std::string decodedPublicKey = base64_decode(base64PublicKey);
        std::istringstream issPublicKey(decodedPublicKey);
        keyset = new_tfheGateBootstrappingCloudKeySet_fromStream(issPublicKey);
    }

    std::string decodedCiphertext1 = base64_decode(base64Ciphertext1);
    std::string decodedCiphertext2 = base64_decode(base64Ciphertext2);

    std::istringstream iss1(decodedCiphertext1);
    std::istringstream iss2(decodedCiphertext2);

    LweSample *ciphertext1 = new_gate_bootstrapping_ciphertext(keyset->params);
    LweSample *ciphertext2 = new_gate_bootstrapping_ciphertext(keyset->params);
    LweSample *ciphertextDiff = new_gate_bootstrapping_ciphertext(keyset->params);

    import_lweSample_fromStream(iss1, ciphertext1, keyset->params->in_out_params);
    import_lweSample_fromStream(iss2, ciphertext2, keyset->params->in_out_params);

    lweCopy(ciphertextDiff, ciphertext1, keyset->params->in_out_params);
    lweSubTo(ciphertextDiff, ciphertext2, keyset->params->in_out_params);

    std::ostringstream oss;
    export_lweSample_toStream(oss, ciphertextDiff, keyset->params->in_out_params);
    std::string encodedCiphertextDiff = base64_encode(reinterpret_cast<const unsigned char *>(oss.str().data()), oss.str().size());

    char *msg = (char *)malloc(encodedCiphertextDiff.size() + 1);
    if (msg == nullptr)
    {
        return nullptr;
    }
    strcpy(msg, encodedCiphertextDiff.c_str());

    delete_gate_bootstrapping_ciphertext(ciphertext1);
    delete_gate_bootstrapping_ciphertext(ciphertext2);
    delete_gate_bootstrapping_ciphertext(ciphertextDiff);
    if (base64PublicKey != nullptr)
    {
        delete_gate_bootstrapping_cloud_keyset(keyset);
    }

    clock_t end = clock();
    std::cout << "Substracting ciphertexts completed in " << (end - start)  << " ms" << std::endl;
    return msg;
}
