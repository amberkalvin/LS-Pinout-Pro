#!/usr/bin/env bash
set -euo pipefail

# One-command macOS IPA builder for LS Pinout Pro (for AltStore, SideStore, Sideloadly, or Xcode signing)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DERIVED="$SCRIPT_DIR/.derivedData"
IPA_STAGE="$SCRIPT_DIR/.ipa_stage"
OUT_IPA="$ROOT_DIR/LS_Pinout_Pro_iOS_Dark.ipa"

echo "[1/3] Rebuilding embedded offline HTML bundle..."
python3 "$ROOT_DIR/build.py"

echo "[2/3] Compiling Release iOS ARM64 app via xcodebuild..."
rm -rf "$DERIVED" "$IPA_STAGE"
xcodebuild \
  -project "$SCRIPT_DIR/LSPinoutPro.xcodeproj" \
  -scheme "LSPinoutPro" \
  -configuration Release \
  -sdk iphoneos \
  -derivedDataPath "$DERIVED" \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY="" \
  build

APP_PATH="$DERIVED/Build/Products/Release-iphoneos/LSPinoutPro.app"
if [ ! -d "$APP_PATH" ]; then
  echo "ERROR: Expected $APP_PATH not found." >&2
  exit 1
fi

echo "[3/3] Packaging Payload/LSPinoutPro.app into $OUT_IPA..."
mkdir -p "$IPA_STAGE/Payload"
cp -R "$APP_PATH" "$IPA_STAGE/Payload/LSPinoutPro.app"
(
  cd "$IPA_STAGE"
  zip -qry "$OUT_IPA" Payload
)
rm -rf "$IPA_STAGE"

echo "SUCCESS: Built $OUT_IPA ($(wc -c < "$OUT_IPA" | tr -d ' ') bytes)"
