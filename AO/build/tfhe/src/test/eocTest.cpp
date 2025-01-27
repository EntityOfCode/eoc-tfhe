#include <stdio.h>
#include <iostream>
#include <iomanip>
#include <cstdlib>
#include <cmath>
#include <sys/time.h>
#include "tfhe.h"
#include "polynomials.h"
#include "lwesamples.h"
#include "lwekey.h"
#include "lweparams.h"
#include "tlwe.h"
#include "tgsw.h"

// **********************************************************************************
//            This is just an example file to verify that the library is 
//            usable from a C code
// **********************************************************************************


void dieDramatically(const char *message) {
    fputs(message, stderr);
    abort();
}

//this function creates a new lwekey and initializes it with random
//values. We do not use the c++11 random generator, since it gets in
//a deadlock mode on static const initializers
const LweKey *new_random_LweKey(const LweParams *params) {
    LweKey *key = new_LweKey(params);
    const int32_t n = params->n;
    for (int32_t i = 0; i < n; i++)
        key->key[i] = rand() % 2;
    return key;
}

void adder(LweSample *sum, const LweSample *x, const LweSample *y, const TFheGateBootstrappingSecretKeySet *keyset) {
    const LweParams *in_out_params = keyset->params->in_out_params;
    // carries
    LweSample *carry = new_LweSample(in_out_params);
    bootsSymEncrypt(carry, 0, keyset); // first carry initialized to 0
    // temps
    LweSample *temp = new_LweSample(in_out_params);

    // for (int32_t i = 0; i < nb_bits; ++i) {
        //sumi = xi XOR yi XOR carry(i-1) 
        // bootsXOR(temp, x + i, y + i, &keyset->cloud); // temp = xi XOR yi
        bootsXOR(temp, x, y, &keyset->cloud); // temp = xi XOR yi
        bootsXOR(sum, temp, carry, &keyset->cloud);

        // carry = (xi AND yi) XOR (carry(i-1) AND (xi XOR yi))
        bootsAND(temp + 1, x , y, &keyset->cloud); // temp1 = xi AND yi
        bootsAND(temp + 2, carry, temp, &keyset->cloud); // temp2 = carry AND temp
        bootsXOR(carry + 1, temp + 1, temp + 2, &keyset->cloud);
        bootsCOPY(carry, carry + 1, &keyset->cloud);
    // }
    bootsCOPY(sum, carry, &keyset->cloud);

    delete_LweSample(temp);
    delete_LweSample(carry);
}

        



int32_t main(int32_t argc, char **argv) {

    printf("Start Testing!\n");

    // static const LweParams *params500 = new_LweParams(500, 0., 1.);
    // static const LweParams *params750 = new_LweParams(750, 0., 1.);
    // static const LweParams *params1024 = new_LweParams(1024, 0., 1.);
    // static const LweKey *key500 = new_random_LweKey(params500);
    // static const LweKey *key750 = new_random_LweKey(params750);
    // static const LweKey *key1024 = new_random_LweKey(params1024);
    // static const std::vector<const LweParams *> all_params = {params500, params750, params1024};
    // static const std::vector<const LweKey *> all_keys = {key500, key750, key1024};
    const int32_t nb_bits = 1;
     // generate params 
    int32_t minimum_lambda = 100;
    TFheGateBootstrappingParameterSet *params = new_default_gate_bootstrapping_parameters(minimum_lambda);
    const LweParams *in_out_params = params->in_out_params;
    // generate the secret keyset
    TFheGateBootstrappingSecretKeySet *keyset = new_random_gate_bootstrapping_secret_keyset(params);

    static const int32_t M = (1LL << 31) -1;
    static const double alpha = 1. / (10. * M);
    // for (const LweKey *key: all_keys) {
        const LweParams *paramsLwe = keyset->lwe_key->params;
        LweSample *samples1 = new_LweSample(paramsLwe);
        LweSample *samples2 = new_LweSample(paramsLwe);
        
        //verify correctness of the decryption
        // for (int32_t trial = 0; trial < NB_SAMPLES; trial++) {
        int32_t secret1 = 3;
        int32_t secret2 = 5;


        Torus32 message1 = modSwitchToTorus32(secret1, M);
        Torus32 message2 = modSwitchToTorus32(secret2, M);
        lweSymEncrypt(samples1, message1, alpha, keyset->lwe_key);
        lweSymEncrypt(samples2, message2, alpha, keyset->lwe_key);


        for (int32_t i = 0; i < nb_bits; ++i) {
            bootsSymEncrypt(samples1 + i, rand() % 2, keyset);
            bootsSymEncrypt(samples2 + i, rand() % 2, keyset);
        }


        // output sum
        LweSample *sum = new_LweSample(in_out_params);

        adder(sum, samples1, samples2, keyset);

        Torus32 sumTor = lweSymDecrypt(sum, keyset->lwe_key, M);
        int32_t sumInt = modSwitchFromTorus32(sumTor, M);


        Torus32 phase1 = lwePhase(samples1, keyset->lwe_key);
        Torus32 phase2 = lwePhase(samples2, keyset->lwe_key);
        Torus32 decrypt1 = lweSymDecrypt(samples1, keyset->lwe_key, M);
        Torus32 decrypt2 = lweSymDecrypt(samples2, keyset->lwe_key, M);
        // double dmessage = t32tod(message);
        // double dphase = t32tod(phase);
        printf("Message1: %d\n", message1);
        printf("Message2: %d\n", message2);
        printf("Decrypted1: %d\n", decrypt1);
        printf("Decrypted2: %d\n", decrypt2);
        printf("Secret1: %d\n", secret1);
        printf("Secret2: %d\n", secret2);
        printf("Phase1: %d\n", phase1);
        printf("Phase2: %d\n", phase2);
        printf("Original message1: %d\n", modSwitchFromTorus32(phase1, M));
        printf("Original message2: %d\n", modSwitchFromTorus32(phase2, M));
        printf("Sample1.b: %d and a: %d\n", samples1->b, *samples1->a);
        printf("Sample2.b: %d and a: %d\n", samples2->b, *samples2->a);
        printf("Key Params: %d\n", keyset->lwe_key->params->n);
        printf("Sum: %d\n", sumInt);
        // }
    // }    
    return 0;
}
