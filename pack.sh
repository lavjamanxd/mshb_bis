#!/bin/sh
mkdir -p build
zip -r build/MeSoHordieBiS_v`grep -P '## Version: (\d+\.\d+.\d+)' MeSoHordieBiS/MeSoHordieBiS.toc | cut -c 13- | rev | cut -c 2- | rev`.zip MeSoHordieBiS -x "*.DS_Store" -x "__MACOSX"