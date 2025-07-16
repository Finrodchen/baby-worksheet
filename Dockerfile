# 使用官方 Node.js 運行時作為基礎映像
FROM node:18-alpine

# 設置工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production

# 複製應用程式代碼
COPY . .

# 初始化資料庫
RUN node scripts/init-db.js

# 暴露端口
EXPOSE 3001

# 創建非 root 用戶
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 更改文件所有權
RUN chown -R nextjs:nodejs /app
USER nextjs

# 啟動應用程式
CMD ["node", "server.js"]