#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -z "${NODE_AUTH_TOKEN:-}" ]]; then
  echo "publish-packages: set NODE_AUTH_TOKEN" >&2
  exit 1
fi
export YARN_NPM_AUTH_TOKEN="${NODE_AUTH_TOKEN}"
cd "${root}"
YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn install
yarn build
npm publish --registry=https://npm.pkg.github.com --access=restricted
echo "publish-packages OK: @local-hosting/vocab"