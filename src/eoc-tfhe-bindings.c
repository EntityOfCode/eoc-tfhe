#include <lua.h>
#include <lauxlib.h>
#include <lualib.h>
#include <emscripten.h>
#include "eoc-tfhe-run.h"


// Add a Lua binding for the add function
static int l_addCiphertexts(lua_State *L)
{
  const char *ciphertext1 = luaL_checkstring(L, 1);
  const char *ciphertext2 = luaL_checkstring(L, 2);
  // const char *public_key = luaL_checkstring(L, 3);

  const char *result = addCiphertexts(ciphertext1, ciphertext2, NULL);
  lua_pushstring(L, result);
  free((void *)result);

  return 1; // Number of return values
}

// Add a Lua binding for the subtract function
static int l_subtractCiphertexts(lua_State *L)
{
  const char *ciphertext1 = luaL_checkstring(L, 1);
  const char *ciphertext2 = luaL_checkstring(L, 2);
  // const char *public_key = luaL_checkstring(L, 3);

  const char *result = subtractCiphertexts(ciphertext1, ciphertext2, NULL);
  lua_pushstring(L, result);
  free((void *)result);

  return 1; // Number of return values
}

static int l_generateSecretKey(lua_State *L)
{
  const char *result = generateSecretKey();
  lua_pushstring(L, result);
  free((void *)result);
  return 1;
}

static int l_generatePublicKey(lua_State *L)
{
  const char *result = generatePublicKey();
  lua_pushstring(L, result);
  free((void *)result);
  return 1;
}

static int l_encryptInteger(lua_State *L)
{
  int value = luaL_checkinteger(L,1);
  // const char *secret_key = luaL_checkstring(L,2);
  const char *encryptedValue = encryptInteger(value, NULL);
  lua_pushstring(L, encryptedValue);
  free((void *)encryptedValue);
  return 1;
}

static int l_decryptInteger(lua_State *L)
{
  const char *ciphertext1 = luaL_checkstring(L, 1);
  // const char *secret_key = luaL_checkstring(L,2);
  int decryptedValue = decryptInteger((char *)ciphertext1, NULL);
  lua_pushinteger(L, decryptedValue);
  return 1;
}

static int l_info(lua_State *L)
{
  info();
  return 0;
}

int luaopen_eoc_tfhe(lua_State *L)
{
  static const luaL_Reg eoc_tfhe_funcs[] =
  {
    {"addCiphertexts", l_addCiphertexts},
    {"subtractCiphertexts", l_subtractCiphertexts},
    {"generateSecretKey", l_generateSecretKey},
    {"generatePublicKey", l_generatePublicKey},
    {"encryptInteger", l_encryptInteger},
    {"decryptInteger", l_decryptInteger},
    {"info", l_info},
    {NULL, NULL}
  };

  luaL_newlib(L, eoc_tfhe_funcs); // Create a new table and push the library function
  return 1;
}

// Handle callbacks in Lua
// void l_tfhe_on_log(enum ggml_log_level level, const char * str, void* userdata) {
//   lua_State *L = wasm_lua_state;

//   lua_getglobal(L, "Tfhe");
//   lua_getfield(L, -1, "onLog");
//   lua_remove(L, -2); // Remove the llama table from the stack

//   lua_pushinteger(L, level);
//   lua_pushstring(L, str);
//   lua_call(L, 2, 0);

//   fflush(stderr);
// }

// bool l_llama_on_progress(float progress, void * user_data) {
//   lua_State *L = wasm_lua_state;

//   lua_getglobal(L, "Tfhe");
//   lua_getfield(L, -1, "onProgress");
//   lua_remove(L, -2); // Remove the llama table from the stack

//   lua_pushnumber(L, progress);
//   lua_call(L, 1, 0);
//   return true;
// }