#!/usr/bin/env bash
# 在 GitHub Actions macOS runner 上编译未签名 ipa（自签/侧载用）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
echo "== Xcode 列表"; ls -d /Applications/Xcode*.app || true
XC=$(ls -d /Applications/Xcode_*.app 2>/dev/null | grep -v -i beta | sort -V | tail -1 || true)
if [ -n "${XC}" ]; then sudo xcode-select -s "$XC"; fi
xcodebuild -version
node -v; pod --version || true
export HUSKY=0
corepack disable || true
npx --yes yarn@1.22.22 install --frozen-lockfile --network-timeout 600000
cd ios
pod install --repo-update
if ! xcodebuild -workspace MusicFree.xcworkspace -scheme MusicFree -configuration Release \
  -sdk iphoneos -destination 'generic/platform=iOS' -derivedDataPath build \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY="" \
  DEVELOPMENT_TEAM="" COMPILER_INDEX_STORE_ENABLE=NO build > "$ROOT/xcodebuild.log" 2>&1; then
  echo "== xcodebuild 失败，错误摘要："
  grep -nE "error:|fatal|BUILD FAILED|Command .* failed" "$ROOT/xcodebuild.log" | head -100 || true
  echo "== 日志尾部："; tail -80 "$ROOT/xcodebuild.log"
  exit 1
fi
tail -5 "$ROOT/xcodebuild.log"
APP="build/Build/Products/Release-iphoneos/MusicFree.app"
test -d "$APP"
test -f "$APP/main.jsbundle" || { echo "缺少 main.jsbundle"; ls "$APP"; exit 1; }
rm -rf "$ROOT/out-ipa" && mkdir -p "$ROOT/out-ipa/Payload"
cp -R "$APP" "$ROOT/out-ipa/Payload/"
cd "$ROOT/out-ipa" && zip -qry "MusicFree-ios-unsigned.ipa" Payload && ls -lh
