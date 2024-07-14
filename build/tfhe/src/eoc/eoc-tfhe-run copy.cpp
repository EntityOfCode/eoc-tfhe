#include <iostream>
#include <fstream>
// #include "cereal/archives/portable_binary.hpp"
// #include <cereal/types/vector.hpp>
#include <time.h>
#include <tfhe_gate_bootstrapping_functions.h>
#include <numeric_functions.h>
#include <lwe-functions.h>
#include <string.h>
#include <memory>
#include <tfhe_io.h>

using namespace std;

static const int32_t Msize = (1LL << 31) - 1; // taille de l'espace des coeffs du polynome du message
// static const int8_t Msize8 = (1<<8)-1;
static const double alpha = 1. / (10. * Msize);
// static const double alpha8 = 1. / (10. * Msize8);
int32_t minimum_lambda = 100;

LweSample *encrypt8BitASCIIString(string &msg, const int16_t msgLength, TFheGateBootstrappingSecretKeySet *key)
{
    LweSample *ciphertext = new_gate_bootstrapping_ciphertext_array(msg.length(), key->params);
    // LweSample *temp = new_gate_bootstrapping_ciphertext_array(8 * messageLength, key->params);
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

void serializeSecretKey(TFheGateBootstrappingSecretKeySet &keyset)
{
    cout<< "Writing secretkeyset_export.dat"<<endl;
    FILE *F = fopen("secretkeyset_export.dat", "wb");
    if (!F)
    {
        perror("Failed to open file for writing");
        return;
    }
    // const set<const TFheGateBootstrappingSecretKeySet *> allgbsk = {&keyset};
    // for (const TFheGateBootstrappingSecretKeySet *gbsk : allgbsk)
    // {
        export_tfheGateBootstrappingSecretKeySet_toFile(F, &keyset);
    // }
    fclose(F);
}

void serializePublicKey(TFheGateBootstrappingCloudKeySet &keyset)
{
    cout<< "Writing publickeyset_export.dat"<<endl;
    FILE *F = fopen("publickeyset_export.dat", "wb");
    if (!F)
    {
        perror("Failed to open file for writing");
        return;
    }
    // const set<const TFheGateBootstrappingCloudKeySet *> allgbsk = {&keyset};
    // for (const TFheGateBootstrappingCloudKeySet *gbsk : allgbsk)
    // {
        export_tfheGateBootstrappingCloudKeySet_toFile(F, &keyset);
    // }
    fclose(F);
}




extern "C" int tfhe_test();
int tfhe_test()
{
    std::cout << "********** EOC TFHE App Started **************" << std::endl;
    clock_t start = clock();
    cout << "Generating keyset..." << endl;

    TFheGateBootstrappingParameterSet *params = new_default_gate_bootstrapping_parameters(minimum_lambda);
    // const LweParams *lweParams = params->in_out_params;
    // generate the secret keyset
    std::unique_ptr<TFheGateBootstrappingSecretKeySet> keyset(new_random_gate_bootstrapping_secret_keyset(params));
    // TFheGateBootstrappingSecretKeySet *keyset = new_random_gate_bootstrapping_secret_keyset(params);
    // generate the cloud keyset
    TFheGateBootstrappingCloudKeySet *cloud_keyset = const_cast<TFheGateBootstrappingCloudKeySet *>(&keyset->cloud);
    //  export the secret key to file for later use
    // {
    //     std::ofstream ofs{"keyset.data", std::ios::binary};
    //     cereal::PortableBinaryOutputArchive ar(ofs);
    //     ar(keyset);
    // };
    serializeSecretKey(*keyset);
    serializePublicKey(*cloud_keyset);
    clock_t end = clock();
    cout << "Keyset generated in: " << end - start << " microseconds" << endl;
    int32_t secret1 = 420;
    int32_t secret2 = 69;
    string str1 = "Hello Weavers, I've been FHE decrypted for you to see me!";
    string str2 = "Hello Weavers, I've been FHE decrypted for you to see me!";
    if (compareStrings(str1, str2))
        cout << "Strings should be equal" << endl;
    else
        cout << "Strings shouldn't be equal" << endl;
    string msg = "Hello Weavers, I've been FHE decrypted for you to see me!";
    cout << "Encrypting secrets: " << secret1 << " and " << secret2 << endl;
    start = clock();
    Torus32 secret1T = modSwitchToTorus32(secret1, Msize); // dtot32(secret1);//
    Torus32 secret2T = modSwitchToTorus32(secret2, Msize);
    LweSample *ciphertext1 = new_gate_bootstrapping_ciphertext(params);
    LweSample *ciphertext2 = new_gate_bootstrapping_ciphertext(params);
    LweSample *ciphertextSum = new_gate_bootstrapping_ciphertext(params);
    LweSample *ciphertextDiff = new_gate_bootstrapping_ciphertext(params);
    LweSample *ciphertextMsg = new_gate_bootstrapping_ciphertext_array(msg.length(), params);
    LweSample *str1Cipher = new_gate_bootstrapping_ciphertext_array(str1.length(), params);
    LweSample *str2Cipher = new_gate_bootstrapping_ciphertext_array(str2.length(), params);
    str1Cipher = encrypt8BitASCIIString(str1, str1.length(), keyset.get());
    str2Cipher = encrypt8BitASCIIString(str2, str2.length(), keyset.get());
    ciphertextMsg = encrypt8BitASCIIString(msg, msg.length(), keyset.get());
    lweSymEncrypt(ciphertext1, secret1T, alpha, keyset->lwe_key);
    lweSymEncrypt(ciphertext2, secret2T, alpha, keyset->lwe_key);
    secret1T = lwePhase(ciphertext1, keyset->lwe_key);
    secret2T = lwePhase(ciphertext2, keyset->lwe_key);
    lweCopy(ciphertextSum, ciphertext1, params->in_out_params);
    lweCopy(ciphertextDiff, ciphertext1, params->in_out_params);
    end = clock();
    cout << "Secrets encrypted in " << end - start << " microseconds" << endl;
    cout << "Start computations..." << endl;
    start = clock();
    lweAddTo(ciphertextSum, ciphertext2, cloud_keyset->params->in_out_params);
    lweSubTo(ciphertextDiff, ciphertext2, cloud_keyset->params->in_out_params);
    if (compareCiphertexts(str1Cipher, str2Cipher, str1.length(), keyset.get()))
        cout << "Ciphertexts are equal" << endl;
    else
        cout << "Ciphertexts are not equal" << endl;
    end = clock();
    cout << "Computations finished in " << end - start << " microseconds" << endl;
    start = clock();
    cout << "Decrypting results..." << endl;
    Torus32 decrypted1 = lweSymDecrypt(ciphertextSum, keyset->lwe_key, Msize);
    Torus32 decrypted2 = lweSymDecrypt(ciphertextDiff, keyset->lwe_key, Msize);

    int32_t decryptedSecret1 = modSwitchFromTorus32(decrypted1, Msize);
    int32_t decryptedSecret2 = modSwitchFromTorus32(decrypted2, Msize);

    string decryptedMsg = decrypt8BitASCIIString(ciphertextMsg, msg.length(), keyset.get());

    end = clock();
    cout << "Sum is " << decryptedSecret1 << endl;
    cout << "Diff is " << decryptedSecret2 << endl;
    cout << "Decrypted message is: " << decryptedMsg << endl;
    cout << "Decryption finished in " << end - start << " microseconds" << endl;
    cout << "********** EOC TFHE App Finished **************" << endl;
    return 0;
}