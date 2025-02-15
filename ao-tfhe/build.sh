#!/bin/bash
# Print the content of the /build folder
# echo "Content of the /build folder:"
# ls -R /build
# Verify the presence of the included directories
directories=(
    "/build/tfhe/include"
    "/build/tfhe/libtfhe"
    "/build/jwt-cpp/include"
    "/build/jwt-cpp"
    "/build/openssl/include"
    "/build/openssl"
    "/lua-5.3.4/src"
)

for dir in "${directories[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "Error: Directory $dir does not exist."
        exit 1
    fi
done
# Compile the C++ implementation
em++ -sMEMORY64=1 -msimd128 -O3 -fno-rtti -fno-exceptions -Wno-experimental \
    -c eoc-tfhe-run.cpp -o eoc-tfhe-run.o \
    -I/build/tfhe/include \
    -I/build/tfhe/libtfhe \
    -I/build/jwt-cpp/include \
    -I/build/jwt-cpp \
    -I/build/openssl/include \
    -I/build/openssl \
    -I/lua-5.3.4/src

# Compile the C bindings
emcc -sMEMORY64=1 -msimd128 -O3 -fno-rtti -fno-exceptions -Wno-experimental \
    -c eoc-tfhe-bindings.c -o eoc-tfhe-bindings.o \
    -I/build/tfhe/include \
    -I/build/tfhe/libtfhe \
    -I/build/jwt-cpp/include \
    -I/build/jwt-cpp \
    -I/build/openssl/include \
    -I/build/openssl \
    -I/lua-5.3.4/src

# Create the library
emar rcs libaotfhe.so eoc-tfhe-bindings.o eoc-tfhe-run.o

# Clean up object files
rm eoc-tfhe-bindings.o eoc-tfhe-run.o
