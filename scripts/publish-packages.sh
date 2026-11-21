#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -z "${NODE_AUTH_TOKEN:-}" ]]; then
  echo "publish-packages: set NODE_AUTH_TOKEN" >&2
  exit 1
fi
export YARN_NPM_AUTH_TOKEN="${YARN_NPM_AUTH_TOKEN:-${NODE_AUTH_TOKEN}}"
cd "${root}"
name="$(node -p "require('./package.json').name")"
version="$(node -p "require('./package.json').version")"
if npm view "${name}@${version}" --registry=https://npm.pkg.github.com version >/dev/null 2>&1; then
  echo "publish-packages: ${name}@${version} already on registry; skip"
  exit 0
fi
YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn install
yarn build
npm publish --registry=https://npm.pkg.github.com --access=restricted
echo "publish-packages OK: ${name}@${version}"
