# Debug 模式說明

本專案包含詳細的 debug 日誌功能，可以幫助開發者診斷問題。

## 啟用 Debug 模式

### 前端 Debug 模式

有兩種方式啟用前端 debug 模式：

1. **URL 參數方式**：在瀏覽器 URL 後添加 `?debug=true`
   ```
   http://localhost:3001?debug=true
   ```

2. **localStorage 方式**：在瀏覽器開發者工具的 Console 中執行
   ```javascript
   localStorage.setItem('debugMode', 'true');
   ```
   然後重新載入頁面。

### 後端 Debug 模式

設置環境變數 `DEBUG_MODE=true`：

1. **開發環境**：
   ```bash
   set DEBUG_MODE=true && node server.js
   ```

2. **Docker 環境**：修改 `docker-compose.yml` 中的環境變數
   ```yaml
   environment:
     - DEBUG_MODE=true
   ```

## Debug 日誌內容

### 前端 Debug 日誌
- 新增孩子流程的詳細步驟
- API 請求和響應的完整資訊
- 資料庫操作的狀態追蹤

### 後端 Debug 日誌
- 資料庫連接和初始化過程
- SQL 查詢執行詳情
- API 端點的請求處理過程
- 檔案系統操作狀態

## 關閉 Debug 模式

### 前端
```javascript
localStorage.removeItem('debugMode');
```
或移除 URL 中的 `?debug=true` 參數

### 後端
設置 `DEBUG_MODE=false` 或移除該環境變數

## API 連接測試工具

我們提供了一個專門的測試工具來診斷 API 連接問題：

### 使用測試工具

1. 在瀏覽器中打開 `test-api.html`
2. 查看環境資訊確認配置是否正確
3. 點擊各種測試按鈕來診斷問題
4. 根據測試結果進行故障排除

### 常見問題解決方案

#### 1. "Fail to Fetch" 錯誤
- **原因**: 網路連接問題或後端服務未啟動
- **解決方案**:
  - 確認 Docker 容器正在運行：`docker-compose ps`
  - 檢查端口 3001 是否可訪問：`curl http://localhost:3001/api/children`
  - 檢查防火牆設置
  - 確認 Docker 端口映射正確

#### 2. CORS 錯誤
- **原因**: 跨域請求被阻止
- **解決方案**:
  - 確認後端已正確配置 CORS 中間件
  - 檢查請求來源是否在允許列表中

#### 3. 404 錯誤
- **原因**: API 路由不存在或路徑錯誤
- **解決方案**:
  - 確認 API 路由配置正確
  - 檢查 `config.js` 中的 API 基礎 URL 設定
  - 驗證後端服務是否正常啟動

#### 4. 500 內部伺服器錯誤
- **原因**: 後端程式錯誤或資料庫問題
- **解決方案**:
  - 檢查後端日誌：`docker-compose logs baby-worksheet`
  - 確認資料庫檔案權限和路徑
  - 檢查資料庫初始化是否成功

## Docker 環境特殊配置

### 環境自動檢測

應用程式現在會自動檢測運行環境：

- **開發環境**: `localhost` 或 `127.0.0.1`，使用完整 URL
- **Docker/生產環境**: 其他主機名，使用相對路徑 `/api`

### 配置檔案

`config.js` 提供了統一的環境配置管理：

```javascript
// 自動檢測環境並配置 API URL
const apiBaseUrl = window.AppConfig.apiBaseUrl;
const environment = window.AppConfig.environment;
```

## 注意事項

- 在生產環境中，建議保持 `DEBUG_MODE=false` 以提高性能和安全性
- Debug 日誌可能包含敏感資訊，請謹慎使用
- 前端的 debug 模式設定會保存在瀏覽器的 localStorage 中
- 使用 `test-api.html` 工具可以快速診斷 API 連接問題
- 在 Docker 環境中，確保容器間的網路連接正常