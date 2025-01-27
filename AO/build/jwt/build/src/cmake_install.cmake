# Install script for directory: /modules/jwt/src

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
    set(CMAKE_INSTALL_CONFIG_NAME "")
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

if("x${CMAKE_INSTALL_COMPONENT}x" STREQUAL "xlibx" OR NOT CMAKE_INSTALL_COMPONENT)
  file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/lib" TYPE STATIC_LIBRARY FILES "/modules/jwt/build/src/libjwt.a")
endif()

if("x${CMAKE_INSTALL_COMPONENT}x" STREQUAL "xlibx" OR NOT CMAKE_INSTALL_COMPONENT)
  file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/include/jwt" TYPE FILE FILES
    "/modules/jwt/src/include/jwt/allocators.h"
    "/modules/jwt/src/include/jwt/claimvalidator.h"
    "/modules/jwt/src/include/jwt/claimvalidatorfactory.h"
    "/modules/jwt/src/include/jwt/hmacvalidator.h"
    "/modules/jwt/src/include/jwt/json.hpp"
    "/modules/jwt/src/include/jwt/jwt.h"
    "/modules/jwt/src/include/jwt/jwt_all.h"
    "/modules/jwt/src/include/jwt/jwt_error.h"
    "/modules/jwt/src/include/jwt/kidvalidator.h"
    "/modules/jwt/src/include/jwt/listclaimvalidator.h"
    "/modules/jwt/src/include/jwt/messagevalidator.h"
    "/modules/jwt/src/include/jwt/messagevalidatorfactory.h"
    "/modules/jwt/src/include/jwt/nonevalidator.h"
    "/modules/jwt/src/include/jwt/rsavalidator.h"
    "/modules/jwt/src/include/jwt/setvalidator.h"
    "/modules/jwt/src/include/jwt/timevalidator.h"
    )
endif()

if("x${CMAKE_INSTALL_COMPONENT}x" STREQUAL "xUnspecifiedx" OR NOT CMAKE_INSTALL_COMPONENT)
  if(EXISTS "$ENV{DESTDIR}${CMAKE_INSTALL_PREFIX}/lib/cmake/Jwt/JwtTargets.cmake")
    file(DIFFERENT EXPORT_FILE_CHANGED FILES
         "$ENV{DESTDIR}${CMAKE_INSTALL_PREFIX}/lib/cmake/Jwt/JwtTargets.cmake"
         "/modules/jwt/build/src/CMakeFiles/Export/lib/cmake/Jwt/JwtTargets.cmake")
    if(EXPORT_FILE_CHANGED)
      file(GLOB OLD_CONFIG_FILES "$ENV{DESTDIR}${CMAKE_INSTALL_PREFIX}/lib/cmake/Jwt/JwtTargets-*.cmake")
      if(OLD_CONFIG_FILES)
        message(STATUS "Old export file \"$ENV{DESTDIR}${CMAKE_INSTALL_PREFIX}/lib/cmake/Jwt/JwtTargets.cmake\" will be replaced.  Removing files [${OLD_CONFIG_FILES}].")
        file(REMOVE ${OLD_CONFIG_FILES})
      endif()
    endif()
  endif()
  file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/lib/cmake/Jwt" TYPE FILE FILES "/modules/jwt/build/src/CMakeFiles/Export/lib/cmake/Jwt/JwtTargets.cmake")
  if("${CMAKE_INSTALL_CONFIG_NAME}" MATCHES "^()$")
    file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/lib/cmake/Jwt" TYPE FILE FILES "/modules/jwt/build/src/CMakeFiles/Export/lib/cmake/Jwt/JwtTargets-noconfig.cmake")
  endif()
endif()

if("x${CMAKE_INSTALL_COMPONENT}x" STREQUAL "xUnspecifiedx" OR NOT CMAKE_INSTALL_COMPONENT)
  file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/lib/cmake/Jwt" TYPE FILE FILES
    "/modules/jwt/build/src/JwtConfigVersion.cmake"
    "/modules/jwt/build/src/JwtConfig.cmake"
    )
endif()

