cmake_minimum_required(VERSION 3.0)

set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/../)

include_directories(../libtfhe/cereal/include)

set(SOURCES
        eoc-tfhe-run.cpp
        )

# We build a specific unit and integration test for each fft processor
foreach (FFT_PROCESSOR IN LISTS FFT_PROCESSORS)

    if (FFT_PROCESSOR STREQUAL "fftw")
        set(RUNTIME_LIBS
                tfhe-fftw
                ${FFTW_LIBRARIES}
                )

    else ()
        set(RUNTIME_LIBS
                tfhe-${FFT_PROCESSOR}
                )

    endif (FFT_PROCESSOR STREQUAL "fftw")

    # #then the C tests
    # foreach (C_ITEST ${C_ITESTS})
    #     add_executable(${C_ITEST}-${FFT_PROCESSOR} ${C_ITEST}.c ${TFHE_HEADERS})
    #     target_link_libraries(${C_ITEST}-${FFT_PROCESSOR} ${RUNTIME_LIBS})
    # endforeach (C_ITEST)
    add_library(eoc-tfhe-run OBJECT ${SOURCES})
    target_link_libraries(eoc-tfhe-run  ${RUNTIME_LIBS})

endforeach (FFT_PROCESSOR IN LISTS FFT_PROCESSORS) 

