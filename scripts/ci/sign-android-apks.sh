#!/usr/bin/env bash
# Release APK 默认可能未签名，部分机型安装会报「packageInfo is null」。
# 设置 ANDROID_KEYSTORE_* 后，用 zipalign + apksigner 对非 debug 的 APK 签名。
# 参考：https://github.com/tauri-apps/tauri/issues/10663#issuecomment-2295211563
# AAB 需在 Gradle 配置 keystore：https://v2.tauri.app/distribute/sign/android/
set -euo pipefail

BUILD_TOOLS_VER="${BUILD_TOOLS_VER:-${BUILD_TOOLS:-34.0.0}}"
OUT_ROOT="apps/candy/src-tauri/gen/android/app/build/outputs"

if [[ -z "${ANDROID_HOME:-}" ]]; then
  echo "ANDROID_HOME 未设置，跳过 APK 签名"
  exit 0
fi

ZIPALIGN="${ANDROID_HOME}/build-tools/${BUILD_TOOLS_VER}/zipalign"
APKSIGNER="${ANDROID_HOME}/build-tools/${BUILD_TOOLS_VER}/apksigner"

if [[ ! -x "$APKSIGNER" ]]; then
  echo "找不到 apksigner: $APKSIGNER"
  exit 1
fi

if [[ -z "${ANDROID_KEYSTORE_BASE64:-}" ]]; then
  echo "未设置 ANDROID_KEYSTORE_BASE64，跳过签名。"
  echo "若安装 release APK 出现 packageInfo is null：请配置签名密钥，或本地使用 debug 包：pnpm --filter candy exec tauri android build -- --debug"
  exit 0
fi

if [[ -z "${ANDROID_KEYSTORE_PASSWORD:-}" ]]; then
  echo "缺少 ANDROID_KEYSTORE_PASSWORD"
  exit 1
fi

ALIAS="${ANDROID_KEY_ALIAS:-upload}"
KEY_PASS="${ANDROID_KEY_PASSWORD:-$ANDROID_KEYSTORE_PASSWORD}"

KS="${RUNNER_TEMP:-/tmp}/candy-release.jks"
echo "$ANDROID_KEYSTORE_BASE64" | base64 -d > "$KS"
trap 'rm -f "$KS"' EXIT

sign_one() {
  local apk="$1"
  local dir name aligned signed
  dir=$(dirname "$apk")
  name=$(basename "$apk" .apk)
  aligned="${dir}/${name}.aligned.apk"
  signed="${dir}/${name}.signed.apk"

  echo "Signing: $apk"
  "$ZIPALIGN" -p -f -v 4 "$apk" "$aligned"
  "$APKSIGNER" sign \
    --ks "$KS" \
    --ks-pass "pass:${ANDROID_KEYSTORE_PASSWORD}" \
    --key-pass "pass:${KEY_PASS}" \
    --ks-key-alias "$ALIAS" \
    --out "$signed" \
    "$aligned"
  rm -f "$aligned"
  mv "$signed" "$apk"
  "$APKSIGNER" verify "$apk"
  echo "OK: $apk"
}

count=0
while IFS= read -r -d '' apk; do
  sign_one "$apk"
  count=$((count + 1))
done < <(find "$OUT_ROOT" -type f -name '*.apk' ! -path '*/debug/*' -print0 2>/dev/null || true)

if [[ "$count" -eq 0 ]]; then
  echo "未在 $OUT_ROOT 找到非 debug 的 APK，跳过"
  exit 0
fi

echo "APK 签名完成（共 $count 个）。"
