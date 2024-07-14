#include <sstream>
#include <iostream>
#include <fstream>
#include <time.h>
#include <string>
#include <tfhe_gate_bootstrapping_functions.h>
#include <numeric_functions.h>
#include <lwe-functions.h>
#include <string.h>
#include <tgsw.h>
#include <tfhe_core.h>
#include <polynomials.h>
#include <set>
#include <tfhe_io.h>
// #include <emscripten/bind.h> // Include the Emscripten header

using namespace std;


static const int32_t Msize = (1LL << 31) - 1; // taille de l'espace des coeffs du polynome du message
static const double alpha = 1. / (10. * Msize);
int32_t minimum_lambda = 100;

LweSample *encrypt8BitASCIIString(string &msg, const int16_t msgLength, TFheGateBootstrappingSecretKeySet *key)
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

string decrypt8BitASCIIString(LweSample *ciphertext, const int16_t msgLength, const TFheGateBootstrappingSecretKeySet *key)
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

bool compareStrings(string &msg1, string &msg2)
{
    if (msg1.length() != msg2.length())
        return false;
    for (int i = 0; i < static_cast<int>(msg1.length()); i++)
    {
        if (msg1.at(i) != msg2.at(i))
            return false;
    }
    return true;
}

bool compareCiphertexts(LweSample *ciphertext1, LweSample *ciphertext2, const int16_t msgLength, const TFheGateBootstrappingSecretKeySet *key)
{
    Torus32 decryptedT1;
    Torus32 decryptedT2;
    for (int16_t i = 0; i < msgLength; i++)
    {
        decryptedT1 = lweSymDecrypt(ciphertext1 + i, key->lwe_key, Msize);
        decryptedT2 = lweSymDecrypt(ciphertext2 + i, key->lwe_key, Msize);
        if (decryptedT1 != decryptedT2)
            return false;
    }
    return true;
}

extern "C" const char* generateKey();
const char* generateKey(){
    TFheGateBootstrappingParameterSet *params = new_default_gate_bootstrapping_parameters(minimum_lambda);
    TFheGateBootstrappingSecretKeySet *keyset = new_random_gate_bootstrapping_secret_keyset(params);
    ostringstream oss;
    export_tfheGateBootstrappingSecretKeySet_toStream(oss, keyset);
    string str = oss.str();
    const char* msg = str.c_str();
    return msg;
}

// // Use EMSCRIPTEN_BINDINGS to bind the generateKey function
// EMSCRIPTEN_BINDINGS(tfhe_module) {
//     emscripten::function("generateKey", &generateKey);
//     // emscripten::function("malloc", &std::malloc);
// }
