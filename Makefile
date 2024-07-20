# Set the location of your wallet for publication:
WALLET_LOC ?= key.json
# Set to 1 to enable debugging
DEBUG ?=

EMXX_CFLAGS=-s MEMORY64=1 -O3 -g0 -msimd128 -fno-rtti \
	-flto=full -s EXPORT_ALL=1 \
	-s EXPORT_ES6=1 -s MODULARIZE=1 -s INITIAL_MEMORY=800MB \
	-s MAXIMUM_MEMORY=4GB -s ALLOW_MEMORY_GROWTH -s FORCE_FILESYSTEM=1 \
	-s EXPORTED_FUNCTIONS=_main -s EXPORTED_RUNTIME_METHODS=callMain -s \
	NO_EXIT_RUNTIME=1 -Wno-unused-command-line-argument -Wno-experimental

EMXX_EOC_FLAGS= -s MEMORY64=1 -g0\
	-flto=full -s EXPORT_ALL=1 \
	-s FORCE_FILESYSTEM=1 -s INITIAL_MEMORY=800MB\
	-s MAXIMUM_MEMORY=4GB -s ALLOW_MEMORY_GROWTH -s FORCE_FILESYSTEM=1 \
	-s EXPORTED_FUNCTIONS=_main -s EXPORTED_RUNTIME_METHODS=callMain -s \
	NO_EXIT_RUNTIME=1 -Wno-unused-command-line-argument -Wno-experimental



ARCH=$(shell uname -m | sed -e 's/x86_64//' -e 's/aarch64/arm64/')

.PHONY: image
image: node AOS.wasm

.PHONY: build-test
build-test: build test-llm

.PHONY: test-llm
test-llm:
	cp build/aos/process/AOS.wasm test-llm/AOS.wasm
	cp build/aos/process/AOS.js test-llm/AOS.js
	cd test-llm && yarn test

.PHONY: test
test: node
	cp AOS.wasm test/AOS.wasm
ifeq ($(TEST),inference)
	cd test; npm install; npm run test:INFERENCE
else ifeq ($(TEST),load)
	cd test; npm install; npm run test:LOAD
else
	cd test; npm install; cd test && npm test 
endif

AOS.wasm: build/aos/process/AOS.wasm
	cp build/aos/process/AOS.wasm AOS.wasm

.PHONY: node
node:
	npm install

build:
	mkdir -p build

.PHONY: clean
clean:
	# rm -rf build
	rm -f AOS.wasm libllama.a libtfhe++.a libtfhe.a test/AOS.wasm build/aos/process/AOS.wasm
	rm -f package-lock.json build/tfhe/libtfhe.a build/tfhe/tfhe-run.o
	rm -rf node_modules
	rm -rf build/TFHEpp/build.test
	mkdir build/TFHEpp/build.test
	rm -rf build/tfhe/build.test
	mkdir build/tfhe/build.test
	docker rmi -f p3rmaw3b/ao || true

build/aos/package.json: build
	cd build; git submodule init; git submodule update --remote
# libllama.a build/llama.cpp/llama-run.o
build/aos/process/AOS.wasm: libtfhe.a  build/aos/package.json container 
	docker run -v $(PWD)/build/aos/process:/src -v $(PWD)/build/tfhe:/tfhe p3rmaw3b/ao emcc-lua $(if $(DEBUG),-e DEBUG=TRUE)

build/llama.cpp: build
	if [ ! -d "build/llama.cpp" ]; then \
		cd build; git clone https://github.com/ggerganov/llama.cpp.git; \
	fi

libfftw3.a: container
	@echo "Building fftw3..."
	docker run -v $(PWD)/build/fftw3:/fftw3 p3rmaw3b/ao sh -c \
		"cd /fftw3 && emcmake cmake -DCMAKE_CXX_FLAGS='$(EMXX_EOC_FLAGS)' -S . -B ."
	docker run -v $(PWD)/build/fftw3:/fftw3 p3rmaw3b/ao sh -c \
		"cd /fftw3 && emmake make EMCC_CFLAGS='$(EMXX_EOC_FLAGS)' && emmake make install"
	cp build/fftw3/.libs/libfftw3.a libfftw3.a

libtfhe.a: container
	@echo "Building eoc.fhe..."
	docker run -v $(PWD)/build/tfhe:/tfhe p3rmaw3b/ao sh -c \
		"cd /tfhe/build.test && emcmake cmake -DCMAKE_CXX_FLAGS='$(EMXX_EOC_FLAGS)' ../src"
	docker run -v $(PWD)/build/tfhe:/tfhe p3rmaw3b/ao sh -c \
		"cd /tfhe/build.test && emmake make EMCC_CFLAGS='$(EMXX_EOC_FLAGS)'"
	cp build/tfhe/build.test/libtfhe/libtfhe-nayuki-portable.a build/tfhe/libtfhe.a
	cp build/tfhe/build.test/eoc/CMakeFiles/eoc-tfhe-run.dir/eoc-tfhe-run.cpp.o build/tfhe/eoc-tfhe-run.o

eoc-JStfheLib.js:
	@echo "Building eoc-JStfheLib.js..."
	docker run -v $(PWD)/build/tfhe:/tfhe p3rmaw3b/ao sh -c \
	"cd /tfhe/src/eoc &&em++ eoc-tfhelib.cpp -o eoc-tfhelib.js -I ../include ../../libtfhe.a \
    -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' \
    --bind -s MODULARIZE=1 -s EXPORT_ES6=1 -s WASM=1  \
    -s INITIAL_MEMORY=800MB -s MAXIMUM_MEMORY=4GB -s ALLOW_MEMORY_GROWTH -s FORCE_FILESYSTEM=1 \
	-s MEMORY64=1 -Wno-experimental"


tfhe/unittest.js: libtfhe.a container
	@echo "Building eoc.fhe.unittest.js..."
	docker run -v $(PWD)/build/tfhe:/tfhe p3rmaw3b/ao sh -c \
		"cd /tfhe/src/test && emcmake cmake -DCMAKE_CXX_FLAGS='$(EMXX_EOC_FLAGS)' "
	docker run -v $(PWD)/build/tfhe:/tfhe p3rmaw3b/ao sh -c \
		"cd /tfhe/src/test && emmake make EMCC_CFLAGS='$(EMXX_EOC_FLAGS)' "

libtfhe++.a: container
	@echo "Building eoc.fhe..."
	docker run -v $(PWD)/build/TFHEpp:/TFHEpp p3rmaw3b/ao sh -c \
		"cd /TFHEpp/build.test && emcmake cmake -DCMAKE_CXX_FLAGS='$(EMXX_EOC_FLAGS)' .."
	docker run -v $(PWD)/build/TFHEpp:/TFHEpp p3rmaw3b/ao sh -c \
		"cd /TFHEpp/build.test && emmake make EMCC_CFLAGS='$(EMXX_EOC_FLAGS)'"
	cp build/TFHEpp/build.test/src/libtfhe++.a build/TFHEpp/libtfhe++.a

# build/tfhe/src/eoc-tfhe-run.o: libtfhe.a container
# 	@echo "Building build/tfhe/src/eoc-tfhe-run.o..."
# 	@docker run -v $(PWD)/build/tfhe:/tfhe p3rmaw3b/ao \
# 		sh -c "cd /opt && em++ -s MEMORY64=1 -Wno-experimental -c eoc-tfhe-run.cpp -o /tfhe/eoc-tfhe-run.o -I ../tfhe/src/libtfhe/cereal/include/cereal"

tfhe/unittest.js: libtfhe.a container
	@echo "Building eoc.fhe.unittest.js..."
	docker run -v $(PWD)/build/tfhe:/tfhe p3rmaw3b/ao sh -c \
		"cd /tfhe/src/test && emcmake cmake -DCMAKE_CXX_FLAGS='$(EMXX_EOC_FLAGS)' "
	docker run -v $(PWD)/build/tfhe:/tfhe p3rmaw3b/ao sh -c \
		"cd /tfhe/src/test && emmake make EMCC_CFLAGS='$(EMXX_EOC_FLAGS)' "

libllama.a: build/llama.cpp container
	@echo "Patching llama.cpp alignment asserts..."
	sed -i.bak 's/#define ggml_assert_aligned.*/#define ggml_assert_aligned\(ptr\)/g' build/llama.cpp/ggml.c
	sed -i.bak '/.*GGML_ASSERT.*GGML_MEM_ALIGN == 0.*/d' build/llama.cpp/ggml.c
	@echo "Building llama.cpp..."
	@docker run -v $(PWD)/build/llama.cpp:/llama.cpp p3rmaw3b/ao sh -c \
		"cd /llama.cpp && emcmake cmake -DCMAKE_CXX_FLAGS='$(EMXX_CFLAGS)' -S . -B . -DLLAMA_BUILD_EXAMPLES=OFF"
	@docker run -v $(PWD)/build/llama.cpp:/llama.cpp p3rmaw3b/ao \
		sh -c "cd /llama.cpp && emmake make llama common EMCC_CFLAGS='$(EMXX_CFLAGS)'"
	cp build/llama.cpp/libllama.a libllama.a

eoc.fhe.myTest.js: container
	@echo "Building eoc.fhe.meTest.js... "
	docker run -v $(PWD)/build/tfhe:/tfhe p3rmaw3b/ao sh -c \
	    "cd /tfhe/src && emcc myTest.cpp -I ../src/include -o ../em.build/myTest.js "

eoc.fhe.test-c.js: container
	@echo "Building eoc.fhe.meTest.js... "
	docker run -v $(PWD)/build/tfhe:/tfhe p3rmaw3b/ao sh -c \
	    "cd /tfhe/src/test && em++ -s MEMORY64=1 -Wno-experimental -O3 -msimd128 -m32 -flto=full -s EXPORT_ALL=1 \
									-s INITIAL_MEMORY=1GB -s MAXIMUM_MEMORY=4GB -s ALLOW_MEMORY_GROWTH -Wno-unused-command-line-argument test-c-binding.c -I ../../src/include ../../em.build/libtfhe/libtfhe-nayuki-portable.a -o ../../em.build/test-c.cjs "

build/llama.cpp/llama-run.o: libllama.a src/llama-run.cpp container
	@echo "Building llama-run.cpp..."
	@docker run -v $(PWD)/build/llama.cpp:/llama.cpp p3rmaw3b/ao \
		sh -c "cd /src && em++ -s MEMORY64=1 -Wno-experimental -c /opt/llama-run.cpp -o /llama.cpp/llama-run.o -I /llama.cpp -I /llama.cpp/common"

.PHONY: container
container: container/Dockerfile
	docker build . -f container/Dockerfile -t p3rmaw3b/ao --build-arg ARCH=$(ARCH)

publish-module: AOS.wasm
	npm install
	WALLET=$(WALLET_LOC) scripts/publish-module

.PHONY: dockersh
dockersh:
	# docker run -v $(PWD)/build/aos/process:/src -v $(PWD)/build/llama.cpp:/llama.cpp -it p3rmaw3b/ao /bin/bash
	docker run -v .:/src -it p3rmaw3b/ao /bin/bash
