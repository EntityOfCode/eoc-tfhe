#ifndef EOC_TFHE_RUN_H
#define EOC_TFHE_RUN_H
#include "tfhe.h"

#ifdef __cplusplus
extern "C" {
#endif
int luaopen_eoc_tfhe(lua_State *L);
const char* generateSecretKey(const char *jwtToken, const char *jwksBase64);
const char* generatePublicKey();
const char* encryptInteger(int32_t value, const char* base64SecretKey);
const char* encryptInteger_dummy(int32_t value, const char* base64SecretKey);
const int decryptInteger(char* base64Ciphertext, const char* base64SecretKey, const char *jwtToken, const char *jwksBase64);
const char* addCiphertexts(const char *base64Ciphertext1, const char *base64Ciphertext2, const char *base64PublicKey);
const char* subtractCiphertexts(const char *base64Ciphertext1, const char *base64Ciphertext2, const char *base64PublicKey);
const char *encrypt8BitASCIIString(const char *base64Ciphertext, const int16_t msgLength, const char *base64Key);
const char *decrypt8BitASCIIString(char *base64Ciphertext, const int16_t msgLength, const char *base64Key, const char *jwtToken, const char *jwksBase64);
void info(void);
void testJWT();

#ifdef __cplusplus
}
#endif

#endif // EOC_TFHE_RUN_H
