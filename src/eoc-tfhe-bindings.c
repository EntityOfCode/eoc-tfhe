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
  const char *public_key = luaL_checkstring(L, 3);

  const char *result = addCiphertexts(ciphertext1, ciphertext2, public_key);
  lua_pushstring(L, result);
  free((void *)result);

  return 1; // Number of return values
}

// Add a Lua binding for the subtract function
static int l_subtractCiphertexts(lua_State *L)
{
  const char *ciphertext1 = luaL_checkstring(L, 1);
  const char *ciphertext2 = luaL_checkstring(L, 2);
  const char *public_key = luaL_checkstring(L, 3);

  const char *result = subtractCiphertexts(ciphertext1, ciphertext2, public_key);
  lua_pushstring(L, result);
  free((void *)result);

  return 1; // Number of return values
}

static int l_info(lua_State *L)
{
  eocTfheInfo();
  return 0;
}

int luaopen_eoc_tfhe(lua_State *L)
{
  static const luaL_Reg eoc_tfhe_funcs[] =
  {
    {"addCiphertexts", l_addCiphertexts},
    {"subtractCiphertexts", l_subtractCiphertexts},
    {"eocTfheInfo", l_info},
    {NULL, NULL}
  };

  luaL_newlib(L, eoc_tfhe_funcs); // Create a new table and push the library function
  return 1;
}
