#!/bin/sh
mkdir -p build
zip -r build/MeSoHordieBiS_v`grep -E '## Version: (\d+\.\d+.\d+)' MeSoHordieBiS/MeSoHordieBiS.toc | cut -c 13-`.zip MeSoHordieBiS
