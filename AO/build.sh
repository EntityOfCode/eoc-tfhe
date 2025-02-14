#!/bin/bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

LLAMA_CPP_DIR="${SCRIPT_DIR}/build/llamacpp"
TFHE_CPP_DIR="${SCRIPT_DIR}/build/tfhe"
OPENSSL_CPP_DIR="${SCRIPT_DIR}/build/openssl"
JWT_CPP_DIR="${SCRIPT_DIR}/build/jwt"
AO_LLAMA_DIR="${SCRIPT_DIR}/build/ao-llama"
AO_TFHE_DIR="${SCRIPT_DIR}/build/ao-tfhe"
PROCESS_DIR="${SCRIPT_DIR}/aos/process"
LIBS_DIR="${PROCESS_DIR}/libs"
CPP_MODULES_DIR="${SCRIPT_DIR}/build"

AO_IMAGE="p3rmaw3b/ao:0.1.2" # Needs new version

EMXX_CFLAGS="-s MEMORY64=1 -Wno-experimental"

# Set OpenSSL paths
OPENSSL_INCLUDE_DIRS="/modules/tfhe/src/include"
OPENSSL_LIBRARY_DIRS="/modules/tfhe/src/include"
OPENSSL_LIBRARIES="/modules/tfhe/src/include/libssl.a;/modules/tfhe/src/include/libcrypto.a"

# remove the build directory of the tfhe library
sudo rm -rf ${TFHE_CPP_DIR}/build
# rm -rf ${LLAMA_CPP_DIR}
rm -rf ${LIBS_DIR}
sudo mkdir -p ${TFHE_CPP_DIR}/build
if [ ! -d "${LLAMA_CPP_DIR}" ]; then \
	git clone https://github.com/ggerganov/llama.cpp.git ${LLAMA_CPP_DIR}; \
	cd ${LLAMA_CPP_DIR}; git checkout tags/b3233 -b b3233; \
fi
cd ..

if [ ! -d "${OPENSSL_CPP_DIR}" ]; then \
	git clone https://github.com/openssl/openssl.git ${OPENSSL_CPP_DIR}; \
	cd ${OPENSSL_CPP_DIR}; \
fi
cd ..

if [ ! -d "${JWT_CPP_DIR}" ]; then \
	git clone https://github.com/pokowaka/jwt-cpp.git ${JWT_CPP_DIR}; \
	cd ${JWT_CPP_DIR}; \
fi
cd ..

sudo rm -rf ${JWT_CPP_DIR}/build
sudo mkdir -p ${JWT_CPP_DIR}/build

# Patch llama.cpp to remove alignment asserts
sed -i.bak 's/#define ggml_assert_aligned.*/#define ggml_assert_aligned\(ptr\)/g' ${LLAMA_CPP_DIR}/ggml.c
sed -i.bak '/.*GGML_ASSERT.*GGML_MEM_ALIGN == 0.*/d' ${LLAMA_CPP_DIR}/ggml.c

# Build llama.cpp into a static library with emscripten
sudo docker run -v ${LLAMA_CPP_DIR}:/llamacpp ${AO_IMAGE} sh -c \
		"cd /llamacpp && emcmake cmake -DCMAKE_CXX_FLAGS='${EMXX_CFLAGS}' -S . -B . -DLLAMA_BUILD_EXAMPLES=OFF"

# echo "Building tfhe cmake..."
sudo docker run -v ${TFHE_CPP_DIR}:/tfhe ${AO_IMAGE} sh -c \
	"cd /tfhe/build && emcmake cmake -DCMAKE_CXX_FLAGS='${EMXX_CFLAGS}' ../src"

# echo "Cleaning openssl make..."
sudo docker run -v ${OPENSSL_CPP_DIR}:/openssl ${AO_IMAGE} sh -c \
	"cd /openssl && emmake make clean libclean distclean"

# echo "Building openssl cmake..."
sudo docker run -v ${OPENSSL_CPP_DIR}:/openssl ${AO_IMAGE} sh -c \
	"cd /openssl && emconfigure ./Configure no-asm no-shared no-async \
	    no-dso no-hw no-engine no-stdio no-tests no-ssl no-comp no-err \
		no-ocsp no-psk no-srp no-ts no-rfc3779 no-srtp no-weak-ssl-ciphers no-ssl-trace no-ct linux-aarch64"


# echo "Building jwt cmake..."
sudo docker run -v ${CPP_MODULES_DIR}:/modules ${AO_IMAGE} sh -c \
		"cd /modules/jwt/build && emcmake cmake -DCMAKE_CXX_FLAGS='${EMXX_CFLAGS}' \
			-DOPENSSL_INCLUDE_DIRS='${OPENSSL_INCLUDE_DIRS}' -DOPENSSL_LIBRARY_DIRS='${OPENSSL_LIBRARY_DIRS}' -DOPENSSL_LIBRARIES='${OPENSSL_LIBRARIES}' .."

sudo docker run -v ${LLAMA_CPP_DIR}:/llamacpp ${AO_IMAGE} sh -c \
	"cd /llamacpp && emmake make llama common EMCC_CFLAGS='${EMXX_CFLAGS}'" 

# echo "Building tfhe make..."
sudo docker run -v ${TFHE_CPP_DIR}:/tfhe ${AO_IMAGE} sh -c \
		"cd /tfhe/build && emmake make EMCC_CFLAGS='${EMXX_CFLAGS}'"

# echo "Building openssl make..."
sudo docker run -v ${OPENSSL_CPP_DIR}:/openssl ${AO_IMAGE} sh -c \
	"cd /openssl && emmake make EMCC_CFLAGS='-s MEMORY64=1 -Wno-experimental'"
		
cp ${TFHE_CPP_DIR}/build/libtfhe/libtfhe-nayuki-portable.a ${TFHE_CPP_DIR}/src/include/libtfhe.a
cp ${OPENSSL_CPP_DIR}/libcrypto.a ${TFHE_CPP_DIR}/src/include/libcrypto.a		
cp ${OPENSSL_CPP_DIR}/libssl.a ${TFHE_CPP_DIR}/src/include/libssl.a
cp ${OPENSSL_CPP_DIR}/include ${TFHE_CPP_DIR}/src/include/

# echo "Building jwt make..."
sudo docker run -v ${CPP_MODULES_DIR}:/modules ${AO_IMAGE} sh -c \
		"cd /modules/jwt/build && emmake make EMCC_CFLAGS='${EMXX_CFLAGS}'"

cp ${JWT_CPP_DIR}/build/src/libjwt.a ${TFHE_CPP_DIR}/src/include/libjwt.a
cp ${JWT_CPP_DIR}/src/include/jwt ${TFHE_CPP_DIR}/src/include/jwt
cp ${JWT_CPP_DIR}/src/include/private ${TFHE_CPP_DIR}/src/include/private

sudo docker run -v ${LLAMA_CPP_DIR}:/llamacpp  -v ${AO_LLAMA_DIR}:/ao-llama ${AO_IMAGE} sh -c \
		"cd /ao-llama && ./build.sh"

echo "Building ao-tfhe make..."
sudo docker run -v ${TFHE_CPP_DIR}:/tfhe  -v ${AO_TFHE_DIR}:/ao-tfhe ${AO_IMAGE} sh -c \
		"cd /ao-tfhe && ./build.sh"

# Fix permissions
sudo chmod -R 777 ${LLAMA_CPP_DIR}
sudo chmod -R 777 ${AO_LLAMA_DIR}
sudo chmod -R 777 ${TFHE_CPP_DIR}
sudo chmod -R 777 ${AO_TFHE_DIR}

# Copy llama.cpp to the libs directory
mkdir -p $LIBS_DIR/llamacpp/common
cp ${LLAMA_CPP_DIR}/libllama.a $LIBS_DIR/llamacpp/libllama.a
cp ${LLAMA_CPP_DIR}/common/libcommon.a $LIBS_DIR/llamacpp/common/libcommon.a

# Copy ao-llama to the libs directory
mkdir -p $LIBS_DIR/ao-llama
cp ${AO_LLAMA_DIR}/libaollama.so $LIBS_DIR/ao-llama/libaollama.so
cp ${AO_LLAMA_DIR}/libaostream.so $LIBS_DIR/ao-llama/libaostream.so
cp ${AO_LLAMA_DIR}/Llama.lua  ${PROCESS_DIR}/Llama.lua

# Copy openssl to the libs directory
mkdir -p $LIBS_DIR/openssl
cp ${OPENSSL_CPP_DIR}/libcrypto.a $LIBS_DIR/openssl/libcrypto.a
cp ${OPENSSL_CPP_DIR}/libssl.a $LIBS_DIR/openssl/libssl.a

# Copy jwt to the libs directory
mkdir -p $LIBS_DIR/jwt
cp ${JWT_CPP_DIR}/build/src/libjwt.a $LIBS_DIR/jwt/libjwt.a

# Copy tfhe to the libs directory
mkdir -p $LIBS_DIR/tfhe
cp ${TFHE_CPP_DIR}/src/include/libtfhe.a $LIBS_DIR/tfhe/libtfhe.a

# Copy ao-fhe to the libs directory
mkdir -p $LIBS_DIR/ao-fhe
cp ${AO_TFHE_DIR}/libaotfhe.so $LIBS_DIR/ao-fhe/libaotfhe.so
cp ${AO_TFHE_DIR}/tfhe.lua  ${PROCESS_DIR}/tfhe.lua

# Remove .so files
# rm -rf ${AO_LLAMA_DIR}/*.so

# Copy config.yml to the process directory
cp ${SCRIPT_DIR}/config.yml ${PROCESS_DIR}/config.yml

# Build the process module
cd ${PROCESS_DIR} 
docker run -e DEBUG=1 --platform linux/amd64 -v ./:/src ${AO_IMAGE} ao-build-module

# Copy the process module to the test-llm directory
echo "Copying process module to test-llm directory..."
cp ${PROCESS_DIR}/process.wasm ${SCRIPT_DIR}/tests/process.wasm
cp ${PROCESS_DIR}/process.js ${SCRIPT_DIR}/tests/process.js
cp ${PROCESS_DIR}/process.wasm ${SCRIPT_DIR}/test-llm/process.wasm
cp ${PROCESS_DIR}/process.js ${SCRIPT_DIR}/test-llm/process.js

# TODO: Go over these flags 
# "-s MEMORY64=1 -O3 -msimd128 -fno-rtti -DNDEBUG \
# 	-flto=full -s BUILD_AS_WORKER=1 -s EXPORT_ALL=1 \
# 	-s EXPORT_ES6=1 -s MODULARIZE=1 -s INITIAL_MEMORY=800MB \
# 	-s MAXIMUM_MEMORY=4GB -s ALLOW_MEMORY_GROWTH -s FORCE_FILESYSTEM=1 \
# 	-s EXPORTED_FUNCTIONS=_main -s EXPORTED_RUNTIME_METHODS=callMain -s \
# 	NO_EXIT_RUNTIME=1 -Wno-unused-command-line-argument -Wno-experimental"