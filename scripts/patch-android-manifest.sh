#!/usr/bin/env bash
# 在 Tauri 生成的 app AndroidManifest.xml 中声明精确闹钟权限。
# Android 12+ 无此权限时 AlarmManager 无法使用 setExact*，国产系统上定时用药提醒易被推迟或取消。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="${1:-$ROOT/apps/candy/src-tauri/gen/android/app/src/main/AndroidManifest.xml}"
if [[ ! -f "$MANIFEST" ]]; then
  echo "patch-android-manifest: skip (not found): $MANIFEST"
  exit 0
fi
if grep -q 'SCHEDULE_EXACT_ALARM' "$MANIFEST"; then
  echo "patch-android-manifest: already contains SCHEDULE_EXACT_ALARM"
  exit 0
fi
perl -i -0777 -pe 's/(<manifest\b[^>]*>)/$1\n    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" \/>/s' "$MANIFEST"
echo "patch-android-manifest: added SCHEDULE_EXACT_ALARM to $MANIFEST"
