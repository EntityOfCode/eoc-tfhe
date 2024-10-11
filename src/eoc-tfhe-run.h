#ifndef EOC_TFHE_RUN_H
#define EOC_TFHE_RUN_H

#ifdef __cplusplus
extern "C" {
#endif
int luaopen_eoc_tfhe(lua_State *L);
char* generateSecretKey();
char* generatePublicKey();
char* encryptInteger(int32_t value, const char* base64SecretKey);
int32_t decryptInteger(char* base64Ciphertext, const char* base64SecretKey);
const char* addCiphertexts(const char* base64_ciphertext1, const char* base64_ciphertext2, const char* base64_public_key);
const char* subtractCiphertexts(const char* base64_ciphertext1, const char* base64_ciphertext2, const char* base64_public_key);
void info(void);

#ifdef __cplusplus
}
#endif

#endif // EOC_TFHE_RUN_H
