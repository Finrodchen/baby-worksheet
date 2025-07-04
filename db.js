// SQLite數據庫操作模組

// 初始化數據庫
let db = null;

// 初始化數據庫
async function initDatabase() {
    if (!window.indexedDB) {
        console.error('您的瀏覽器不支持IndexedDB，將使用localStorage作為備用存儲方式');
        return false;
    }

    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open('ChildrenWorksheetDB', 1);

        request.onerror = (event) => {
            console.error('數據庫打開失敗:', event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('數據庫連接成功');
            resolve(true);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // 創建孩子資料表
            if (!db.objectStoreNames.contains('children')) {
                const childrenStore = db.createObjectStore('children', { keyPath: 'id' });
                childrenStore.createIndex('name', 'name', { unique: false });
            }

            // 創建作息表資料表
            if (!db.objectStoreNames.contains('schedules')) {
                const schedulesStore = db.createObjectStore('schedules', { keyPath: 'id', autoIncrement: true });
                schedulesStore.createIndex('childId', 'childId', { unique: false });
            }

            // 創建積分項目資料表
            if (!db.objectStoreNames.contains('pointsTasks')) {
                const pointsTasksStore = db.createObjectStore('pointsTasks', { keyPath: 'id', autoIncrement: true });
                pointsTasksStore.createIndex('childId', 'childId', { unique: false });
            }

            // 創建獎勵項目資料表
            if (!db.objectStoreNames.contains('rewards')) {
                const rewardsStore = db.createObjectStore('rewards', { keyPath: 'id', autoIncrement: true });
                rewardsStore.createIndex('childId', 'childId', { unique: false });
            }

            // 創建每日記錄資料表
            if (!db.objectStoreNames.contains('dailyRecords')) {
                const dailyRecordsStore = db.createObjectStore('dailyRecords', { keyPath: 'id', autoIncrement: true });
                dailyRecordsStore.createIndex('childId', 'childId', { unique: false });
                dailyRecordsStore.createIndex('date', 'date', { unique: false });
                dailyRecordsStore.createIndex('childId_date', ['childId', 'date'], { unique: true });
            }

            console.log('數據庫結構創建完成');
        };
    });
}

// 獲取所有孩子資料
async function getAllChildren() {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('數據庫未初始化');
            return;
        }

        const transaction = db.transaction(['children'], 'readonly');
        const store = transaction.objectStore('children');
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// 獲取指定孩子資料
async function getChild(childId) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('數據庫未初始化');
            return;
        }

        const transaction = db.transaction(['children'], 'readonly');
        const store = transaction.objectStore('children');
        const request = store.get(childId);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// 添加或更新孩子資料
async function saveChild(child) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('數據庫未初始化');
            return;
        }

        const transaction = db.transaction(['children'], 'readwrite');
        const store = transaction.objectStore('children');
        const request = store.put(child);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// 刪除孩子資料
async function deleteChild(childId) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('數據庫未初始化');
            return;
        }

        const transaction = db.transaction(['children', 'schedules', 'pointsTasks', 'rewards', 'dailyRecords'], 'readwrite');
        
        // 刪除孩子資料
        const childrenStore = transaction.objectStore('children');
        childrenStore.delete(childId);

        // 刪除相關的作息表
        const schedulesStore = transaction.objectStore('schedules');
        const schedulesIndex = schedulesStore.index('childId');
        const schedulesRequest = schedulesIndex.openCursor(IDBKeyRange.only(childId));

        schedulesRequest.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }
        };

        // 刪除相關的積分項目
        const pointsTasksStore = transaction.objectStore('pointsTasks');
        const pointsTasksIndex = pointsTasksStore.index('childId');
        const pointsTasksRequest = pointsTasksIndex.openCursor(IDBKeyRange.only(childId));

        pointsTasksRequest.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }
        };

        // 刪除相關的獎勵項目
        const rewardsStore = transaction.objectStore('rewards');
        const rewardsIndex = rewardsStore.index('childId');
        const rewardsRequest = rewardsIndex.openCursor(IDBKeyRange.only(childId));

        rewardsRequest.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }
        };

        // 刪除相關的每日記錄
        const dailyRecordsStore = transaction.objectStore('dailyRecords');
        const dailyRecordsIndex = dailyRecordsStore.index('childId');
        const dailyRecordsRequest = dailyRecordsIndex.openCursor(IDBKeyRange.only(childId));

        dailyRecordsRequest.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }
        };

        transaction.oncomplete = () => {
            resolve(true);
        };

        transaction.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// 獲取孩子的作息表
async function getSchedules(childId) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('數據庫未初始化');
            return;
        }

        const transaction = db.transaction(['schedules'], 'readonly');
        const store = transaction.objectStore('schedules');
        const index = store.index('childId');
        const request = index.getAll(IDBKeyRange.only(childId));

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// 保存孩子的作息表
async function saveSchedules(childId, schedules) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('數據庫未初始化');
            return;
        }

        const transaction = db.transaction(['schedules'], 'readwrite');
        const store = transaction.objectStore('schedules');
        const index = store.index('childId');
        
        // 先刪除該孩子的所有作息表
        const deleteRequest = index.openCursor(IDBKeyRange.only(childId));
        
        deleteRequest.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            } else {
                // 添加新的作息表
                schedules.forEach(schedule => {
                    store.add({
                        childId: childId,
                        time: schedule.time,
                        activity: schedule.activity,
                        note: schedule.note
                    });
                });
            }
        };

        transaction.oncomplete = () => {
            resolve(true);
        };

        transaction.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// 獲取孩子的積分項目
async function getPointsTasks(childId) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('數據庫未初始化');
            return;
        }

        const transaction = db.transaction(['pointsTasks'], 'readonly');
        const store = transaction.objectStore('pointsTasks');
        const index = store.index('childId');
        const request = index.getAll(IDBKeyRange.only(childId));

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// 保存孩子的積分項目
async function savePointsTasks(childId, pointsTasks) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('數據庫未初始化');
            return;
        }

        const transaction = db.transaction(['pointsTasks'], 'readwrite');
        const store = transaction.objectStore('pointsTasks');
        const index = store.index('childId');
        
        // 先刪除該孩子的所有積分項目
        const deleteRequest = index.openCursor(IDBKeyRange.only(childId));
        
        deleteRequest.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            } else {
                // 添加新的積分項目
                pointsTasks.forEach(task => {
                    store.add({
                        childId: childId,
                        name: task.name,
                        points: task.points
                    });
                });
            }
        };

        transaction.oncomplete = () => {
            resolve(true);
        };

        transaction.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// 獲取孩子的獎勵項目
async function getRewards(childId) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('數據庫未初始化');
            return;
        }

        const transaction = db.transaction(['rewards'], 'readonly');
        const store = transaction.objectStore('rewards');
        const index = store.index('childId');
        const request = index.getAll(IDBKeyRange.only(childId));

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// 保存孩子的獎勵項目
async function saveRewards(childId, rewards) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('數據庫未初始化');
            return;
        }

        const transaction = db.transaction(['rewards'], 'readwrite');
        const store = transaction.objectStore('rewards');
        const index = store.index('childId');
        
        // 先刪除該孩子的所有獎勵項目
        const deleteRequest = index.openCursor(IDBKeyRange.only(childId));
        
        deleteRequest.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            } else {
                // 添加新的獎勵項目
                rewards.forEach(reward => {
                    store.add({
                        childId: childId,
                        name: reward.name,
                        cost: reward.cost
                    });
                });
            }
        };

        transaction.oncomplete = () => {
            resolve(true);
        };

        transaction.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// 獲取孩子的每日記錄
async function getDailyRecord(childId, date) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('數據庫未初始化');
            return;
        }

        const transaction = db.transaction(['dailyRecords'], 'readonly');
        const store = transaction.objectStore('dailyRecords');
        const index = store.index('childId_date');
        const request = index.get([childId, date]);

        request.onsuccess = () => {
            resolve(request.result || { childId, date, schedule: {}, tasks: {}, rewards: [] });
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// 保存孩子的每日記錄
async function saveDailyRecord(record) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('數據庫未初始化');
            return;
        }

        const transaction = db.transaction(['dailyRecords'], 'readwrite');
        const store = transaction.objectStore('dailyRecords');
        
        // 檢查是否已存在記錄
        const index = store.index('childId_date');
        const getRequest = index.get([record.childId, record.date]);
        
        getRequest.onsuccess = () => {
            const existingRecord = getRequest.result;
            if (existingRecord) {
                // 更新現有記錄
                record.id = existingRecord.id;
                store.put(record);
            } else {
                // 添加新記錄
                store.add(record);
            }
        };

        transaction.oncomplete = () => {
            resolve(true);
        };

        transaction.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// 獲取孩子的所有每日記錄
async function getAllDailyRecords(childId) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('數據庫未初始化');
            return;
        }

        const transaction = db.transaction(['dailyRecords'], 'readonly');
        const store = transaction.objectStore('dailyRecords');
        const index = store.index('childId');
        const request = index.getAll(IDBKeyRange.only(childId));

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// 獲取孩子的總積分
async function getTotalPoints(childId) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('數據庫未初始化');
            return;
        }

        const transaction = db.transaction(['dailyRecords', 'pointsTasks'], 'readonly');
        const dailyRecordsStore = transaction.objectStore('dailyRecords');
        const dailyRecordsIndex = dailyRecordsStore.index('childId');
        const dailyRecordsRequest = dailyRecordsIndex.getAll(IDBKeyRange.only(childId));
        
        let totalPoints = 0;
        
        dailyRecordsRequest.onsuccess = async () => {
            const records = dailyRecordsRequest.result;
            const pointsTasks = await getPointsTasks(childId);
            
            // 計算所有完成任務的積分
            records.forEach(record => {
                if (record.tasks) {
                    Object.keys(record.tasks).forEach(taskIndex => {
                        if (record.tasks[taskIndex] && pointsTasks[taskIndex]) {
                            totalPoints += pointsTasks[taskIndex].points;
                        }
                    });
                }
            });
            
            // 減去所有兌換獎勵的積分
            records.forEach(record => {
                if (record.rewards) {
                    record.rewards.forEach(reward => {
                        totalPoints -= reward.cost;
                    });
                }
            });
            
            resolve(totalPoints);
        };

        transaction.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// 計算週積分
async function calculateWeeklyPoints(childId, date) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('數據庫未初始化');
            return;
        }

        const today = new Date(date);
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        
        const transaction = db.transaction(['dailyRecords', 'pointsTasks'], 'readonly');
        const dailyRecordsStore = transaction.objectStore('dailyRecords');
        const dailyRecordsIndex = dailyRecordsStore.index('childId');
        const dailyRecordsRequest = dailyRecordsIndex.getAll(IDBKeyRange.only(childId));
        
        let weeklyPoints = 0;
        
        dailyRecordsRequest.onsuccess = async () => {
            const records = dailyRecordsRequest.result;
            const pointsTasks = await getPointsTasks(childId);
            
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
            
            resolve(weeklyPoints);
        };

        transaction.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// 匯出數據
async function exportData() {
    try {
        const children = await getAllChildren();
        const exportData = {};
        
        for (const child of children) {
            const childId = child.id;
            const schedules = await getSchedules(childId);
            const pointsTasks = await getPointsTasks(childId);
            const rewards = await getRewards(childId);
            const dailyRecords = await getAllDailyRecords(childId);
            const totalPoints = await getTotalPoints(childId);
            
            exportData[childId] = {
                name: child.name,
                data: {
                    schedule: schedules,
                    pointsTasks: pointsTasks,
                    rewards: rewards,
                    dailyRecords: dailyRecords.reduce((acc, record) => {
                        acc[record.date] = {
                            schedule: record.schedule,
                            tasks: record.tasks,
                            rewards: record.rewards
                        };
                        return acc;
                    }, {}),
                    totalPoints: totalPoints
                }
            };
        }
        
        return exportData;
    } catch (error) {
        console.error('匯出數據失敗:', error);
        throw error;
    }
}

// 匯入數據
async function importData(data) {
    try {
        // 清空所有表
        await clearAllData();
        
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

// 清空所有數據
async function clearAllData() {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('數據庫未初始化');
            return;
        }

        const transaction = db.transaction(['children', 'schedules', 'pointsTasks', 'rewards', 'dailyRecords'], 'readwrite');
        const childrenStore = transaction.objectStore('children');
        const schedulesStore = transaction.objectStore('schedules');
        const pointsTasksStore = transaction.objectStore('pointsTasks');
        const rewardsStore = transaction.objectStore('rewards');
        const dailyRecordsStore = transaction.objectStore('dailyRecords');
        
        childrenStore.clear();
        schedulesStore.clear();
        pointsTasksStore.clear();
        rewardsStore.clear();
        dailyRecordsStore.clear();
        
        transaction.oncomplete = () => {
            resolve(true);
        };
        
        transaction.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// 從localStorage遷移數據到IndexedDB
async function migrateFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('childrenData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            await importData(parsedData);
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