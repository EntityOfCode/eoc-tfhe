#ifndef LWEKEYSWITCH_H
#define LWEKEYSWITCH_H

///@file
///@brief This file contains the declaration of LWE keyswitch structures

#include "tfhe_core.h"
#include "lweparams.h"
#include "lwesamples.h"

struct LweKeySwitchKey {
    int32_t n; ///< length of the input key: s'
    int32_t t; ///< decomposition length
    int32_t basebit; ///< log_2(base)
    int32_t base; ///< decomposition base: a power of 2 
    const LweParams* out_params; ///< params of the output key s 
    LweSample* ks0_raw; //tableau qui contient tout les Lwe samples de taille nlbase
    LweSample** ks1_raw;// de taille nl  pointe vers un tableau ks0_raw dont les cases sont espaceés de base positions
    LweSample*** ks; ///< the keyswitch elements: a n.l.base matrix
    // de taille n pointe vers ks1 un tableau dont les cases sont espaceés de ell positions

json to_json() const {
        json j;
        j["n"] = n;
        j["t"] = t;
        j["basebit"] = basebit;
        j["base"] = base;
        j["out_params"] = out_params->to_json();

        // Serialize ks0_raw
        json ks0_raw_json;
        for (int i = 0; i < n * t * base; ++i) {
            ks0_raw_json.push_back(ks0_raw[i].to_json(out_params->n));
        }
        j["ks0_raw"] = ks0_raw_json;

        // Serialize ks1_raw
        json ks1_raw_json = json::array();
        for (int32_t i = 0; i < n; ++i) {
            json ks1_inner_json = json::array();
            for (int32_t j = 0; j < t; ++j) {
                ks1_inner_json.push_back(ks1_raw[i][j].to_json(out_params->n));
            }
            ks1_raw_json.push_back(ks1_inner_json);
        }
        j["ks1_raw"] = ks1_raw_json;

        // Serialize ks
        json ks_json = json::array();
        for (int i = 0; i < n; ++i) {
            json inner_json = json::array();
            for (int j = 0; j < t; ++j) {
                json innermost_json = json::array();
                for (int k = 0; k < base; ++k) {
                    innermost_json.push_back(ks[i][j][k].to_json(out_params->n));
                }
                inner_json.push_back(innermost_json);
            }
            ks_json.push_back(inner_json);
        }
        j["ks"] = ks_json;

        return j;
    }

#ifdef __cplusplus
    LweKeySwitchKey(int32_t n, int32_t t, int32_t basebit, const LweParams* out_params, LweSample* ks0_raw);
    ~LweKeySwitchKey();
    LweKeySwitchKey(const LweKeySwitchKey&) = delete;
    void operator=(const LweKeySwitchKey&) = delete;
#endif
};

//allocate memory space for a LweKeySwitchKey
EXPORT LweKeySwitchKey* alloc_LweKeySwitchKey();
EXPORT LweKeySwitchKey* alloc_LweKeySwitchKey_array(int32_t nbelts);

//free memory space for a LweKeySwitchKey
EXPORT void free_LweKeySwitchKey(LweKeySwitchKey* ptr);
EXPORT void free_LweKeySwitchKey_array(int32_t nbelts, LweKeySwitchKey* ptr);

//initialize the LweKeySwitchKey structure
//(equivalent of the C++ constructor)
EXPORT void init_LweKeySwitchKey(LweKeySwitchKey* obj, int32_t n, int32_t t, int32_t basebit, const LweParams* out_params);
EXPORT void init_LweKeySwitchKey_array(int32_t nbelts, LweKeySwitchKey* obj, int32_t n, int32_t t, int32_t basebit, const LweParams* out_params);

//destroys the LweKeySwitchKey structure
//(equivalent of the C++ destructor)
EXPORT void destroy_LweKeySwitchKey(LweKeySwitchKey* obj);
EXPORT void destroy_LweKeySwitchKey_array(int32_t nbelts, LweKeySwitchKey* obj);

//allocates and initialize the LweKeySwitchKey structure
//(equivalent of the C++ new)
EXPORT LweKeySwitchKey* new_LweKeySwitchKey(int32_t n, int32_t t, int32_t basebit, const LweParams* out_params);
EXPORT LweKeySwitchKey* new_LweKeySwitchKey_array(int32_t nbelts, int32_t n, int32_t t, int32_t basebit, const LweParams* out_params);

//destroys and frees the LweKeySwitchKey structure
//(equivalent of the C++ delete)
EXPORT void delete_LweKeySwitchKey(LweKeySwitchKey* obj);
EXPORT void delete_LweKeySwitchKey_array(int32_t nbelts, LweKeySwitchKey* obj);

#endif // LWEKEYSWITCH_H
