# 兒童作息表與積分系統

一個幫助家長管理孩子日常作息和積分獎勵的網頁應用程式。

## 功能特色

- 📅 **作息管理**: 自定義每日作息表，追蹤完成情況
- 🎯 **積分系統**: 設定積分任務，激勵孩子養成好習慣
- 🏆 **獎勵兌換**: 用積分兌換心儀的獎勵
- 📊 **歷史記錄**: 查看過往的作息和積分記錄
- 👶 **多孩子支援**: 可管理多個孩子的資料
- 📱 **響應式設計**: 支援手機、平板、電腦使用

## 技術架構

- **前端**: HTML5, CSS3, JavaScript (Vanilla)
- **後端**: Node.js + Express.js
- **資料庫**: SQLite
- **部署**: Vercel (前端) + Render (後端)

## 本地開發

### 安裝依賴
```bash
npm install
```

### 初始化資料庫
```bash
npm run init-db
```

### 啟動開發服務器
```bash
npm run dev
```

訪問 http://localhost:3001 查看應用程式。

## 部署指南

### 前端部署 (Vercel)

1. 將代碼推送到 GitHub
2. 在 [Vercel](https://vercel.com) 註冊並連接 GitHub
3. 選擇此倉庫進行部署
4. Vercel 會自動檢測並部署靜態文件

### 後端部署 (Render)

1. 在 [Render](https://render.com) 註冊
2. 創建新的 Web Service
3. 連接 GitHub 倉庫
4. 設置以下配置：
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node

5. 設置環境變數：
   ```
   NODE_ENV=production
   ```

**注意**: 本項目已解決 SQLite3 在雲端平台的兼容性問題，使用 `better-sqlite3` 作為主要資料庫驅動，確保在 Render 等平台上穩定運行。

6. 部署完成後，複製 Render 提供的 URL
7. 修改前端 `db.js` 文件中的 API 地址：
   ```javascript
   const API_BASE_URL = window.location.hostname === 'localhost' 
       ? 'http://localhost:3001/api'
       : 'https://your-render-app.onrender.com/api'; // 替換為實際的 Render URL
   ```

### 重新部署前端

修改 API 地址後，重新推送代碼到 GitHub，Vercel 會自動重新部署。

## 環境變數

### 後端 (Render)
- `NODE_ENV`: 設置為 `production`
- `PORT`: Render 會自動設置

## 資料庫

應用程式使用 SQLite 作為資料庫，包含以下資料表：
- `children`: 孩子基本資料
- `schedules`: 作息表
- `points_tasks`: 積分任務
- `rewards`: 獎勵項目
- `daily_records`: 每日記錄
- `default_*`: 預設模板資料

## 注意事項

1. **免費方案限制**: Render 免費方案會在 15 分鐘無活動後休眠
2. **冷啟動**: 首次訪問可能需要等待 30 秒左右
3. **資料備份**: 建議定期匯出重要資料

## 授權

MIT License