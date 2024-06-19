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
include test/CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/depend.make
# Include any dependencies generated by the compiler for this target.
include test/CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/compiler_depend.make

# Include the progress variables for this target.
include test/CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/progress.make

# Include the compile flags for this target's objects.
include test/CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/flags.make

test/CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/test-bootstrapping-fft.cpp.o: test/CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/flags.make
test/CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/test-bootstrapping-fft.cpp.o: test/CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/includes_CXX.rsp
test/CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/test-bootstrapping-fft.cpp.o: /tfhe/src/test/test-bootstrapping-fft.cpp
test/CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/test-bootstrapping-fft.cpp.o: test/CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/compiler_depend.ts
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --progress-dir=/tfhe/build.test/CMakeFiles --progress-num=$(CMAKE_PROGRESS_1) "Building CXX object test/CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/test-bootstrapping-fft.cpp.o"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -MD -MT test/CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/test-bootstrapping-fft.cpp.o -MF CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/test-bootstrapping-fft.cpp.o.d -o CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/test-bootstrapping-fft.cpp.o -c /tfhe/src/test/test-bootstrapping-fft.cpp

test/CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/test-bootstrapping-fft.cpp.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Preprocessing CXX source to CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/test-bootstrapping-fft.cpp.i"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -E /tfhe/src/test/test-bootstrapping-fft.cpp > CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/test-bootstrapping-fft.cpp.i

test/CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/test-bootstrapping-fft.cpp.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Compiling CXX source to assembly CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/test-bootstrapping-fft.cpp.s"
	cd /tfhe/build.test/test && /emsdk/upstream/emscripten/em++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -S /tfhe/src/test/test-bootstrapping-fft.cpp -o CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/test-bootstrapping-fft.cpp.s

# Object files for target test-bootstrapping-fft-nayuki-portable
test__bootstrapping__fft__nayuki__portable_OBJECTS = \
"CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/test-bootstrapping-fft.cpp.o"

# External object files for target test-bootstrapping-fft-nayuki-portable
test__bootstrapping__fft__nayuki__portable_EXTERNAL_OBJECTS =

test/test-bootstrapping-fft-nayuki-portable.js: test/CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/test-bootstrapping-fft.cpp.o
test/test-bootstrapping-fft-nayuki-portable.js: test/CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/build.make
test/test-bootstrapping-fft-nayuki-portable.js: libtfhe/libtfhe-nayuki-portable.a
test/test-bootstrapping-fft-nayuki-portable.js: test/CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/linklibs.rsp
test/test-bootstrapping-fft-nayuki-portable.js: test/CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/objects1.rsp
test/test-bootstrapping-fft-nayuki-portable.js: test/CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/link.txt
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --bold --progress-dir=/tfhe/build.test/CMakeFiles --progress-num=$(CMAKE_PROGRESS_2) "Linking CXX executable test-bootstrapping-fft-nayuki-portable.js"
	cd /tfhe/build.test/test && $(CMAKE_COMMAND) -E cmake_link_script CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/link.txt --verbose=$(VERBOSE)

# Rule to build all files generated by this target.
test/CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/build: test/test-bootstrapping-fft-nayuki-portable.js
.PHONY : test/CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/build

test/CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/clean:
	cd /tfhe/build.test/test && $(CMAKE_COMMAND) -P CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/cmake_clean.cmake
.PHONY : test/CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/clean

test/CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/depend:
	cd /tfhe/build.test && $(CMAKE_COMMAND) -E cmake_depends "Unix Makefiles" /tfhe/src /tfhe/src/test /tfhe/build.test /tfhe/build.test/test /tfhe/build.test/test/CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/DependInfo.cmake --color=$(COLOR)
.PHONY : test/CMakeFiles/test-bootstrapping-fft-nayuki-portable.dir/depend

