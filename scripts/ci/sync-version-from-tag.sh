#!/usr/bin/env bash
# 根据 Git tag（如 v1.2.3）同步 apps/candy 与 src-tauri 的版本号。
set -euo pipefail
TAG="${1:?用法: sync-version-from-tag.sh <tag>}"
VERSION="${TAG#v}"

echo "Syncing version to ${VERSION} (from tag ${TAG})"

export VERSION
node -e "
const fs = require('fs');
const version = process.env.VERSION;
for (const p of [
  'apps/candy/package.json',
  'apps/candy/src-tauri/tauri.conf.json',
]) {
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  j.version = version;
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
}
"

sed -i.bak "s/^version = \".*\"/version = \"$VERSION\"/" apps/candy/src-tauri/Cargo.toml
rm -f apps/candy/src-tauri/Cargo.toml.bak
