
emcc eoc-tfhe-bindings.c -c -sMEMORY64=1 -Wno-experimental -o eoc-tfhe-bindings.o /lua-5.3.4/src/liblua.a -I/lua-5.3.4/src -I/tfhe/src/include/
emcc eoc-tfhe-run.cpp -c -sMEMORY64=1 -Wno-experimental -o eoc-tfhe-run.o -I/tfhe/src/include/

echo "Linking... eoc-tfhe-bindings.o eoc-tfhe-run.o"
emar rcs libaotfhe.so eoc-tfhe-bindings.o eoc-tfhe-run.o

rm eoc-tfhe-bindings.o eoc-tfhe-run.o
