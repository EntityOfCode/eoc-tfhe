#----------------------------------------------------------------
# Generated CMake target import file.
#----------------------------------------------------------------

# Commands may need to know the format version.
set(CMAKE_IMPORT_FILE_VERSION 1)

# Import target "Jwt::jwt" for configuration ""
set_property(TARGET Jwt::jwt APPEND PROPERTY IMPORTED_CONFIGURATIONS NOCONFIG)
set_target_properties(Jwt::jwt PROPERTIES
  IMPORTED_LINK_INTERFACE_LANGUAGES_NOCONFIG "CXX"
  IMPORTED_LOCATION_NOCONFIG "${_IMPORT_PREFIX}/lib/libjwt.a"
  )

list(APPEND _IMPORT_CHECK_TARGETS Jwt::jwt )
list(APPEND _IMPORT_CHECK_FILES_FOR_Jwt::jwt "${_IMPORT_PREFIX}/lib/libjwt.a" )

# Commands beyond this point should not need to know the version.
set(CMAKE_IMPORT_FILE_VERSION)
