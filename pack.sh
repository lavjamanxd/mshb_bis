#!/bin/sh
mkdir -p build
zip -r build/SimpleBiSL_v`grep -P '## Version: (\d+\.\d+.\d+)' SimpleBiS/SimpleBiS.toc | cut -c 13- | rev | cut -c 2- | rev`.zip SimpleBiS -x "*.DS_Store" -x "__MACOSX"
