#!/usr/bin/env bash
# 全自动生成 Android upload keystore（无 keytool 交互提问），并输出 GitHub Secret 用的 base64。
# 用法：
#   KEYSTORE_PASSWORD='你的强密码' pnpm android:gen-keystore
# 不设密码则自动生成随机密码并打印在终端（请保存）。
#
# 可选环境变量：KEYSTORE_ALIAS、KEYSTORE_VALIDITY、KEYSTORE_DNAME（整条 DN）
# 切勿将 .jks 或密码提交到 Git。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-${ROOT}/upload-keystore.jks}"
ALIAS="${KEYSTORE_ALIAS:-upload}"
VALIDITY="${KEYSTORE_VALIDITY:-10000}"

# 完整 DN，避免空 L/ST 等导致部分 keytool 仍追问；可用 KEYSTORE_DNAME 覆盖
DNAME="${KEYSTORE_DNAME:-CN=Candy, OU=App, O=Candy, L=Shanghai, ST=Shanghai, C=CN}"

if [[ -z "${KEYSTORE_PASSWORD:-}" ]]; then
  if command -v openssl >/dev/null 2>&1; then
    KEYSTORE_PASSWORD="$(openssl rand -base64 24)"
  else
    KEYSTORE_PASSWORD="$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32)"
  fi
  echo "未设置 KEYSTORE_PASSWORD，已生成随机密码（请务必保存）："
  echo "$KEYSTORE_PASSWORD"
  echo ""
fi

echo "输出文件: $OUT"
echo "别名: $ALIAS  有效期(天): $VALIDITY"
echo "DN: $DNAME"
echo ""

if [[ -f "$OUT" ]]; then
  if [[ "${FORCE_KEYSTORE_OVERWRITE:-}" == "1" ]]; then
    echo "检测到已存在 $OUT，FORCE_KEYSTORE_OVERWRITE=1，将删除后重新生成。"
    rm -f "$OUT"
  else
    echo "错误: $OUT 已存在。"
    echo "再次运行时会用「本次新密码」去打开「旧文件」，keytool 会报: Keystore was tampered with, or password was incorrect"
    echo "若确认要覆盖，请先删除: rm \"$OUT\""
    echo "或一行覆盖: FORCE_KEYSTORE_OVERWRITE=1 pnpm android:gen-keystore"
    exit 1
  fi
fi

# -dname 与密码一次性给齐，避免「Is CN=... correct?」等交互
keytool -genkeypair -v \
  -keystore "$OUT" \
  -storetype JKS \
  -keyalg RSA \
  -keysize 2048 \
  -validity "$VALIDITY" \
  -alias "$ALIAS" \
  -storepass "$KEYSTORE_PASSWORD" \
  -keypass "$KEYSTORE_PASSWORD" \
  -dname "$DNAME"

echo ""
echo "========== 复制下面整段到 GitHub → Settings → Secrets → ANDROID_KEYSTORE_BASE64 =========="
# macOS 的 base64 需 -i 指定文件，不能写成 base64 file；GNU 常用 -w0 不换行。优先 openssl 最省事。
if command -v openssl >/dev/null 2>&1; then
  openssl base64 -A -in "$OUT"
  echo ""
elif base64 -w0 "$OUT" 2>/dev/null; then
  echo ""
elif base64 -i "$OUT" 2>/dev/null | tr -d '\n'; then
  echo ""
else
  echo "请手动: openssl base64 -A -in \"$OUT\"   或   base64 -i \"$OUT\" | tr -d '\\n'"
  exit 1
fi
echo ""
echo "========================================================================================"
echo "请在 Secrets 中设置 ANDROID_KEYSTORE_PASSWORD（若上面为随机密码，用同一串）及可选 ANDROID_KEY_ALIAS=$ALIAS"
echo "密钥文件: $OUT （请备份，勿提交仓库）"
