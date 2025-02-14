# Install script for directory: /tfhe/src

# Set the install prefix
if(NOT DEFINED CMAKE_INSTALL_PREFIX)
  set(CMAKE_INSTALL_PREFIX "/emsdk/upstream/emscripten/cache/sysroot")
endif()
string(REGEX REPLACE "/$" "" CMAKE_INSTALL_PREFIX "${CMAKE_INSTALL_PREFIX}")

# Set the install configuration name.
if(NOT DEFINED CMAKE_INSTALL_CONFIG_NAME)
  if(BUILD_TYPE)
    string(REGEX REPLACE "^[^A-Za-z0-9_]+" ""
           CMAKE_INSTALL_CONFIG_NAME "${BUILD_TYPE}")
  else()
    set(CMAKE_INSTALL_CONFIG_NAME "debug")
  endif()
  message(STATUS "Install configuration: \"${CMAKE_INSTALL_CONFIG_NAME}\"")
endif()

# Set the component getting installed.
if(NOT CMAKE_INSTALL_COMPONENT)
  if(COMPONENT)
    message(STATUS "Install component: \"${COMPONENT}\"")
    set(CMAKE_INSTALL_COMPONENT "${COMPONENT}")
  else()
    set(CMAKE_INSTALL_COMPONENT)
  endif()
endif()

# Is this installation the result of a crosscompile?
if(NOT DEFINED CMAKE_CROSSCOMPILING)
  set(CMAKE_CROSSCOMPILING "TRUE")
endif()

# Set default install directory permissions.
if(NOT DEFINED CMAKE_OBJDUMP)
  set(CMAKE_OBJDUMP "/usr/bin/objdump")
endif()

if("x${CMAKE_INSTALL_COMPONENT}x" STREQUAL "xUnspecifiedx" OR NOT CMAKE_INSTALL_COMPONENT)
  file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/include/tfhe" TYPE FILE PERMISSIONS OWNER_READ OWNER_WRITE GROUP_READ WORLD_READ FILES
    "/tfhe/src/include/lagrangehalfc_arithmetic.h"
    "/tfhe/src/include/lwe-functions.h"
    "/tfhe/src/include/lwebootstrappingkey.h"
    "/tfhe/src/include/lwekey.h"
    "/tfhe/src/include/lwekeyswitch.h"
    "/tfhe/src/include/lweparams.h"
    "/tfhe/src/include/lwesamples.h"
    "/tfhe/src/include/numeric_functions.h"
    "/tfhe/src/include/polynomials.h"
    "/tfhe/src/include/polynomials_arithmetic.h"
    "/tfhe/src/include/tfhe.h"
    "/tfhe/src/include/tfhe_core.h"
    "/tfhe/src/include/tfhe_garbage_collector.h"
    "/tfhe/src/include/tfhe_gate_bootstrapping_functions.h"
    "/tfhe/src/include/tfhe_gate_bootstrapping_structures.h"
    "/tfhe/src/include/tfhe_generic_streams.h"
    "/tfhe/src/include/tfhe_generic_templates.h"
    "/tfhe/src/include/tfhe_io.h"
    "/tfhe/src/include/tgsw.h"
    "/tfhe/src/include/tgsw_functions.h"
    "/tfhe/src/include/tlwe.h"
    "/tfhe/src/include/tlwe_functions.h"
    )
endif()

if(NOT CMAKE_INSTALL_LOCAL_ONLY)
  # Include the install script for each subdirectory.
  include("/tfhe/build/libtfhe/cmake_install.cmake")

endif()

if(CMAKE_INSTALL_COMPONENT)
  set(CMAKE_INSTALL_MANIFEST "install_manifest_${CMAKE_INSTALL_COMPONENT}.txt")
else()
  set(CMAKE_INSTALL_MANIFEST "install_manifest.txt")
endif()

string(REPLACE ";" "\n" CMAKE_INSTALL_MANIFEST_CONTENT
       "${CMAKE_INSTALL_MANIFEST_FILES}")
file(WRITE "/tfhe/build/${CMAKE_INSTALL_MANIFEST}"
     "${CMAKE_INSTALL_MANIFEST_CONTENT}")
