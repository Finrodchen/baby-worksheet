#!/bin/sh

# Docker 容器啟動腳本
# 確保資料庫在容器啟動時正確初始化

echo "🐳 [DOCKER] 容器啟動中..."
echo "🐳 [DOCKER] 資料庫路徑: ${DB_PATH:-/app/data/database.sqlite}"

# 檢查資料庫是否存在且有內容
DB_FILE="${DB_PATH:-/app/data/database.sqlite}"

if [ ! -f "$DB_FILE" ] || [ ! -s "$DB_FILE" ]; then
    echo "🐳 [DOCKER] 資料庫不存在或為空，正在初始化..."
    node scripts/init-db.js
    if [ $? -eq 0 ]; then
        echo "🐳 [DOCKER] 資料庫初始化成功"
    else
        echo "🐳 [DOCKER] 資料庫初始化失敗"
        exit 1
    fi
else
    echo "🐳 [DOCKER] 資料庫已存在，跳過初始化"
fi

# 啟動應用程式
echo "🐳 [DOCKER] 啟動 Node.js 應用程式..."
exec node server.js