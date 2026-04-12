#!/usr/bin/env bash
# 将 tauri icon 生成的 apps/candy/src-tauri/icons/android 同步到 Gradle 工程 res/，
# 否则 gen/android 里可能仍是 android init 时的默认图标。
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC="$REPO_ROOT/apps/candy/src-tauri/icons/android"
DST="$REPO_ROOT/apps/candy/src-tauri/gen/android/app/src/main/res"

if [[ ! -d "$SRC" ]]; then
  echo "sync-android-mipmap: 缺少源目录 $SRC" >&2
  exit 1
fi

if [[ ! -d "$DST" ]]; then
  echo "sync-android-mipmap: 跳过（尚未 tauri android init）：$DST"
  exit 0
fi

for d in mipmap-hdpi mipmap-mdpi mipmap-xhdpi mipmap-xxhdpi mipmap-xxxhdpi mipmap-anydpi-v26; do
  if [[ -d "$SRC/$d" ]]; then
    mkdir -p "$DST/$d"
    cp -f "$SRC/$d"/* "$DST/$d/"
  fi
done
if [[ -d "$SRC/values" ]]; then
  mkdir -p "$DST/values"
  cp -f "$SRC/values"/* "$DST/values/" 2>/dev/null || true
fi

echo "sync-android-mipmap: 已同步 -> $DST"
