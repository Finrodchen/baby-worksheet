# Baby Worksheet - 寶寶作息記錄表

一個用於記錄和管理寶寶日常作息、積分任務和獎勵的 Web 應用程式。

## 功能特色

- 📅 作息時間管理
- 🎯 積分任務系統
- 🏆 獎勵兌換機制
- 📊 歷史記錄查看
- 👶 多孩子管理
- 📱 響應式設計，支援手機和平板

## 技術架構

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **後端**: Node.js + Express.js
- **資料庫**: SQLite
- **容器化**: Docker
- **CI/CD**: GitHub Actions

## 快速開始

### 使用 Docker (推薦)

1. 克隆專案：
```bash
git clone <your-repo-url>
cd baby-worksheet
```

2. 使用 Docker Compose 啟動：
```bash
docker-compose up -d
```

3. 開啟瀏覽器訪問：http://localhost:3001

### 本地開發

1. 安裝依賴：
```bash
npm install
```

2. 初始化資料庫：
```bash
npm run init-db
```

3. 啟動開發服務器：
```bash
npm run dev
```

## Docker 部署

### 構建 Docker Image

```bash
# 構建 image
docker build -t baby-worksheet .

# 運行容器
docker run -p 3001:3001 -v $(pwd)/database.sqlite:/app/database.sqlite baby-worksheet
```

### 使用 GitHub Container Registry

當你推送代碼到 GitHub 時，GitHub Actions 會自動構建 Docker image 並推送到 GitHub Container Registry (ghcr.io)。

```bash
# 拉取最新的 image
docker pull ghcr.io/your-username/baby-worksheet:latest

# 運行容器
docker run -p 3001:3001 ghcr.io/your-username/baby-worksheet:latest
```

## GitHub Actions CI/CD

本專案包含自動化的 CI/CD 流程：

- **觸發條件**: 推送到 main/master 分支或創建 tag
- **構建流程**: 自動構建 Docker image
- **推送目標**: GitHub Container Registry (ghcr.io)
- **標籤策略**: 
  - `latest` - 最新的 main 分支
  - `v1.0.0` - 版本標籤
  - `sha-abc123` - Git commit SHA

### 設置步驟

1. 確保你的 GitHub 倉庫啟用了 GitHub Actions
2. 推送代碼到 main 分支
3. GitHub Actions 會自動開始構建流程
4. 構建完成後，Docker image 會出現在你的 GitHub 包頁面

### 使用構建的 Image

```bash
# 替換 your-username 和 your-repo 為實際值
docker pull ghcr.io/your-username/your-repo:latest
docker run -p 3001:3001 ghcr.io/your-username/your-repo:latest
```

## 環境變數

| 變數名 | 描述 | 預設值 |
|--------|------|--------|
| PORT | 服務器端口 | 3001 |
| NODE_ENV | 運行環境 | development |

## 資料持久化

資料庫文件 `database.sqlite` 包含所有應用程式資料。在 Docker 部署時，建議將此文件掛載為 volume 以確保資料持久化：

```bash
docker run -p 3001:3001 -v /path/to/your/database.sqlite:/app/database.sqlite baby-worksheet
```

## 開發指南

### 專案結構

```
baby-worksheet/
├── index.html          # 主頁面
├── script.js           # 前端邏輯
├── styles.css          # 樣式文件
├── db.js              # 前端資料庫接口
├── server.js          # 後端服務器
├── scripts/
│   └── init-db.js     # 資料庫初始化腳本
├── Dockerfile         # Docker 構建文件
├── docker-compose.yml # Docker Compose 配置
└── .github/
    └── workflows/
        └── docker-build.yml # GitHub Actions 工作流程
```

### API 端點

- `GET /children` - 獲取所有孩子
- `POST /children` - 新增孩子
- `GET /children/:id` - 獲取特定孩子
- `DELETE /children/:id` - 刪除孩子
- `GET /children/:id/schedules` - 獲取作息表
- `POST /children/:id/schedules` - 保存作息表
- `GET /children/:id/points-tasks` - 獲取積分任務
- `POST /children/:id/points-tasks` - 保存積分任務
- `GET /children/:id/rewards` - 獲取獎勵項目
- `POST /children/:id/rewards` - 保存獎勵項目
- `GET /children/:id/daily-records` - 獲取每日記錄
- `POST /children/:id/daily-records` - 保存每日記錄
- `GET /children/:id/daily-records/:date` - 獲取特定日期記錄

## 授權

本專案採用 MIT 授權條款。