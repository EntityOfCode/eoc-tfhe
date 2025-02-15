#!/bin/bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# AO-Llama directories
LLAMA_CPP_DIR="${SCRIPT_DIR}/AO-Llama/build/llamacpp"
AO_LLAMA_DIR="${SCRIPT_DIR}/AO-Llama/build/ao-llama"
PROCESS_DIR="${SCRIPT_DIR}/AO-Llama/aos/process"
LIBS_DIR="${PROCESS_DIR}/libs"

# Docker image from config.yml
AO_IMAGE="p3rmaw3b/ao:0.1.4"

# Emscripten flags from config.yml
EMXX_CFLAGS="-sMEMORY64=1 -O3 -msimd128 -fno-rtti -Wno-experimental"

# Clean up previous builds
# rm -rf ${LLAMA_CPP_DIR}
rm -rf ${LIBS_DIR}


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

# Step 1: Build llama.cpp with cmake
echo "Step 1a: Building llama.cpp with cmake..."
sudo docker run -v ${LLAMA_CPP_DIR}:/llamacpp ${AO_IMAGE} sh -c \
    "cd /llamacpp && emcmake cmake -DCMAKE_CXX_FLAGS='${EMXX_CFLAGS}' -S . -B . -DLLAMA_BUILD_EXAMPLES=OFF"

# Step 2: Build llama.cpp libraries
echo "Step 1b: Building llama.cpp libraries..."
sudo docker run -v ${LLAMA_CPP_DIR}:/llamacpp ${AO_IMAGE} sh -c \
    "cd /llamacpp && emmake make llama common EMCC_CFLAGS='${EMXX_CFLAGS}'"

# Step 3: Build ao-llama bindings
echo "Step 2: Building ao-llama bindings..."
sudo docker run -v ${LLAMA_CPP_DIR}:/llamacpp -v ${AO_LLAMA_DIR}:/ao-llama ${AO_IMAGE} sh -c \
    "cd /ao-llama && ./build.sh"

# Fix permissions
sudo chmod -R 777 ${LLAMA_CPP_DIR}
sudo chmod -R 777 ${AO_LLAMA_DIR}

# Create libs directory structure
mkdir -p ${LIBS_DIR}/llamacpp/common
mkdir -p ${LIBS_DIR}/ao-llama

# Copy llama.cpp libraries
echo "Step 3: Copying llama libraries..."
cp ${LLAMA_CPP_DIR}/libllama.a ${LIBS_DIR}/llamacpp/libllama.a
cp ${LLAMA_CPP_DIR}/common/libcommon.a ${LIBS_DIR}/llamacpp/common/libcommon.a

# Copy ao-llama libraries and Lua file
cp ${AO_LLAMA_DIR}/libaollama.so ${LIBS_DIR}/ao-llama/libaollama.so
cp ${AO_LLAMA_DIR}/libaostream.so ${LIBS_DIR}/ao-llama/libaostream.so
cp ${AO_LLAMA_DIR}/Llama.lua ${PROCESS_DIR}/Llama.lua

# Copy config.yml to the process directory
cp ${SCRIPT_DIR}/config.yml ${PROCESS_DIR}/config.yml

# Build the process module
cd ${PROCESS_DIR}
docker run -e DEBUG=1 --platform linux/amd64 -v ./:/src ${AO_IMAGE} ao-build-module

# Copy the process module to AO-Llama tests directory
cp ${PROCESS_DIR}/process.wasm ${SCRIPT_DIR}/AO-Llama/tests/process.wasm
if [ -f "${PROCESS_DIR}/process.js" ]; then
    echo "Copy process.js to tests..."
    cp ${PROCESS_DIR}/process.js ${SCRIPT_DIR}/AO-Llama/tests/process.js
fi

echo "Build completed successfully!"
