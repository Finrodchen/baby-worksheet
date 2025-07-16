# 使用官方 Node.js 運行時作為基礎映像
FROM node:18-alpine

# 設置工作目錄
WORKDIR /app

# 創建資料目錄
RUN mkdir -p /app/data

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production

# 創建非 root 用戶
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 複製應用程式代碼
COPY . .

# 更改文件所有權，特別注意 data 目錄權限
RUN chown -R nextjs:nodejs /app
RUN chmod -R 755 /app/data

# 切換到非 root 用戶
USER nextjs

# 初始化資料庫（在非 root 用戶下執行）
RUN node scripts/init-db.js

# 暴露端口
EXPOSE 3001

# 啟動應用程式
CMD ["node", "server.js"]