#!/bin/bash
set -e

echo "[1/3] Building..."
npm run build
echo "Build OK"
echo ""

SERVER_USER="root"
SERVER_HOST="hellokiki.cn"
SERVER_PATH="/www/wwwroot/hellokiki.cn/zfj-tools/"

echo "[2/3] Uploading..."
scp -r "dist/." "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}"

echo "Fixing permissions..."
ssh "${SERVER_USER}@${SERVER_HOST}" "chmod -R 755 ${SERVER_PATH} && find ${SERVER_PATH} -type f -exec chmod 644 {} \;"

echo "Upload OK"
echo ""

echo "[3/3] Done - https://hellokiki.cn"
