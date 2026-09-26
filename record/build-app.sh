#!/bin/zsh
# Builds the copy of Meraline the clips are recorded with: a Debug build of a released tag, exported
# from the Meraline repo with git archive, so work in progress there never ends up in the film.
# Usage: record/build-app.sh [tag]   (default v1.4.0)
#
# The export then gets the film's own patches, record/patches/*.patch, and only the export: the Meraline
# repo is never touched. promo-routes.patch adds what the recording needs and a released build lacks:
#   meraline://offer?selection=…&app=…   offers text for the selection button above the input, exactly
#                                        as the shortcut does after reading a selection in that app
#   MERALINE_PROMO_SCREENSHOT=<png>      the screenshot button attaches this picture instead of the
#                                        screen, so it shows the film's desktop and needs no access
set -euo pipefail
here=${0:A:h}
root=${here:h}
repo=${MERALINE_REPO:-$root/../Meraline}
tag=${1:-v1.4.0}
build=$root/.build
rm -rf $build/app-src && mkdir -p $build/app-src
git -C $repo archive $tag | tar -x -C $build/app-src
for p in $here/patches/*.patch(N); do
  patch -p1 --quiet -d $build/app-src < $p || { echo "Patch ${p:t} doesn't apply to $tag" >&2; exit 1; }
done
[[ -d $build/SourcePackages ]] || cp -c -R $repo/build/SourcePackages $build/SourcePackages
cd $build/app-src
xcodegen generate --quiet
xcodebuild -project Meraline.xcodeproj -scheme Meraline -configuration Debug -destination 'platform=macOS' \
  -derivedDataPath $build/DerivedData -clonedSourcePackagesDirPath $build/SourcePackages build > $build/build-app.log 2>&1 \
  || { tail -20 $build/build-app.log; exit 1; }
echo "$tag" > $build/app-tag
echo "Built Meraline $tag at $build/DerivedData/Build/Products/Debug/Meraline.app"
