#include <sstream>
#include <iostream>
#include <fstream>
#include <time.h>
#include <tfhe_gate_bootstrapping_functions.h>
#include <numeric_functions.h>
#include <lwe-functions.h>
#include <string.h>
#include <tgsw.h>
#include <tfhe_core.h>
#include <polynomials.h>
#include <set>
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

struct GateBootstrappingSecretKeySetDeleter {
    void operator()(TFheGateBootstrappingSecretKeySet* keyset) const {
        delete_gate_bootstrapping_secret_keyset(keyset);
    }
};
void serialize_to_json(const std::string &filename, TFheGateBootstrappingSecretKeySet &keyset)
{
    //     json j = keyset.to_json();

    // // Scrierea în fișier
    // std::ofstream ofs(filename);
    // if (ofs) {
    //     ofs << j.dump(4); // Indentare cu 4 spații pentru lizibilitate
    //     ofs.close();
    // } else {
    //     std::cerr << "Failed to open file for writing.\n";
    // }
}

void serializeSecretKey(TFheGateBootstrappingSecretKeySet &keyset)
{
    cout << "Saving secret key to secretkeyset_export.dat" << endl;
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
    cout << "Saving public key to publickeyset_export.dat" << endl;
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


void serialize(const std::string &filename,TFheGateBootstrappingSecretKeySet &keyset)
{
    std::ofstream ofs(filename);
    if (ofs)
    {
    //     ofs << "Secret Key Structure" << "\n";
    //     ofs << " - params: " << keyset.params << "\n";
    //     ofs << "          ks_t: " << keyset.params->ks_t << "\n";
    //     ofs << "    ks_basebit: " << keyset.params->ks_basebit << "\n";
    //     ofs << "-in_out_params: " << keyset.params->in_out_params << "\n";
    //     ofs << "               n: " << keyset.params->in_out_params->n << "\n";
    //     ofs << "       alpha_min: " << keyset.params->in_out_params->alpha_min << "\n";
    //     ofs << "       alpha_max: " << keyset.params->in_out_params->alpha_max << "\n";
    //     ofs << "- tgsw_params: " << keyset.params->tgsw_params << "\n";
    //     ofs << "               l: " << keyset.params->tgsw_params->l << "\n";
    //     ofs << "           Bgbit: " << keyset.params->tgsw_params->Bgbit << "\n";
    //     ofs << "          halfBg: " << keyset.params->tgsw_params->halfBg << "\n";
    //     ofs << "         maskMod: " << keyset.params->tgsw_params->maskMod << "\n";
    //     ofs << "             kpl: " << keyset.params->tgsw_params->kpl << "\n";
    //     ofs << "        (Torus)h: " << *keyset.params->tgsw_params->h << "\n";
    //     ofs << "          offset: " << keyset.params->tgsw_params->offset << "\n";
    //     ofs << "    -tlwe_params: " << keyset.params->tgsw_params->tlwe_params << "\n";
    //     ofs << "                 N: " << keyset.params->tgsw_params->tlwe_params->N << "\n";
    //     ofs << "                 k: " << keyset.params->tgsw_params->tlwe_params->k << "\n";
    //     ofs << "         alpha_min: " << keyset.params->tgsw_params->tlwe_params->alpha_min << "\n";
    //     ofs << "         alpha_max: " << keyset.params->tgsw_params->tlwe_params->alpha_max << "\n";
    //     ofs << "extracted_lweparams \n";
    //     ofs << "                   n: " << keyset.params->tgsw_params->tlwe_params->extracted_lweparams.n << "\n";
    //     ofs << "           alpha_min: " << keyset.params->tgsw_params->tlwe_params->extracted_lweparams.alpha_min << "\n";
    //     ofs << "           alpha_max: " << keyset.params->tgsw_params->tlwe_params->extracted_lweparams.alpha_max << "\n";
    //     ofs << " - LweKey: " << keyset.lwe_key << "\n";
    //     ofs << "    -params: " << keyset.lwe_key->params << "\n";
    //     ofs << "               n: " << keyset.lwe_key->params->n << "\n";
    //     ofs << "       alpha_min: " << keyset.lwe_key->params->alpha_min << "\n";
    //     ofs << "       alpha_max: " << keyset.lwe_key->params->alpha_max << "\n";
    //     ofs << "     -key: " << keyset.lwe_key->key << " : ";
    //             for (int i = 0; i < keyset.lwe_key->params->n; ++i) {
    //                 ofs << keyset.lwe_key->key[i];
    //             }
    //     ofs << " -TGswKey: " << keyset.tgsw_key << "\n";
    //     ofs << "     -params: " << keyset.tgsw_key->params << "\n";
    //     ofs << "               l: " << keyset.tgsw_key->params->l << "\n";
    //     ofs << "           Bgbit: " << keyset.tgsw_key->params->Bgbit << "\n";
    //     ofs << "          halfBg: " << keyset.tgsw_key->params->halfBg << "\n";
    //     ofs << "         maskMod: " << keyset.tgsw_key->params->maskMod << "\n";
    //     ofs << "             kpl: " << keyset.tgsw_key->params->kpl << "\n";
    //     ofs << "        (Torus)h: " << *keyset.tgsw_key->params->h << "\n";
    //     ofs << "          offset: " << keyset.tgsw_key->params->offset << "\n";
    //     ofs << "    -tlwe_params: " << keyset.tgsw_key->params->tlwe_params << "\n";
    //     ofs << "                  N: " << keyset.tgsw_key->params->tlwe_params->N << "\n";
    //     ofs << "                  k: " << keyset.tgsw_key->params->tlwe_params->k << "\n";
    //     ofs << "          alpha_min: " << keyset.tgsw_key->params->tlwe_params->alpha_min << "\n";
    //     ofs << "           alpha_max: " << keyset.tgsw_key->params->tlwe_params->alpha_max << "\n";
    //     ofs << "    extracted_lweparams \n";
    //     ofs << "                      n: " << keyset.tgsw_key->params->tlwe_params->extracted_lweparams.n << "\n";
    //     ofs << "              alpha_min: " << keyset.tgsw_key->params->tlwe_params->extracted_lweparams.alpha_min << "\n";
    //     ofs << "              alpha_max: " << keyset.tgsw_key->params->tlwe_params->extracted_lweparams.alpha_max << "\n";
    //     ofs << "-tlwe_params: " << keyset.tgsw_key->tlwe_params << "\n";
    //     ofs << "              N: " << keyset.tgsw_key->tlwe_params->N << "\n";
    //     ofs << "              k: " << keyset.tgsw_key->tlwe_params->k << "\n";
    //     ofs << "      alpha_min: " << keyset.tgsw_key->tlwe_params->alpha_min << "\n";
    //     ofs << "      alpha_max: " << keyset.tgsw_key->tlwe_params->alpha_max << "\n";
    //     ofs << "extracted_lweparams \n";
    //     ofs << "                  n: " << keyset.tgsw_key->params->tlwe_params->extracted_lweparams.n << "\n";
    //     ofs << "          alpha_min: " << keyset.tgsw_key->params->tlwe_params->extracted_lweparams.alpha_min << "\n";
    //     ofs << "          alpha_max: " << keyset.tgsw_key->params->tlwe_params->extracted_lweparams.alpha_max << "\n";
    //     ofs << "        -key: " << keyset.tgsw_key->key << "\n";
    //     ofs << "             N: " << keyset.tgsw_key->key->N << "\n";
    //     ofs << "         coefs: " << keyset.tgsw_key->key->coefs << " : ";
    //     for (int i = 0; i < keyset.tgsw_key->key->N; ++i) {
    //         ofs << keyset.tgsw_key->key->coefs[i];
    //     }
    //     ofs << "\n";
    //     ofs << " - TLweKey: " << &keyset.tgsw_key->tlwe_key << "\n";
    //     ofs << "     -params: " << keyset.tgsw_key->tlwe_key.params << "\n";
    //     ofs << "               N: " << keyset.tgsw_key->tlwe_key.params->N << "\n";
    //     ofs << "               k: " << keyset.tgsw_key->tlwe_key.params->k << "\n";
    //     ofs << "         alpha_min: " << keyset.tgsw_key->tlwe_key.params->alpha_min << "\n";
    //     ofs << "         alpha_max: " << keyset.tgsw_key->tlwe_key.params->alpha_max << "\n";
    //     ofs << "extracted_lweparams \n";
    //     ofs << "                   n: " << keyset.tgsw_key->tlwe_key.params->extracted_lweparams.n << "\n";
    //     ofs << "           alpha_min: " << keyset.tgsw_key->tlwe_key.params->extracted_lweparams.alpha_min << "\n";
    //     ofs << "           alpha_max: " << keyset.tgsw_key->tlwe_key.params->extracted_lweparams.alpha_max << "\n";
    //     ofs << "        -key: " << keyset.tgsw_key->tlwe_key.key << "\n";
    //     ofs << "             N: " << keyset.tgsw_key->tlwe_key.key->N << "\n";
    //     ofs << "         coefs: " << keyset.tgsw_key->tlwe_key.key->coefs << " : ";
    //     for (int i = 0; i < keyset.tgsw_key->key->N; ++i) {
    //         ofs << keyset.tgsw_key->tlwe_key.key->coefs[i];
    //     }
    //     ofs << "\n";
    //     ofs << "\n";
    //     // Serializarea cloud
    //     ofs << " - CloudKeySet: " << &keyset.cloud << "\n";
    //     ofs << "    - params: " << keyset.cloud.params << "\n";
    //     ofs << "              ks_t: " << keyset.cloud.params->ks_t << "\n";
    //     ofs << "        ks_basebit: " << keyset.cloud.params->ks_basebit << "\n";
    //     ofs << "     -in_out_params: " << keyset.cloud.params->in_out_params << "\n";
    //     ofs << "                   n: " << keyset.cloud.params->in_out_params->n << "\n";
    //     ofs << "           alpha_min: " << keyset.cloud.params->in_out_params->alpha_min << "\n";
    //     ofs << "           alpha_max: " << keyset.cloud.params->in_out_params->alpha_max << "\n";
    //     ofs << "     -tgsw_params: " << keyset.cloud.params->tgsw_params << "\n";
    //     ofs << "                 l: " << keyset.cloud.params->tgsw_params->l << "\n";
    //     ofs << "             Bgbit: " << keyset.cloud.params->tgsw_params->Bgbit << "\n";
    //     ofs << "            halfBg: " << keyset.cloud.params->tgsw_params->halfBg << "\n";
    //     ofs << "           maskMod: " << keyset.cloud.params->tgsw_params->maskMod << "\n";
    //     ofs << "               kpl: " << keyset.cloud.params->tgsw_params->kpl << "\n";
    //     ofs << "          (Torus)h: " << *keyset.cloud.params->tgsw_params->h << "\n";
    //     ofs << "            offset: " << keyset.cloud.params->tgsw_params->offset << "\n";

    //     // Serializarea LweBootstrappingKey
    //     ofs << "    - LweBootstrappingKey: " << keyset.cloud.bk << "\n";
        /*
        ofs << "        - in_out_params: " << keyset.cloud.bk->in_out_params << "\n";
        ofs << "                      n: " << keyset.cloud.bk->in_out_params->n << "\n";
        ofs << "              alpha_min: " << keyset.cloud.bk->in_out_params->alpha_min << "\n";
        ofs << "              alpha_max: " << keyset.cloud.bk->in_out_params->alpha_max << "\n";
        ofs << "        - bk_params: " << keyset.cloud.bk->bk_params << "\n";
        ofs << "                  l: " << keyset.cloud.bk->bk_params->l << "\n";
        ofs << "              Bgbit: " << keyset.cloud.bk->bk_params->Bgbit << "\n";
        ofs << "             halfBg: " << keyset.cloud.bk->bk_params->halfBg << "\n";
        ofs << "            maskMod: " << keyset.cloud.bk->bk_params->maskMod << "\n";
        ofs << "                kpl: " << keyset.cloud.bk->bk_params->kpl << "\n";
        ofs << "           (Torus)h: " << *keyset.cloud.bk->bk_params->h << "\n";
        ofs << "             offset: " << keyset.cloud.bk->bk_params->offset << "\n";
        ofs << "        - accum_params: " << keyset.cloud.bk->accum_params << "\n";
        ofs << "                     N: " << keyset.cloud.bk->accum_params->N << "\n";
        ofs << "                     k: " << keyset.cloud.bk->accum_params->k << "\n";
        ofs << "             alpha_min: " << keyset.cloud.bk->accum_params->alpha_min << "\n";
        ofs << "             alpha_max: " << keyset.cloud.bk->accum_params->alpha_max << "\n";
        ofs << "        - extract_params: " << keyset.cloud.bk->extract_params << "\n";
        ofs << "                      n: " << keyset.cloud.bk->extract_params->n << "\n";
        ofs << "              alpha_min: " << keyset.cloud.bk->extract_params->alpha_min << "\n";
        ofs << "              alpha_max: " << keyset.cloud.bk->extract_params->alpha_max << "\n";
        // Serializarea `ks` și `bk` va necesita iterare prin elementele lor.
        ofs << "        - bk: " << keyset.cloud.bk->bk << "\n";
        // Iterare prin elementele bk și ks nu este detaliată aici pentru simplificare.
        */
        // Serializarea LweBootstrappingKeyFFT
        ofs << "    - LweBootstrappingKeyFFT: " << keyset.cloud.bkFFT << "\n";
        /*
        ofs << "        - in_out_params: " << keyset.cloud.bkFFT->in_out_params << "\n";
        ofs << "                      n: " << keyset.cloud.bkFFT->in_out_params->n << "\n";
        ofs << "              alpha_min: " << keyset.cloud.bkFFT->in_out_params->alpha_min << "\n";
        ofs << "              alpha_max: " << keyset.cloud.bkFFT->in_out_params->alpha_max << "\n";
        ofs << "        - bk_params: " << keyset.cloud.bkFFT->bk_params << "\n";
        ofs << "                  l: " << keyset.cloud.bkFFT->bk_params->l << "\n";
        ofs << "              Bgbit: " << keyset.cloud.bkFFT->bk_params->Bgbit << "\n";
        ofs << "             halfBg: " << keyset.cloud.bkFFT->bk_params->halfBg << "\n";
        ofs << "            maskMod: " << keyset.cloud.bkFFT->bk_params->maskMod << "\n";
        ofs << "                kpl: " << keyset.cloud.bkFFT->bk_params->kpl << "\n";
        ofs << "           (Torus)h: " << *keyset.cloud.bkFFT->bk_params->h << "\n";
        ofs << "             offset: " << keyset.cloud.bkFFT->bk_params->offset << "\n";
        ofs << "        - accum_params: " << keyset.cloud.bkFFT->accum_params << "\n";
        ofs << "                     N: " << keyset.cloud.bkFFT->accum_params->N << "\n";
        ofs << "                     k: " << keyset.cloud.bkFFT->accum_params->k << "\n";
        ofs << "             alpha_min: " << keyset.cloud.bkFFT->accum_params->alpha_min << "\n";
        ofs << "             alpha_max: " << keyset.cloud.bkFFT->accum_params->alpha_max << "\n";
        ofs << "        - extract_params: " << keyset.cloud.bkFFT->extract_params << "\n";
        ofs << "                      n: " << keyset.cloud.bkFFT->extract_params->n << "\n";
        ofs << "              alpha_min: " << keyset.cloud.bkFFT->extract_params->alpha_min << "\n";
        ofs << "              alpha_max: " << keyset.cloud.bkFFT->extract_params->alpha_max << "\n";
        // Serializarea `bkFFT` și `ks` va necesita iterare prin elementele lor.
        ofs << "        - bkFFT: " << keyset.cloud.bkFFT->bkFFT << "\n";
        // Iterare prin elementele bkFFT și ks nu este detaliată aici pentru simplificare.
 */
        ofs << "\n";
    }
    else
    {
        std::cerr << "Failed to open file for writing.\n";
    }
}

int main()
{
    std::cout << "********** EOC TFHE App Started **************" << std::endl;
    clock_t start = clock();
    cout << "Generating keyset..." << endl;

    TFheGateBootstrappingParameterSet *params = new_default_gate_bootstrapping_parameters(minimum_lambda);
    // const LweParams *lweParams = params->in_out_params;
    // generate the secret keyset
    TFheGateBootstrappingSecretKeySet *keyset = new_random_gate_bootstrapping_secret_keyset(params);
    // cout << "Reading secret key from secretkeyset_export.dat";
    // FILE *Fsecret = fopen("secretkeyset_export.dat", "rb");
    // TFheGateBootstrappingSecretKeySet *keyset = new_tfheGateBootstrappingSecretKeySet_fromFile(Fsecret);
    // fclose(Fsecret);
    // serialize("key.txt", *keyset);
    // serialize_to_json("key.json", *keyset);
    // generate the cloud keyset
    // FILE *F = fopen("publickeyset_export.dat", "rb");
    // TFheGateBootstrappingCloudKeySet *cloud_keyset = new_tfheGateBootstrappingCloudKeySet_fromFile(F);
    TFheGateBootstrappingCloudKeySet *cloud_keyset = const_cast<TFheGateBootstrappingCloudKeySet *>(&keyset->cloud);
    // serializeSecretKey(*keyset);
    // serializePublicKey(*cloud_keyset);
    std::ostringstream oss;
    export_tfheGateBootstrappingSecretKeySet_toStream(oss, keyset);
    std::string str = oss.str();
    cout << str << endl;
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
    str1Cipher = encrypt8BitASCIIString(str1, str1.length(), keyset);
    str2Cipher = encrypt8BitASCIIString(str2, str2.length(), keyset);
    ciphertextMsg = encrypt8BitASCIIString(msg, msg.length(), keyset);
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
    // FILE *F = fopen("publickeyset_export.dat", "wb");
    // TFheGateBootstrappingCloudKeySet *new_cloud_keyset = new_tfheGateBootstrappingCloudKeySet_fromFile(F);
    lweAddTo(ciphertextSum, ciphertext2, cloud_keyset->params->in_out_params);
    lweSubTo(ciphertextDiff, ciphertext2, cloud_keyset->params->in_out_params);
    if (compareCiphertexts(str1Cipher, str2Cipher, str1.length(), keyset))
        cout << "Ciphertexts are equal" << endl;
    else
        cout << "Ciphertexts are not equal" << endl;
    end = clock();
    cout << "Computations finished in " << end - start << " microseconds" << endl;
    start = clock();
    cout << "Decrypting results..." << endl;
    // FILE *Fsecret = fopen("secretkeyset_export.dat", "wb");
    // TFheGateBootstrappingSecretKeySet *new_keyset = new_tfheGateBootstrappingSecretKeySet_fromFile(Fsecret);
    Torus32 decrypted1 = lweSymDecrypt(ciphertextSum, keyset->lwe_key, Msize);
    Torus32 decrypted2 = lweSymDecrypt(ciphertextDiff, keyset->lwe_key, Msize);

    int32_t decryptedSecret1 = modSwitchFromTorus32(decrypted1, Msize);
    int32_t decryptedSecret2 = modSwitchFromTorus32(decrypted2, Msize);

    string decryptedMsg = decrypt8BitASCIIString(ciphertextMsg, msg.length(), keyset);

    end = clock();
    cout << "Sum is " << decryptedSecret1 << endl;
    cout << "Diff is " << decryptedSecret2 << endl;
    cout << "Decrypted message is: " << decryptedMsg << endl;
    cout << "Decryption finished in " << end - start << " microseconds" << endl;
    cout << "********** EOC TFHE App Finished **************" << endl;
    return 0;
}