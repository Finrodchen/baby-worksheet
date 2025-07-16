// SQLite數據庫操作模組 (通過 API 與後端通信)

// API 基礎 URL
const API_BASE_URL = 'http://localhost:3001/api';

// Debug 模式（與前端保持一致）
const DEBUG_MODE = localStorage.getItem('debugMode') === 'true' || window.location.search.includes('debug=true');

// 通用 API 請求函數
async function apiRequest(url, options = {}) {
    if (DEBUG_MODE) {
        console.log('🔍 [API DEBUG] 準備發送請求');
        console.log('🔍 [API DEBUG] URL:', `${API_BASE_URL}${url}`);
        console.log('🔍 [API DEBUG] 選項:', options);
    }
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };
    
    if (DEBUG_MODE) console.log('🔍 [API DEBUG] 最終配置:', config);
    
    try {
        if (DEBUG_MODE) console.log('🔍 [API DEBUG] 發送 fetch 請求...');
        const response = await fetch(`${API_BASE_URL}${url}`, config);
        
        if (DEBUG_MODE) {
            console.log('🔍 [API DEBUG] 收到響應');
            console.log('🔍 [API DEBUG] 響應狀態:', response.status);
            console.log('🔍 [API DEBUG] 響應狀態文字:', response.statusText);
            console.log('🔍 [API DEBUG] 響應是否成功:', response.ok);
            console.log('🔍 [API DEBUG] 響應標頭:', Object.fromEntries(response.headers.entries()));
        }
        
        if (!response.ok) {
            const error = await response.text();
            if (DEBUG_MODE) console.error('🔍 [API DEBUG] 響應錯誤內容:', error);
            throw new Error(`API 請求失敗: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        if (DEBUG_MODE) console.log('🔍 [API DEBUG] 解析 JSON 成功:', result);
        return result;
    } catch (error) {
        console.error('API 請求失敗:', error.message);
        if (DEBUG_MODE) {
            console.error('🔍 [API DEBUG] API 請求過程中發生錯誤:', error);
            console.error('🔍 [API DEBUG] 錯誤類型:', error.constructor.name);
            console.error('🔍 [API DEBUG] 錯誤訊息:', error.message);
            console.error('🔍 [API DEBUG] 錯誤堆疊:', error.stack);
        }
        throw error;
    }
}

// 初始化數據庫
async function initDatabase() {
    try {
        // 測試與後端的連接
        await apiRequest('/children');
        console.log('數據庫連接成功');
        return true;
    } catch (error) {
        console.error('數據庫連接失敗:', error);
        return false;
    }
}

// 獲取所有孩子資料
async function getAllChildren() {
    return await apiRequest('/children');
}

// 獲取指定孩子資料
async function getChild(childId) {
    return await apiRequest(`/children/${childId}`);
}

// 添加或更新孩子資料
async function saveChild(child) {
    if (DEBUG_MODE) {
        console.log('🔍 [DB DEBUG] 開始保存孩子資料');
        console.log('🔍 [DB DEBUG] 孩子資料:', child);
    }
    
    try {
        if (DEBUG_MODE) console.log('🔍 [DB DEBUG] 發送 POST 請求到 /children');
        const result = await apiRequest('/children', {
            method: 'POST',
            body: JSON.stringify(child)
        });
        
        if (DEBUG_MODE) console.log('🔍 [DB DEBUG] 保存成功，返回結果:', result);
        return result;
    } catch (error) {
        console.error('保存孩子資料失敗:', error.message);
        if (DEBUG_MODE) {
            console.error('🔍 [DB DEBUG] 保存孩子資料時發生錯誤:', error);
            console.error('🔍 [DB DEBUG] 錯誤堆疊:', error.stack);
        }
        throw error;
    }
}

// 刪除孩子資料
async function deleteChild(childId) {
    return await apiRequest(`/children/${childId}`, {
        method: 'DELETE'
    });
}

// 獲取孩子的作息表
async function getSchedules(childId) {
    return await apiRequest(`/children/${childId}/schedules`);
}

// 保存孩子的作息表
async function saveSchedules(childId, schedules) {
    return await apiRequest(`/children/${childId}/schedules`, {
        method: 'POST',
        body: JSON.stringify({ schedules })
    });
}

// 獲取孩子的積分項目
async function getPointsTasks(childId) {
    return await apiRequest(`/children/${childId}/points-tasks`);
}

// 保存孩子的積分項目
async function savePointsTasks(childId, pointsTasks) {
    return await apiRequest(`/children/${childId}/points-tasks`, {
        method: 'POST',
        body: JSON.stringify({ pointsTasks })
    });
}

// 獲取孩子的獎勵項目
async function getRewards(childId) {
    return await apiRequest(`/children/${childId}/rewards`);
}

// 保存孩子的獎勵項目
async function saveRewards(childId, rewards) {
    return await apiRequest(`/children/${childId}/rewards`, {
        method: 'POST',
        body: JSON.stringify({ rewards })
    });
}

// 獲取孩子的每日記錄
async function getDailyRecord(childId, date) {
    return await apiRequest(`/children/${childId}/daily-records/${date}`);
}

// 保存孩子的每日記錄
async function saveDailyRecord(record) {
    return await apiRequest(`/children/${record.childId}/daily-records`, {
        method: 'POST',
        body: JSON.stringify(record)
    });
}

// 獲取孩子的所有每日記錄
async function getAllDailyRecords(childId) {
    return await apiRequest(`/children/${childId}/daily-records`);
}

// 獲取孩子的總積分
async function getTotalPoints(childId) {
    const response = await apiRequest(`/children/${childId}/total-points`);
    return response.totalPoints;
}

// 計算週積分
async function calculateWeeklyPoints(childId, date) {
    try {
        const today = new Date(date);
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        
        const records = await getAllDailyRecords(childId);
        const pointsTasks = await getPointsTasks(childId);
        
        let weeklyPoints = 0;
        
        // 計算本週完成任務的積分
        records.forEach(record => {
            const recordDate = new Date(record.date);
            if (recordDate >= weekStart && recordDate <= today) {
                if (record.tasks) {
                    Object.keys(record.tasks).forEach(taskIndex => {
                        if (record.tasks[taskIndex] && pointsTasks[taskIndex]) {
                            weeklyPoints += pointsTasks[taskIndex].points;
                        }
                    });
                }
            }
        });
        
        return weeklyPoints;
    } catch (error) {
        console.error('計算週積分失敗:', error);
        throw error;
    }
}

// 匯出數據
async function exportData() {
    return await apiRequest('/export');
}

// 匯入數據
async function importData(data) {
    try {
        // 匯入孩子資料
        for (const childId in data) {
            const child = data[childId];
            
            // 保存孩子基本資料
            await saveChild({
                id: childId,
                name: child.name
            });
            
            // 保存作息表
            await saveSchedules(childId, child.data.schedule);
            
            // 保存積分項目
            await savePointsTasks(childId, child.data.pointsTasks);
            
            // 保存獎勵項目
            await saveRewards(childId, child.data.rewards);
            
            // 保存每日記錄
            for (const date in child.data.dailyRecords) {
                const record = child.data.dailyRecords[date];
                await saveDailyRecord({
                    childId: childId,
                    date: date,
                    schedule: record.schedule,
                    tasks: record.tasks,
                    rewards: record.rewards
                });
            }
        }
        
        return true;
    } catch (error) {
        console.error('匯入數據失敗:', error);
        throw error;
    }
}

// 從localStorage遷移數據到SQLite
async function migrateFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('childrenData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            await importData(parsedData);
            // 清除localStorage中的舊資料
            localStorage.removeItem('childrenData');
            return true;
        }
        return false;
    } catch (error) {
        console.error('從localStorage遷移數據失敗:', error);
        return false;
    }
}

// 導出函數
export {
    initDatabase,
    getAllChildren,
    getChild,
    saveChild,
    deleteChild,
    getSchedules,
    saveSchedules,
    getPointsTasks,
    savePointsTasks,
    getRewards,
    saveRewards,
    getDailyRecord,
    saveDailyRecord,
    getAllDailyRecords,
    getTotalPoints,
    calculateWeeklyPoints,
    exportData,
    importData,
    migrateFromLocalStorage
};