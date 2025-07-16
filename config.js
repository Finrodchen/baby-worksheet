// 環境配置模組

// 檢測當前環境
function detectEnvironment() {
    const hostname = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;
    
    // Docker 環境檢測
    const isDocker = (
        // 在容器中通常不是 localhost
        hostname !== 'localhost' && hostname !== '127.0.0.1'
    ) || (
        // 或者端口是 3001（生產環境端口）
        port === '3001'
    );
    
    // 開發環境檢測
    const isDevelopment = (
        hostname === 'localhost' || hostname === '127.0.0.1'
    ) && port !== '3001';
    
    return {
        isDocker,
        isDevelopment,
        isProduction: !isDevelopment,
        hostname,
        port,
        protocol
    };
}

// 獲取 API 基礎 URL
function getApiBaseUrl() {
    const env = detectEnvironment();
    
    if (env.isDocker || env.isProduction) {
        // Docker 或生產環境：使用相對路徑
        return '/api';
    }
    
    // 開發環境：使用完整的 localhost URL
    return 'http://localhost:3001/api';
}

// 導出配置
window.AppConfig = {
    detectEnvironment,
    getApiBaseUrl,
    environment: detectEnvironment(),
    apiBaseUrl: getApiBaseUrl()
};

// Debug 輸出
if (localStorage.getItem('debugMode') === 'true' || window.location.search.includes('debug=true')) {
    console.log('🔍 [CONFIG] Environment detected:', window.AppConfig.environment);
    console.log('🔍 [CONFIG] API Base URL:', window.AppConfig.apiBaseUrl);
}