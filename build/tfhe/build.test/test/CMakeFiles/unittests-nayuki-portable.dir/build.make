# CMAKE generated file: DO NOT EDIT!
# Generated by "Unix Makefiles" Generator, CMake Version 3.22

# Delete rule output on recipe failure.
.DELETE_ON_ERROR:

#=============================================================================
# Special targets provided by cmake.

# Disable implicit rules so canonical targets will work.
.SUFFIXES:

# Disable VCS-based implicit rules.
% : %,v

# Disable VCS-based implicit rules.
% : RCS/%

# Disable VCS-based implicit rules.
% : RCS/%,v

# Disable VCS-based implicit rules.
% : SCCS/s.%

# Disable VCS-based implicit rules.
% : s.%

.SUFFIXES: .hpux_make_needs_suffix_list

# Command-line flag to silence nested $(MAKE).
$(VERBOSE)MAKESILENT = -s

#Suppress display of executed commands.
$(VERBOSE).SILENT:

# A target that is always out of date.
cmake_force:
.PHONY : cmake_force

#=============================================================================
# Set environment variables for the build.

# The shell in which to execute make rules.
SHELL = /bin/sh

# The CMake executable.
CMAKE_COMMAND = /usr/bin/cmake

# The command to remove a file.
RM = /usr/bin/cmake -E rm -f

# Escaping for special characters.
EQUALS = =

# The top-level source directory on which CMake was run.
CMAKE_SOURCE_DIR = /tfhe/src

# The top-level build directory on which CMake was run.
CMAKE_BINARY_DIR = /tfhe/build.test

# Include any dependencies generated for this target.
include test/CMakeFiles/unittests-nayuki-portable.dir/depend.make
# Include any dependencies generated by the compiler for this target.
include test/CMakeFiles/unittests-nayuki-portable.dir/compiler_depend.make

# Include the progress variables for this target.
include test/CMakeFiles/unittests-nayuki-portable.dir/progress.make

# Include the compile flags for this target's objects.
include test/CMakeFiles/unittests-nayuki-portable.dir/flags.make

test/CMakeFiles/unittests-nayuki-portable.dir/arithmetic_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/flags.make
test/CMakeFiles/unittests-nayuki-portable.dir/arithmetic_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/includes_CXX.rsp
test/CMakeFiles/unittests-nayuki-portable.dir/arithmetic_test.cpp.o: /tfhe/src/test/arithmetic_test.cpp
test/CMakeFiles/unittests-nayuki-portable.dir/arithmetic_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/compiler_depend.ts
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --progress-dir=/tfhe/build.test/CMakeFiles --progress-num=$(CMAKE_PROGRESS_1) "Building CXX object test/CMakeFiles/unittests-nayuki-portable.dir/arithmetic_test.cpp.o"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -MD -MT test/CMakeFiles/unittests-nayuki-portable.dir/arithmetic_test.cpp.o -MF CMakeFiles/unittests-nayuki-portable.dir/arithmetic_test.cpp.o.d -o CMakeFiles/unittests-nayuki-portable.dir/arithmetic_test.cpp.o -c /tfhe/src/test/arithmetic_test.cpp

test/CMakeFiles/unittests-nayuki-portable.dir/arithmetic_test.cpp.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Preprocessing CXX source to CMakeFiles/unittests-nayuki-portable.dir/arithmetic_test.cpp.i"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -E /tfhe/src/test/arithmetic_test.cpp > CMakeFiles/unittests-nayuki-portable.dir/arithmetic_test.cpp.i

test/CMakeFiles/unittests-nayuki-portable.dir/arithmetic_test.cpp.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Compiling CXX source to assembly CMakeFiles/unittests-nayuki-portable.dir/arithmetic_test.cpp.s"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -S /tfhe/src/test/arithmetic_test.cpp -o CMakeFiles/unittests-nayuki-portable.dir/arithmetic_test.cpp.s

test/CMakeFiles/unittests-nayuki-portable.dir/lwe_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/flags.make
test/CMakeFiles/unittests-nayuki-portable.dir/lwe_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/includes_CXX.rsp
test/CMakeFiles/unittests-nayuki-portable.dir/lwe_test.cpp.o: /tfhe/src/test/lwe_test.cpp
test/CMakeFiles/unittests-nayuki-portable.dir/lwe_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/compiler_depend.ts
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --progress-dir=/tfhe/build.test/CMakeFiles --progress-num=$(CMAKE_PROGRESS_2) "Building CXX object test/CMakeFiles/unittests-nayuki-portable.dir/lwe_test.cpp.o"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -MD -MT test/CMakeFiles/unittests-nayuki-portable.dir/lwe_test.cpp.o -MF CMakeFiles/unittests-nayuki-portable.dir/lwe_test.cpp.o.d -o CMakeFiles/unittests-nayuki-portable.dir/lwe_test.cpp.o -c /tfhe/src/test/lwe_test.cpp

test/CMakeFiles/unittests-nayuki-portable.dir/lwe_test.cpp.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Preprocessing CXX source to CMakeFiles/unittests-nayuki-portable.dir/lwe_test.cpp.i"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -E /tfhe/src/test/lwe_test.cpp > CMakeFiles/unittests-nayuki-portable.dir/lwe_test.cpp.i

test/CMakeFiles/unittests-nayuki-portable.dir/lwe_test.cpp.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Compiling CXX source to assembly CMakeFiles/unittests-nayuki-portable.dir/lwe_test.cpp.s"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -S /tfhe/src/test/lwe_test.cpp -o CMakeFiles/unittests-nayuki-portable.dir/lwe_test.cpp.s

test/CMakeFiles/unittests-nayuki-portable.dir/polynomial_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/flags.make
test/CMakeFiles/unittests-nayuki-portable.dir/polynomial_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/includes_CXX.rsp
test/CMakeFiles/unittests-nayuki-portable.dir/polynomial_test.cpp.o: /tfhe/src/test/polynomial_test.cpp
test/CMakeFiles/unittests-nayuki-portable.dir/polynomial_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/compiler_depend.ts
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --progress-dir=/tfhe/build.test/CMakeFiles --progress-num=$(CMAKE_PROGRESS_3) "Building CXX object test/CMakeFiles/unittests-nayuki-portable.dir/polynomial_test.cpp.o"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -MD -MT test/CMakeFiles/unittests-nayuki-portable.dir/polynomial_test.cpp.o -MF CMakeFiles/unittests-nayuki-portable.dir/polynomial_test.cpp.o.d -o CMakeFiles/unittests-nayuki-portable.dir/polynomial_test.cpp.o -c /tfhe/src/test/polynomial_test.cpp

test/CMakeFiles/unittests-nayuki-portable.dir/polynomial_test.cpp.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Preprocessing CXX source to CMakeFiles/unittests-nayuki-portable.dir/polynomial_test.cpp.i"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -E /tfhe/src/test/polynomial_test.cpp > CMakeFiles/unittests-nayuki-portable.dir/polynomial_test.cpp.i

test/CMakeFiles/unittests-nayuki-portable.dir/polynomial_test.cpp.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Compiling CXX source to assembly CMakeFiles/unittests-nayuki-portable.dir/polynomial_test.cpp.s"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -S /tfhe/src/test/polynomial_test.cpp -o CMakeFiles/unittests-nayuki-portable.dir/polynomial_test.cpp.s

test/CMakeFiles/unittests-nayuki-portable.dir/tlwe_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/flags.make
test/CMakeFiles/unittests-nayuki-portable.dir/tlwe_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/includes_CXX.rsp
test/CMakeFiles/unittests-nayuki-portable.dir/tlwe_test.cpp.o: /tfhe/src/test/tlwe_test.cpp
test/CMakeFiles/unittests-nayuki-portable.dir/tlwe_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/compiler_depend.ts
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --progress-dir=/tfhe/build.test/CMakeFiles --progress-num=$(CMAKE_PROGRESS_4) "Building CXX object test/CMakeFiles/unittests-nayuki-portable.dir/tlwe_test.cpp.o"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -MD -MT test/CMakeFiles/unittests-nayuki-portable.dir/tlwe_test.cpp.o -MF CMakeFiles/unittests-nayuki-portable.dir/tlwe_test.cpp.o.d -o CMakeFiles/unittests-nayuki-portable.dir/tlwe_test.cpp.o -c /tfhe/src/test/tlwe_test.cpp

test/CMakeFiles/unittests-nayuki-portable.dir/tlwe_test.cpp.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Preprocessing CXX source to CMakeFiles/unittests-nayuki-portable.dir/tlwe_test.cpp.i"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -E /tfhe/src/test/tlwe_test.cpp > CMakeFiles/unittests-nayuki-portable.dir/tlwe_test.cpp.i

test/CMakeFiles/unittests-nayuki-portable.dir/tlwe_test.cpp.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Compiling CXX source to assembly CMakeFiles/unittests-nayuki-portable.dir/tlwe_test.cpp.s"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -S /tfhe/src/test/tlwe_test.cpp -o CMakeFiles/unittests-nayuki-portable.dir/tlwe_test.cpp.s

test/CMakeFiles/unittests-nayuki-portable.dir/tgsw_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/flags.make
test/CMakeFiles/unittests-nayuki-portable.dir/tgsw_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/includes_CXX.rsp
test/CMakeFiles/unittests-nayuki-portable.dir/tgsw_test.cpp.o: /tfhe/src/test/tgsw_test.cpp
test/CMakeFiles/unittests-nayuki-portable.dir/tgsw_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/compiler_depend.ts
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --progress-dir=/tfhe/build.test/CMakeFiles --progress-num=$(CMAKE_PROGRESS_5) "Building CXX object test/CMakeFiles/unittests-nayuki-portable.dir/tgsw_test.cpp.o"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -MD -MT test/CMakeFiles/unittests-nayuki-portable.dir/tgsw_test.cpp.o -MF CMakeFiles/unittests-nayuki-portable.dir/tgsw_test.cpp.o.d -o CMakeFiles/unittests-nayuki-portable.dir/tgsw_test.cpp.o -c /tfhe/src/test/tgsw_test.cpp

test/CMakeFiles/unittests-nayuki-portable.dir/tgsw_test.cpp.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Preprocessing CXX source to CMakeFiles/unittests-nayuki-portable.dir/tgsw_test.cpp.i"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -E /tfhe/src/test/tgsw_test.cpp > CMakeFiles/unittests-nayuki-portable.dir/tgsw_test.cpp.i

test/CMakeFiles/unittests-nayuki-portable.dir/tgsw_test.cpp.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Compiling CXX source to assembly CMakeFiles/unittests-nayuki-portable.dir/tgsw_test.cpp.s"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -S /tfhe/src/test/tgsw_test.cpp -o CMakeFiles/unittests-nayuki-portable.dir/tgsw_test.cpp.s

test/CMakeFiles/unittests-nayuki-portable.dir/tlwe_fft_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/flags.make
test/CMakeFiles/unittests-nayuki-portable.dir/tlwe_fft_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/includes_CXX.rsp
test/CMakeFiles/unittests-nayuki-portable.dir/tlwe_fft_test.cpp.o: /tfhe/src/test/tlwe_fft_test.cpp
test/CMakeFiles/unittests-nayuki-portable.dir/tlwe_fft_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/compiler_depend.ts
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --progress-dir=/tfhe/build.test/CMakeFiles --progress-num=$(CMAKE_PROGRESS_6) "Building CXX object test/CMakeFiles/unittests-nayuki-portable.dir/tlwe_fft_test.cpp.o"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -MD -MT test/CMakeFiles/unittests-nayuki-portable.dir/tlwe_fft_test.cpp.o -MF CMakeFiles/unittests-nayuki-portable.dir/tlwe_fft_test.cpp.o.d -o CMakeFiles/unittests-nayuki-portable.dir/tlwe_fft_test.cpp.o -c /tfhe/src/test/tlwe_fft_test.cpp

test/CMakeFiles/unittests-nayuki-portable.dir/tlwe_fft_test.cpp.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Preprocessing CXX source to CMakeFiles/unittests-nayuki-portable.dir/tlwe_fft_test.cpp.i"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -E /tfhe/src/test/tlwe_fft_test.cpp > CMakeFiles/unittests-nayuki-portable.dir/tlwe_fft_test.cpp.i

test/CMakeFiles/unittests-nayuki-portable.dir/tlwe_fft_test.cpp.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Compiling CXX source to assembly CMakeFiles/unittests-nayuki-portable.dir/tlwe_fft_test.cpp.s"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -S /tfhe/src/test/tlwe_fft_test.cpp -o CMakeFiles/unittests-nayuki-portable.dir/tlwe_fft_test.cpp.s

test/CMakeFiles/unittests-nayuki-portable.dir/tgsw_fft_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/flags.make
test/CMakeFiles/unittests-nayuki-portable.dir/tgsw_fft_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/includes_CXX.rsp
test/CMakeFiles/unittests-nayuki-portable.dir/tgsw_fft_test.cpp.o: /tfhe/src/test/tgsw_fft_test.cpp
test/CMakeFiles/unittests-nayuki-portable.dir/tgsw_fft_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/compiler_depend.ts
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --progress-dir=/tfhe/build.test/CMakeFiles --progress-num=$(CMAKE_PROGRESS_7) "Building CXX object test/CMakeFiles/unittests-nayuki-portable.dir/tgsw_fft_test.cpp.o"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -MD -MT test/CMakeFiles/unittests-nayuki-portable.dir/tgsw_fft_test.cpp.o -MF CMakeFiles/unittests-nayuki-portable.dir/tgsw_fft_test.cpp.o.d -o CMakeFiles/unittests-nayuki-portable.dir/tgsw_fft_test.cpp.o -c /tfhe/src/test/tgsw_fft_test.cpp

test/CMakeFiles/unittests-nayuki-portable.dir/tgsw_fft_test.cpp.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Preprocessing CXX source to CMakeFiles/unittests-nayuki-portable.dir/tgsw_fft_test.cpp.i"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -E /tfhe/src/test/tgsw_fft_test.cpp > CMakeFiles/unittests-nayuki-portable.dir/tgsw_fft_test.cpp.i

test/CMakeFiles/unittests-nayuki-portable.dir/tgsw_fft_test.cpp.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Compiling CXX source to assembly CMakeFiles/unittests-nayuki-portable.dir/tgsw_fft_test.cpp.s"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -S /tfhe/src/test/tgsw_fft_test.cpp -o CMakeFiles/unittests-nayuki-portable.dir/tgsw_fft_test.cpp.s

test/CMakeFiles/unittests-nayuki-portable.dir/lwekeyswitch_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/flags.make
test/CMakeFiles/unittests-nayuki-portable.dir/lwekeyswitch_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/includes_CXX.rsp
test/CMakeFiles/unittests-nayuki-portable.dir/lwekeyswitch_test.cpp.o: /tfhe/src/test/lwekeyswitch_test.cpp
test/CMakeFiles/unittests-nayuki-portable.dir/lwekeyswitch_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/compiler_depend.ts
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --progress-dir=/tfhe/build.test/CMakeFiles --progress-num=$(CMAKE_PROGRESS_8) "Building CXX object test/CMakeFiles/unittests-nayuki-portable.dir/lwekeyswitch_test.cpp.o"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -MD -MT test/CMakeFiles/unittests-nayuki-portable.dir/lwekeyswitch_test.cpp.o -MF CMakeFiles/unittests-nayuki-portable.dir/lwekeyswitch_test.cpp.o.d -o CMakeFiles/unittests-nayuki-portable.dir/lwekeyswitch_test.cpp.o -c /tfhe/src/test/lwekeyswitch_test.cpp

test/CMakeFiles/unittests-nayuki-portable.dir/lwekeyswitch_test.cpp.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Preprocessing CXX source to CMakeFiles/unittests-nayuki-portable.dir/lwekeyswitch_test.cpp.i"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -E /tfhe/src/test/lwekeyswitch_test.cpp > CMakeFiles/unittests-nayuki-portable.dir/lwekeyswitch_test.cpp.i

test/CMakeFiles/unittests-nayuki-portable.dir/lwekeyswitch_test.cpp.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Compiling CXX source to assembly CMakeFiles/unittests-nayuki-portable.dir/lwekeyswitch_test.cpp.s"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -S /tfhe/src/test/lwekeyswitch_test.cpp -o CMakeFiles/unittests-nayuki-portable.dir/lwekeyswitch_test.cpp.s

test/CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/flags.make
test/CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/includes_CXX.rsp
test/CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test.cpp.o: /tfhe/src/test/bootstrapping_test.cpp
test/CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/compiler_depend.ts
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --progress-dir=/tfhe/build.test/CMakeFiles --progress-num=$(CMAKE_PROGRESS_9) "Building CXX object test/CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test.cpp.o"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -MD -MT test/CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test.cpp.o -MF CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test.cpp.o.d -o CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test.cpp.o -c /tfhe/src/test/bootstrapping_test.cpp

test/CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test.cpp.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Preprocessing CXX source to CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test.cpp.i"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -E /tfhe/src/test/bootstrapping_test.cpp > CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test.cpp.i

test/CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test.cpp.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Compiling CXX source to assembly CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test.cpp.s"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -S /tfhe/src/test/bootstrapping_test.cpp -o CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test.cpp.s

test/CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test_fft.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/flags.make
test/CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test_fft.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/includes_CXX.rsp
test/CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test_fft.cpp.o: /tfhe/src/test/bootstrapping_test_fft.cpp
test/CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test_fft.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/compiler_depend.ts
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --progress-dir=/tfhe/build.test/CMakeFiles --progress-num=$(CMAKE_PROGRESS_10) "Building CXX object test/CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test_fft.cpp.o"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -MD -MT test/CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test_fft.cpp.o -MF CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test_fft.cpp.o.d -o CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test_fft.cpp.o -c /tfhe/src/test/bootstrapping_test_fft.cpp

test/CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test_fft.cpp.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Preprocessing CXX source to CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test_fft.cpp.i"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -E /tfhe/src/test/bootstrapping_test_fft.cpp > CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test_fft.cpp.i

test/CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test_fft.cpp.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Compiling CXX source to assembly CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test_fft.cpp.s"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -S /tfhe/src/test/bootstrapping_test_fft.cpp -o CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test_fft.cpp.s

test/CMakeFiles/unittests-nayuki-portable.dir/io_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/flags.make
test/CMakeFiles/unittests-nayuki-portable.dir/io_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/includes_CXX.rsp
test/CMakeFiles/unittests-nayuki-portable.dir/io_test.cpp.o: /tfhe/src/test/io_test.cpp
test/CMakeFiles/unittests-nayuki-portable.dir/io_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/compiler_depend.ts
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --progress-dir=/tfhe/build.test/CMakeFiles --progress-num=$(CMAKE_PROGRESS_11) "Building CXX object test/CMakeFiles/unittests-nayuki-portable.dir/io_test.cpp.o"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -MD -MT test/CMakeFiles/unittests-nayuki-portable.dir/io_test.cpp.o -MF CMakeFiles/unittests-nayuki-portable.dir/io_test.cpp.o.d -o CMakeFiles/unittests-nayuki-portable.dir/io_test.cpp.o -c /tfhe/src/test/io_test.cpp

test/CMakeFiles/unittests-nayuki-portable.dir/io_test.cpp.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Preprocessing CXX source to CMakeFiles/unittests-nayuki-portable.dir/io_test.cpp.i"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -E /tfhe/src/test/io_test.cpp > CMakeFiles/unittests-nayuki-portable.dir/io_test.cpp.i

test/CMakeFiles/unittests-nayuki-portable.dir/io_test.cpp.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Compiling CXX source to assembly CMakeFiles/unittests-nayuki-portable.dir/io_test.cpp.s"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -S /tfhe/src/test/io_test.cpp -o CMakeFiles/unittests-nayuki-portable.dir/io_test.cpp.s

test/CMakeFiles/unittests-nayuki-portable.dir/lagrangehalfc_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/flags.make
test/CMakeFiles/unittests-nayuki-portable.dir/lagrangehalfc_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/includes_CXX.rsp
test/CMakeFiles/unittests-nayuki-portable.dir/lagrangehalfc_test.cpp.o: /tfhe/src/test/lagrangehalfc_test.cpp
test/CMakeFiles/unittests-nayuki-portable.dir/lagrangehalfc_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/compiler_depend.ts
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --progress-dir=/tfhe/build.test/CMakeFiles --progress-num=$(CMAKE_PROGRESS_12) "Building CXX object test/CMakeFiles/unittests-nayuki-portable.dir/lagrangehalfc_test.cpp.o"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -MD -MT test/CMakeFiles/unittests-nayuki-portable.dir/lagrangehalfc_test.cpp.o -MF CMakeFiles/unittests-nayuki-portable.dir/lagrangehalfc_test.cpp.o.d -o CMakeFiles/unittests-nayuki-portable.dir/lagrangehalfc_test.cpp.o -c /tfhe/src/test/lagrangehalfc_test.cpp

test/CMakeFiles/unittests-nayuki-portable.dir/lagrangehalfc_test.cpp.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Preprocessing CXX source to CMakeFiles/unittests-nayuki-portable.dir/lagrangehalfc_test.cpp.i"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -E /tfhe/src/test/lagrangehalfc_test.cpp > CMakeFiles/unittests-nayuki-portable.dir/lagrangehalfc_test.cpp.i

test/CMakeFiles/unittests-nayuki-portable.dir/lagrangehalfc_test.cpp.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Compiling CXX source to assembly CMakeFiles/unittests-nayuki-portable.dir/lagrangehalfc_test.cpp.s"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -S /tfhe/src/test/lagrangehalfc_test.cpp -o CMakeFiles/unittests-nayuki-portable.dir/lagrangehalfc_test.cpp.s

test/CMakeFiles/unittests-nayuki-portable.dir/boots_gates_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/flags.make
test/CMakeFiles/unittests-nayuki-portable.dir/boots_gates_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/includes_CXX.rsp
test/CMakeFiles/unittests-nayuki-portable.dir/boots_gates_test.cpp.o: /tfhe/src/test/boots_gates_test.cpp
test/CMakeFiles/unittests-nayuki-portable.dir/boots_gates_test.cpp.o: test/CMakeFiles/unittests-nayuki-portable.dir/compiler_depend.ts
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --progress-dir=/tfhe/build.test/CMakeFiles --progress-num=$(CMAKE_PROGRESS_13) "Building CXX object test/CMakeFiles/unittests-nayuki-portable.dir/boots_gates_test.cpp.o"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -MD -MT test/CMakeFiles/unittests-nayuki-portable.dir/boots_gates_test.cpp.o -MF CMakeFiles/unittests-nayuki-portable.dir/boots_gates_test.cpp.o.d -o CMakeFiles/unittests-nayuki-portable.dir/boots_gates_test.cpp.o -c /tfhe/src/test/boots_gates_test.cpp

test/CMakeFiles/unittests-nayuki-portable.dir/boots_gates_test.cpp.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Preprocessing CXX source to CMakeFiles/unittests-nayuki-portable.dir/boots_gates_test.cpp.i"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -E /tfhe/src/test/boots_gates_test.cpp > CMakeFiles/unittests-nayuki-portable.dir/boots_gates_test.cpp.i

test/CMakeFiles/unittests-nayuki-portable.dir/boots_gates_test.cpp.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Compiling CXX source to assembly CMakeFiles/unittests-nayuki-portable.dir/boots_gates_test.cpp.s"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -S /tfhe/src/test/boots_gates_test.cpp -o CMakeFiles/unittests-nayuki-portable.dir/boots_gates_test.cpp.s

# Object files for target unittests-nayuki-portable
unittests__nayuki__portable_OBJECTS = \
"CMakeFiles/unittests-nayuki-portable.dir/arithmetic_test.cpp.o" \
"CMakeFiles/unittests-nayuki-portable.dir/lwe_test.cpp.o" \
"CMakeFiles/unittests-nayuki-portable.dir/polynomial_test.cpp.o" \
"CMakeFiles/unittests-nayuki-portable.dir/tlwe_test.cpp.o" \
"CMakeFiles/unittests-nayuki-portable.dir/tgsw_test.cpp.o" \
"CMakeFiles/unittests-nayuki-portable.dir/tlwe_fft_test.cpp.o" \
"CMakeFiles/unittests-nayuki-portable.dir/tgsw_fft_test.cpp.o" \
"CMakeFiles/unittests-nayuki-portable.dir/lwekeyswitch_test.cpp.o" \
"CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test.cpp.o" \
"CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test_fft.cpp.o" \
"CMakeFiles/unittests-nayuki-portable.dir/io_test.cpp.o" \
"CMakeFiles/unittests-nayuki-portable.dir/lagrangehalfc_test.cpp.o" \
"CMakeFiles/unittests-nayuki-portable.dir/boots_gates_test.cpp.o"

# External object files for target unittests-nayuki-portable
unittests__nayuki__portable_EXTERNAL_OBJECTS =

test/unittests-nayuki-portable.js: test/CMakeFiles/unittests-nayuki-portable.dir/arithmetic_test.cpp.o
test/unittests-nayuki-portable.js: test/CMakeFiles/unittests-nayuki-portable.dir/lwe_test.cpp.o
test/unittests-nayuki-portable.js: test/CMakeFiles/unittests-nayuki-portable.dir/polynomial_test.cpp.o
test/unittests-nayuki-portable.js: test/CMakeFiles/unittests-nayuki-portable.dir/tlwe_test.cpp.o
test/unittests-nayuki-portable.js: test/CMakeFiles/unittests-nayuki-portable.dir/tgsw_test.cpp.o
test/unittests-nayuki-portable.js: test/CMakeFiles/unittests-nayuki-portable.dir/tlwe_fft_test.cpp.o
test/unittests-nayuki-portable.js: test/CMakeFiles/unittests-nayuki-portable.dir/tgsw_fft_test.cpp.o
test/unittests-nayuki-portable.js: test/CMakeFiles/unittests-nayuki-portable.dir/lwekeyswitch_test.cpp.o
test/unittests-nayuki-portable.js: test/CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test.cpp.o
test/unittests-nayuki-portable.js: test/CMakeFiles/unittests-nayuki-portable.dir/bootstrapping_test_fft.cpp.o
test/unittests-nayuki-portable.js: test/CMakeFiles/unittests-nayuki-portable.dir/io_test.cpp.o
test/unittests-nayuki-portable.js: test/CMakeFiles/unittests-nayuki-portable.dir/lagrangehalfc_test.cpp.o
test/unittests-nayuki-portable.js: test/CMakeFiles/unittests-nayuki-portable.dir/boots_gates_test.cpp.o
test/unittests-nayuki-portable.js: test/CMakeFiles/unittests-nayuki-portable.dir/build.make
test/unittests-nayuki-portable.js: libtfhe/libtfhe-nayuki-portable.a
test/unittests-nayuki-portable.js: test/googletest/googlemock/gtest/libgtest.a
test/unittests-nayuki-portable.js: test/googletest/googlemock/gtest/libgtest_main.a
test/unittests-nayuki-portable.js: test/googletest/googlemock/gtest/libgtest.a
test/unittests-nayuki-portable.js: test/CMakeFiles/unittests-nayuki-portable.dir/linklibs.rsp
test/unittests-nayuki-portable.js: test/CMakeFiles/unittests-nayuki-portable.dir/objects1.rsp
test/unittests-nayuki-portable.js: test/CMakeFiles/unittests-nayuki-portable.dir/link.txt
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --bold --progress-dir=/tfhe/build.test/CMakeFiles --progress-num=$(CMAKE_PROGRESS_14) "Linking CXX executable unittests-nayuki-portable.js"
	cd /tfhe/build.test/test && $(CMAKE_COMMAND) -E cmake_link_script CMakeFiles/unittests-nayuki-portable.dir/link.txt --verbose=$(VERBOSE)

# Rule to build all files generated by this target.
test/CMakeFiles/unittests-nayuki-portable.dir/build: test/unittests-nayuki-portable.js
.PHONY : test/CMakeFiles/unittests-nayuki-portable.dir/build

test/CMakeFiles/unittests-nayuki-portable.dir/clean:
	cd /tfhe/build.test/test && $(CMAKE_COMMAND) -P CMakeFiles/unittests-nayuki-portable.dir/cmake_clean.cmake
.PHONY : test/CMakeFiles/unittests-nayuki-portable.dir/clean

test/CMakeFiles/unittests-nayuki-portable.dir/depend:
	cd /tfhe/build.test && $(CMAKE_COMMAND) -E cmake_depends "Unix Makefiles" /tfhe/src /tfhe/src/test /tfhe/build.test /tfhe/build.test/test /tfhe/build.test/test/CMakeFiles/unittests-nayuki-portable.dir/DependInfo.cmake --color=$(COLOR)
.PHONY : test/CMakeFiles/unittests-nayuki-portable.dir/depend

