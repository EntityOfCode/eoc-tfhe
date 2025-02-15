
em++ -sMEMORY64=1 -msimd128 -O3 -fno-rtti -fno-exceptions -Wno-experimental -c eoc-tfhe-run.cpp -o eoc-tfhe-run.o -I/tfhe-build/include -I/lua-5.3.4/src
emcc -sMEMORY64=1 -msimd128 -O3 -fno-rtti -fno-exceptions -Wno-experimental -c eoc-tfhe-bindings.c -o eoc-tfhe-bindings.o -I/tfhe-build/include -I/lua-5.3.4/src

emar rcs libaotfhe.so eoc-tfhe-bindings.o eoc-tfhe-run.o

rm eoc-tfhe-bindings.o eoc-tfhe-run.o
