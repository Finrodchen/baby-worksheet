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

## 注意事項

- Debug 模式會產生大量日誌輸出，建議僅在開發和診斷問題時使用
- 生產環境建議關閉 debug 模式以提升效能
- Debug 日誌可能包含敏感資訊，請勿在生產環境中啟用