#!/bin/sh
mkdir -p build
zip -r build/SimpleBiSList_v`grep -P '## Version: (\d+\.\d+.\d+)' SimpleBiSList/SimpleBiSList.toc | cut -c 13- | rev | cut -c 2- | rev`.zip SimpleBiSList -x "*.DS_Store" -x "__MACOSX"
