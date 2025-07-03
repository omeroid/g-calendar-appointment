#!/bin/bash

# 環境変数を設定してビルド
echo "Building application..."
yarn build

# Python の簡易サーバーで確認
echo "Starting local server at http://localhost:8000"
cd dist
python3 -m http.server 8000