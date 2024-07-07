#ifndef TFHE_GATE_BOOTSTRAPPING_STRUCTURES_H
#define TFHE_GATE_BOOTSTRAPPING_STRUCTURES_H

///@file
///@brief gate bootstrapping api structures definition

#include "tfhe_core.h"
#include "lweparams.h"
#include "lwekey.h"
#include "tgsw.h"
#include "lwebootstrappingkey.h"
#include <nlohmann/json.hpp>
using json = nlohmann::json;
using Torus32 = int32_t;

struct TFheGateBootstrappingParameterSet {
    const int32_t ks_t;
    const int32_t ks_basebit;
    const LweParams *const in_out_params;
    const TGswParams *const tgsw_params;

        json to_json() const {
        json j;
        j["ks_t"] = ks_t;
        j["ks_basebit"] = ks_basebit;
        j["in_out_params"] = in_out_params->to_json();
        j["tgsw_params"] = tgsw_params->to_json();
        return j;
    }
#ifdef __cplusplus

    TFheGateBootstrappingParameterSet(const int32_t ks_t, const int32_t ks_basebit, const LweParams *const in_out_params,
                                      const TGswParams *const tgsw_params);

    TFheGateBootstrappingParameterSet(const TFheGateBootstrappingParameterSet &) = delete;

    void operator=(const TFheGateBootstrappingParameterSet &)= delete;

#endif
};

struct TFheGateBootstrappingCloudKeySet {
    const TFheGateBootstrappingParameterSet *const params;
    const LweBootstrappingKey *const bk;
    const LweBootstrappingKeyFFT *const bkFFT;

        json to_json() const {
        json j;
        j["params"] = params->to_json();
        j["bk"] = bk->to_json();
        j["bkFFT"] = bkFFT->to_json();
        return j;
    }
#ifdef __cplusplus

    TFheGateBootstrappingCloudKeySet(
            const TFheGateBootstrappingParameterSet *const params,
            const LweBootstrappingKey *const bk,
            const LweBootstrappingKeyFFT *const bkFFT);

    TFheGateBootstrappingCloudKeySet(const TFheGateBootstrappingCloudKeySet &) = delete;

    void operator=(const TFheGateBootstrappingCloudKeySet &)= delete;

#endif
};

struct TFheGateBootstrappingSecretKeySet {
    const TFheGateBootstrappingParameterSet *params;
    const LweKey *lwe_key;
    const TGswKey *tgsw_key;
    const TFheGateBootstrappingCloudKeySet cloud;
#ifdef __cplusplus

    TFheGateBootstrappingSecretKeySet(
            const TFheGateBootstrappingParameterSet *const params,
            const LweBootstrappingKey *const bk,
            const LweBootstrappingKeyFFT *const bkFFT,
            const LweKey *lwe_key,
            const TGswKey *tgsw_key);

    TFheGateBootstrappingSecretKeySet(const TFheGateBootstrappingSecretKeySet &) = delete;

    void operator=(const TFheGateBootstrappingSecretKeySet &)= delete;

    json to_json() const {
        json j;
        j["params"] = params->to_json();
        j["lwe_key"] = lwe_key->to_json();
        j["tgsw_key"] = tgsw_key->to_json();
        // j["cloud_key"] = cloud.to_json();
        return j;
    }

#endif
};

#endif //TFHE_GATE_BOOTSTRAPPING_STRUCTURES_H
