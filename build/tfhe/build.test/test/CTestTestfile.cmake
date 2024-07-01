# CMake generated Testfile for 
# Source directory: /tfhe/src/test
# Build directory: /tfhe/build.test/test
# 
# This file includes the relevant testing commands required for 
# testing this directory and lists subdirectories to be tested as well.
add_test(unittests-nayuki-portable "unittests-nayuki-portable")
set_tests_properties(unittests-nayuki-portable PROPERTIES  _BACKTRACE_TRIPLES "/tfhe/src/test/CMakeLists.txt;69;add_test;/tfhe/src/test/CMakeLists.txt;0;")
subdirs("googletest")
