#!/bin/bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# Directory structure
TFHE_BUILD_DIR="${SCRIPT_DIR}/build/tfhe"
TFHE_LIB_DIR="${SCRIPT_DIR}/libs/tfhe"
LLAMA_CPP_DIR="${SCRIPT_DIR}/build/llamacpp"
AO_LLAMA_DIR="${SCRIPT_DIR}/build/ao-llama"
PROCESS_DIR="${SCRIPT_DIR}/aos/process"
LIBS_DIR="${PROCESS_DIR}/libs"

# Docker image from config.yml
AO_IMAGE="p3rmaw3b/ao:0.1.4"

# Emscripten flags from config.yml
EMXX_CFLAGS="-sMEMORY64=1 -O3 -msimd128 -fno-rtti -Wno-experimental"

# Initialize and update submodules
git submodule update --init --recursive

# Clone llama.cpp if it doesn't exist
if [ ! -d "${LLAMA_CPP_DIR}" ]; then
    git clone https://github.com/ggerganov/llama.cpp.git ${LLAMA_CPP_DIR}
    cd ${LLAMA_CPP_DIR}
    git checkout tags/b3233 -b b3233
    cd ${SCRIPT_DIR}
fi

# Patch llama.cpp to remove alignment asserts
sed -i.bak 's/#define ggml_assert_aligned.*/#define ggml_assert_aligned\(ptr\)/g' ${LLAMA_CPP_DIR}/ggml.c
sed -i.bak '/.*GGML_ASSERT.*GGML_MEM_ALIGN == 0.*/d' ${LLAMA_CPP_DIR}/ggml.c

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

# Copy TFHE library to process/libs
mkdir -p ${PROCESS_DIR}/libs/tfhe
cp ${TFHE_BUILD_DIR}/libtfhe/libtfhe-nayuki-portable.a ${PROCESS_DIR}/libs/tfhe/libtfhe.a

# Copy TFHE headers to build directory for compilation
mkdir -p ${TFHE_BUILD_DIR}/include
cp -r ${SCRIPT_DIR}/libs/tfhe/src/include/* ${TFHE_BUILD_DIR}/include/

# Build llama.cpp
sudo docker run -v ${LLAMA_CPP_DIR}:/llamacpp ${AO_IMAGE} sh -c \
    "cd /llamacpp && emcmake cmake -DCMAKE_CXX_FLAGS='${EMXX_CFLAGS}' -S . -B . -DLLAMA_BUILD_EXAMPLES=OFF"

sudo docker run -v ${LLAMA_CPP_DIR}:/llamacpp ${AO_IMAGE} sh -c \
    "cd /llamacpp && emmake make llama common EMCC_CFLAGS='${EMXX_CFLAGS}' -j 8"

# Copy build scripts to build directories
mkdir -p ${AO_LLAMA_DIR}
cp ${SCRIPT_DIR}/AO-Llama/build/ao-llama/build.sh ${AO_LLAMA_DIR}/
chmod +x ${AO_LLAMA_DIR}/build.sh

# Build ao-llama bindings
sudo docker run -v ${LLAMA_CPP_DIR}:/llamacpp -v ${AO_LLAMA_DIR}:/ao-llama -v ${SCRIPT_DIR}/AO-Llama/build/ao-llama:/ao-llama-src ${AO_IMAGE} sh -c \
    "cp -r /ao-llama-src/* /ao-llama/ && cd /ao-llama && ./build.sh"

# Build ao-tfhe bindings
AO_TFHE_DIR="${SCRIPT_DIR}/build/ao-tfhe"
mkdir -p ${AO_TFHE_DIR}

sudo docker run \
    -v ${TFHE_BUILD_DIR}:/tfhe-build \
    -v ${AO_TFHE_DIR}:/ao-tfhe \
    -v ${SCRIPT_DIR}/ao-tfhe:/ao-tfhe-src \
    ${AO_IMAGE} sh -c \
    "cp -r /ao-tfhe-src/* /ao-tfhe/ && cd /ao-tfhe && ./build.sh"

# Fix permissions
sudo chmod -R 777 ${AO_TFHE_DIR}

# Fix permissions for all build directories
sudo chmod -R 777 ${TFHE_BUILD_DIR}
sudo chmod -R 777 ${LLAMA_CPP_DIR}
sudo chmod -R 777 ${AO_LLAMA_DIR}
sudo chmod -R 777 ${AO_TFHE_DIR}

# Copy llama.cpp libraries
mkdir -p $LIBS_DIR/llamacpp/common
cp ${LLAMA_CPP_DIR}/libllama.a $LIBS_DIR/llamacpp/libllama.a
cp ${LLAMA_CPP_DIR}/common/libcommon.a $LIBS_DIR/llamacpp/common/libcommon.a

# Copy ao-llama libraries and Lua interface to process
mkdir -p ${PROCESS_DIR}/libs/ao-llama
cp ${AO_LLAMA_DIR}/libaollama.so ${PROCESS_DIR}/libs/ao-llama/libaollama.so
cp ${AO_LLAMA_DIR}/libaostream.so ${PROCESS_DIR}/libs/ao-llama/libaostream.so
cp ${SCRIPT_DIR}/AO-Llama/build/ao-llama/Llama.lua ${PROCESS_DIR}/Llama.lua

# Copy ao-tfhe libraries and Lua interface to process
mkdir -p ${PROCESS_DIR}/libs/ao-tfhe
cp ${AO_TFHE_DIR}/libaotfhe.so ${PROCESS_DIR}/libs/ao-tfhe/libaotfhe.so
cp ${SCRIPT_DIR}/ao-tfhe/tfhe.lua ${PROCESS_DIR}/tfhe.lua

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
