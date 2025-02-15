#!/bin/bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# Directory structure from config.yml
TFHE_BUILD_DIR="${SCRIPT_DIR}/build/tfhe"
TFHE_LIB_DIR="${SCRIPT_DIR}/libs/tfhe"
PROCESS_DIR="${SCRIPT_DIR}/aos/process"
LIBS_DIR="${PROCESS_DIR}/libs"

# Docker image from config.yml
AO_IMAGE="p3rmaw3b/ao:0.1.4"

# Emscripten flags from config.yml
EMXX_CFLAGS="-sMEMORY64=1 -O3 -msimd128 -fno-rtti -Wno-experimental"

# Initialize and update TFHE submodule
git submodule update --init --recursive

# Patch TFHE CMakeLists.txt to remove -march=native
sed -i.bak 's/-march=native//g' ${SCRIPT_DIR}/libs/tfhe/src/CMakeLists.txt

# Clean previous build artifacts, but keep source
rm -rf ${TFHE_BUILD_DIR}
rm -rf ${SCRIPT_DIR}/libs/build

# Create necessary directories
mkdir -p ${TFHE_BUILD_DIR}
mkdir -p ${TFHE_LIB_DIR}
mkdir -p $LIBS_DIR/tfhe

# Build TFHE into a static library with emscripten
sudo docker run -v ${TFHE_BUILD_DIR}:/tfhe-build -v ${SCRIPT_DIR}/libs/tfhe:/tfhe-src ${AO_IMAGE} sh -c \
    "cd /tfhe-build && emcmake cmake /tfhe-src/src \
    -DCMAKE_CXX_FLAGS='${EMXX_CFLAGS}' \
    -DENABLE_TESTS=OFF \
    -DENABLE_EXAMPLES=OFF \
    -DENABLE_NAYUKI_PORTABLE=ON \
    -DENABLE_NAYUKI_AVX=OFF \
    -DENABLE_SPQLIOS_AVX=OFF \
    -DENABLE_SPQLIOS_FMA=OFF \
    -DCMAKE_BUILD_TYPE=Release"

sudo docker run -v ${TFHE_BUILD_DIR}:/tfhe-build -v ${SCRIPT_DIR}/libs/tfhe:/tfhe-src ${AO_IMAGE} sh -c \
    "cd /tfhe-build && emmake make EMCC_CFLAGS='${EMXX_CFLAGS}' -j 8"

# Fix permissions
sudo chmod -R 777 ${TFHE_BUILD_DIR}

# Copy TFHE library to the libs directory
cp ${TFHE_BUILD_DIR}/libtfhe/libtfhe-nayuki-portable.a $LIBS_DIR/tfhe/libtfhe.a

# Copy TFHE headers
mkdir -p $LIBS_DIR/tfhe/include
cp -r ${SCRIPT_DIR}/libs/tfhe/src/include/* $LIBS_DIR/tfhe/include/

# Build ao-tfhe bindings
AO_TFHE_DIR="${SCRIPT_DIR}/build/ao-tfhe"
mkdir -p ${AO_TFHE_DIR}

sudo docker run -v ${AO_TFHE_DIR}:/ao-tfhe -v ${SCRIPT_DIR}/ao-tfhe:/ao-tfhe-src ${AO_IMAGE} sh -c \
    "cd /ao-tfhe && ./build.sh"

# Fix permissions
sudo chmod -R 777 ${AO_TFHE_DIR}

# Copy ao-tfhe to the libs directory
mkdir -p $LIBS_DIR/ao-tfhe
cp ${AO_TFHE_DIR}/libaotfhe.so $LIBS_DIR/ao-tfhe/libaotfhe.so
cp ${SCRIPT_DIR}/ao-tfhe/tfhe.lua ${PROCESS_DIR}/tfhe.lua

# Copy $LIBS_DIR to ${SCRIPT_DIR}/libs
cp -r $LIBS_DIR ${SCRIPT_DIR}/libs

# Copy config.yml to the process directory if needed
if [ -d "${PROCESS_DIR}" ]; then
    cp ${SCRIPT_DIR}/config.yml ${PROCESS_DIR}/config.yml
fi

# Build the process module
cd ${PROCESS_DIR} 
docker run -e DEBUG=1 --platform linux/amd64 -v ./:/src ${AO_IMAGE} ao-build-module

# Copy the process module to the tests directory
cp ${PROCESS_DIR}/process.wasm ${SCRIPT_DIR}/tests/process.wasm
if [ -f "${PROCESS_DIR}/process.js" ]; then
    cp ${PROCESS_DIR}/process.js ${SCRIPT_DIR}/tests/process.js
fi

echo "Build completed. Libraries and modules copied to appropriate locations."
