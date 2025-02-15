#!/bin/bash

# Compile the C++ implementation
em++ -sMEMORY64=1 -msimd128 -O3 -fno-rtti -fno-exceptions -Wno-experimental \
    -c eoc-tfhe-run.cpp -o eoc-tfhe-run.o \
    -I/tfhe/src/include \
    -I/lua-5.3.4/src

# Compile the C bindings
emcc -sMEMORY64=1 -msimd128 -O3 -fno-rtti -fno-exceptions -Wno-experimental \
    -c eoc-tfhe-bindings.c -o eoc-tfhe-bindings.o \
    -I/tfhe/src/include \
    -I/lua-5.3.4/src

# Create the shared library
emar rcs libaotfhe.so eoc-tfhe-bindings.o eoc-tfhe-run.o

# Clean up object files
rm eoc-tfhe-bindings.o eoc-tfhe-run.o
