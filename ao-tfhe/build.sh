
# Compile with TFHE library
emcc eoc-tfhe-bindings.c -c -sMEMORY64=1 -Wno-experimental -o eoc-tfhe-bindings.o /lua-5.3.4/src/liblua.a -I/lua-5.3.4/src -I/src/libs/tfhe/include
emcc eoc-tfhe-run.cpp -c -sMEMORY64=1 -Wno-experimental -o eoc-tfhe-run.o -I/src/libs/tfhe/include

echo "Linking... eoc-tfhe-bindings.o eoc-tfhe-run.o"
emcc eoc-tfhe-bindings.o eoc-tfhe-run.o -o libaotfhe.so /src/libs/tfhe/libtfhe.a

rm eoc-tfhe-bindings.o eoc-tfhe-run.o
