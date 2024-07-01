file(REMOVE_RECURSE
  "libtfhe-nayuki-portable.a"
  "libtfhe-nayuki-portable.pdb"
)

# Per-language clean rules from dependency scanning.
foreach(lang C CXX)
  include(CMakeFiles/tfhe-nayuki-portable.dir/cmake_clean_${lang}.cmake OPTIONAL)
endforeach()
