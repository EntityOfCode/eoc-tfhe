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
cp ${TFHE_BUILD_DIR}/libtfhe.a $LIBS_DIR/tfhe/libtfhe.a

# Copy TFHE headers
mkdir -p $LIBS_DIR/tfhe/include
cp -r ${SCRIPT_DIR}/libs/tfhe/src/libtfhe/include/* $LIBS_DIR/tfhe/include/
cp -r ${TFHE_BUILD_DIR}/include/* $LIBS_DIR/tfhe/include/

# Copy $LIBS_DIR to ${SCRIPT_DIR}/libs
cp -r $LIBS_DIR ${SCRIPT_DIR}/libs

# Copy config.yml to the process directory if needed
if [ -d "${PROCESS_DIR}" ]; then
    cp ${SCRIPT_DIR}/config.yml ${PROCESS_DIR}/config.yml
fi

echo "TFHE build completed. Library and headers copied to libs/tfhe/"
