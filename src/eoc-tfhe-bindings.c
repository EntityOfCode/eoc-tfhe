// tfhe lua wrappers

#include <stdlib.h>
#include <lua.h>
#include <lualib.h>
#include <lauxlib.h>
#include "eoc-tfhe-run.h"

extern lua_State *wasm_lua_state;

static int l_tfhe_test(lua_State *L){
    int result = tfhe_test();
    lua_pushinteger(L, result);
    return 1;
}

int luaopen_tfhe(lua_State *L)
{
    static const luaL_Reg tfhe_funcs[] = {
	  {"test", l_tfhe_test},
    //   {"set_prompt", l_llama_set_prompt},
    //   {"add", l_llama_add},
    //   {"run", l_llama_run},
    //   {"next", l_llama_next},
    //   {"stop", l_llama_stop},
      {NULL, NULL}  // Sentinel to indicate end of array
  };

  luaL_newlib(L, tfhe_funcs); // Create a new table and push the library function
  return 1;
}