// 引入數據庫模組
import * as db from './db.js';

// 全局變數
let currentChild = null;
let currentDate = new Date();
let children = {};

// Debug 模式（可通過 localStorage 控制）
const DEBUG_MODE = localStorage.getItem('debugMode') === 'true' || window.location.search.includes('debug=true');

// 登入相關變數
let isLoggedIn = false;
let isDbInitialized = false;
const VALID_USERNAME = 's02260441';
const VALID_PASSWORD = '02260441';

// 登入相關函數
function checkLogin() {
    const savedLoginStatus = localStorage.getItem('isLoggedIn');
    if (savedLoginStatus === 'true') {
        isLoggedIn = true;
        showMainApp();
    } else {
        showLoginForm();
    }
}

function showLoginForm() {
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

function showMainApp() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
}

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
        isLoggedIn = true;
        localStorage.setItem('isLoggedIn', 'true');
        showMainApp();
        
        try {
            // 初始化數據庫
            if (!isDbInitialized) {
                await initializeDatabase();
            }
            
            await initializeApp();
            setupEventListeners();
            await loadData();
            updateCurrentDate();
            showTab('schedule');
            errorDiv.style.display = 'none';
        } catch (error) {
            console.error('初始化應用程式失敗:', error);
            errorDiv.textContent = '❌ 初始化應用程式失敗，請重新登入';
            errorDiv.style.display = 'block';
        }
    } else {
        errorDiv.textContent = '❌ 帳號或密碼錯誤，請重新輸入';
        errorDiv.style.display = 'block';
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }
}

function handleLogout() {
    if (confirm('確定要登出嗎？')) {
        isLoggedIn = false;
        localStorage.removeItem('isLoggedIn');
        showLoginForm();
        // 清空表單
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }
}

// 預設作息表
const defaultSchedule = [
    { time: '06:30-07:00', activity: '起床、梳洗、早餐', note: '你每天都能準時起床，真棒！' },
    { time: '07:00-07:30', activity: '整理書包、準備上學', note: '自己準備，越來越獨立了！' },
    { time: '07:30-16:00', activity: '上學', note: '今天在學校表現很棒！' },
    { time: '16:00-16:30', activity: '回家、休息、點心', note: '辛苦一天了，休息一下！' },
    { time: '16:30-17:30', activity: '完成作業、複習', note: '努力學習，進步真快！' },
    { time: '17:30-18:00', activity: '運動或戶外活動', note: '運動讓你更健康有活力！' },
    { time: '18:00-19:00', activity: '晚餐、家人互動', note: '和家人一起吃飯最幸福！' },
    { time: '19:00-19:30', activity: '閱讀或才藝練習', note: '你越來越愛閱讀了！' },
    { time: '19:30-20:00', activity: '洗澡、準備睡覺', note: '你會自己照顧身體，真棒！' },
    { time: '20:00-20:30', activity: '親子對話、分享', note: '今天有什麼值得驕傲的事？' },
    { time: '20:30', activity: '上床睡覺', note: '晚安，明天又是美好的一天！' }
];

// 預設積分項目
const defaultPointsTasks = [
    { name: '準時起床', points: 1 },
    { name: '完成功課', points: 2 },
    { name: '幫忙家事', points: 1 },
    { name: '閱讀30分鐘', points: 1 },
    { name: '運動30分鐘', points: 1 },
    { name: '分享心得', points: 1 }
];

// 預設獎勵項目
const defaultRewards = [
    { name: '🎨 貼紙一張', cost: 10 },
    { name: '📝 小文具', cost: 15 },
    { name: '🎁 小禮物', cost: 30 },
    { name: '🎮 遊戲時間30分鐘', cost: 25 },
    { name: '🍦 冰淇淋', cost: 20 },
    { name: '🎪 親子共遊', cost: 50 }
];

// 初始化數據庫
async function initializeDatabase() {
    try {
        const result = await db.initDatabase();
        if (result) {
            console.log('數據庫初始化成功');
            isDbInitialized = true;
            
            // 嘗試從localStorage遷移數據
            const migrationResult = await db.migrateFromLocalStorage();
            if (migrationResult) {
                console.log('從localStorage遷移數據成功');
            }
            
            return true;
        } else {
            console.error('數據庫初始化失敗');
            return false;
        }
    } catch (error) {
        console.error('初始化數據庫時發生錯誤:', error);
        return false;
    }
}

// 初始化應用
document.addEventListener('DOMContentLoaded', async function() {
    // 首先設置登入相關的事件監聽器
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // 檢查登入狀態
    checkLogin();
    
    // 如果已經登入，初始化應用程式
    if (isLoggedIn) {
        try {
            // 初始化數據庫
            await initializeDatabase();
            
            await initializeApp();
            setupEventListeners();
            await loadData();
            updateCurrentDate();
            showTab('schedule');
        } catch (error) {
            console.error('初始化應用程式失敗:', error);
        }
    }
});

// 初始化應用
async function initializeApp() {
    try {
        // 獲取所有孩子資料
        const allChildren = await db.getAllChildren();
        
        // 更新children物件
        children = {};
        allChildren.forEach(child => {
            children[child.id] = { name: child.name, data: {} };
        });
        
        // 如果有孩子資料，設定第一個為當前孩子
        if (allChildren.length > 0) {
            currentChild = allChildren[0].id;
        }
        
        // 更新孩子選擇下拉選單
        await updateChildSelect();
        
        return true;
    } catch (error) {
        console.error('初始化應用程式時發生錯誤:', error);
        return false;
    }
}

// 更新孩子選擇下拉選單
async function updateChildSelect() {
    try {
        const allChildren = await db.getAllChildren();
        const select = document.getElementById('childSelect');
        
        if (!select) return;
        
        select.innerHTML = '';
        
        if (allChildren.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '請先新增孩子';
            select.appendChild(option);
            currentChild = null;
        } else {
            allChildren.forEach(child => {
                const option = document.createElement('option');
                option.value = child.id;
                option.textContent = child.name;
                select.appendChild(option);
            });
            
            // 設置當前選中的孩子
            if (currentChild && allChildren.find(c => c.id === currentChild)) {
                select.value = currentChild;
            } else if (allChildren.length > 0) {
                currentChild = allChildren[0].id;
                select.value = currentChild;
            }
        }
    } catch (error) {
        console.error('更新孩子選擇器時發生錯誤:', error);
    }
}

// 設置事件監聽器
function setupEventListeners() {
    // 登入表單事件
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // 登出按鈕事件
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // 標籤切換
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            showTab(tabName);
        });
    });

    // 孩子選擇
    document.getElementById('childSelect').addEventListener('change', (e) => {
        currentChild = e.target.value;
        refreshCurrentView();
    });

    // 新增孩子
    document.getElementById('addChildBtn').addEventListener('click', addNewChild);
    
    // 刪除孩子
    document.getElementById('deleteChildBtn').addEventListener('click', deleteChild);

    // 日期導航
    document.getElementById('prevDay').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        updateCurrentDate();
        refreshCurrentView();
    });

    document.getElementById('nextDay').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 1);
        updateCurrentDate();
        refreshCurrentView();
    });

    // 編輯按鈕
    document.getElementById('editScheduleBtn').addEventListener('click', () => {
        showTab('settings');
    });

    // 設定頁面按鈕
    document.getElementById('addScheduleItem').addEventListener('click', addScheduleItem);
    document.getElementById('saveSchedule').addEventListener('click', saveSchedule);
    document.getElementById('addPointsItem').addEventListener('click', addPointsItem);
    document.getElementById('savePoints').addEventListener('click', savePoints);
    document.getElementById('addRewardItem').addEventListener('click', addRewardItem);
    document.getElementById('saveRewards').addEventListener('click', saveRewards);
    
    // 數據管理按鈕
    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    document.getElementById('importDataBtn').addEventListener('click', () => {
        document.getElementById('importFileInput').click();
    });
    document.getElementById('importFileInput').addEventListener('change', importData);

    // 模態框
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('modal')) {
            closeModal();
        }
    });
}

// 顯示標籤
function showTab(tabName) {
    // 隱藏所有標籤內容
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // 移除所有標籤按鈕的活動狀態
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 顯示選中的標籤
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // 根據標籤更新內容
    switch(tabName) {
        case 'schedule':
            displaySchedule();
            break;
        case 'points':
            displayPoints();
            break;
        case 'history':
            displayHistory();
            break;
        case 'settings':
            displaySettings();
            break;
    }
}

// 更新當前日期顯示
function updateCurrentDate() {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    document.getElementById('currentDate').textContent = 
        currentDate.toLocaleDateString('zh-TW', options);
}

// 顯示作息表
async function displaySchedule() {
    try {
        const scheduleList = document.getElementById('scheduleList');
        const schedules = await db.getSchedules(currentChild);
        const dateKey = formatDate(currentDate);
        const dailyRecord = await db.getDailyRecord(currentChild, dateKey);
        
        scheduleList.innerHTML = '';
        
        schedules.forEach((item, index) => {
            const scheduleItem = document.createElement('div');
            scheduleItem.className = 'schedule-item';
            const isCompleted = dailyRecord.schedule && dailyRecord.schedule[index];
            
            if (isCompleted) {
                scheduleItem.classList.add('schedule-completed');
            }
            
            scheduleItem.innerHTML = `
                <div class="schedule-time">${item.time}</div>
                <div class="schedule-activity">${item.activity}</div>
                <input type="checkbox" class="schedule-checkbox" ${isCompleted ? 'checked' : ''} 
                       onchange="toggleScheduleItem(${index})">
            `;
            scheduleList.appendChild(scheduleItem);
        });
        
        // 重新綁定事件
        document.querySelectorAll('.schedule-checkbox').forEach((checkbox, index) => {
            checkbox.addEventListener('change', () => toggleScheduleItem(index));
        });
    } catch (error) {
        console.error('顯示作息表時發生錯誤:', error);
    }
}

// 顯示積分頁面
async function displayPoints() {
    try {
        const dateKey = formatDate(currentDate);
        const dailyRecord = await db.getDailyRecord(currentChild, dateKey);
        const totalPoints = await db.getTotalPoints(currentChild);
        const weeklyPoints = await db.calculateWeeklyPoints(currentChild, dateKey);
        
        // 更新總積分和週積分
        document.getElementById('totalPoints').textContent = totalPoints || 0;
        document.getElementById('weeklyPoints').textContent = weeklyPoints || 0;
        
        // 顯示今日任務
        const tasksContainer = document.getElementById('pointsTasksList');
        tasksContainer.innerHTML = '';
        
        // 獲取積分任務並確保沒有重複項
        let pointsTasks = await db.getPointsTasks(currentChild);
        
        // 使用 Map 來去除重複的任務名稱
        const uniqueTasks = new Map();
        pointsTasks.forEach((task) => {
            if (!uniqueTasks.has(task.name)) {
                uniqueTasks.set(task.name, task);
            }
        });
        
        // 將 Map 轉換回數組
        pointsTasks = Array.from(uniqueTasks.values());
        
        pointsTasks.forEach((task, index) => {
            const taskElement = document.createElement('div');
            taskElement.className = 'points-task';
            const isCompleted = dailyRecord.tasks && dailyRecord.tasks[index];
            
            if (isCompleted) {
                taskElement.classList.add('task-completed');
            }
            
            taskElement.innerHTML = `
                <div class="task-info">
                    <div class="task-name">${task.name}</div>
                    <div class="task-points">+${task.points}分</div>
                </div>
                <input type="checkbox" class="task-checkbox" ${isCompleted ? 'checked' : ''}>
            `;
            
            tasksContainer.appendChild(taskElement);
            
            // 綁定事件
            const checkbox = taskElement.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => toggleTask(index));
        });
        
        // 顯示獎勵項目
        await displayRewards();
    } catch (error) {
        console.error('顯示積分頁面時發生錯誤:', error);
    }
}

// 顯示獎勵項目
async function displayRewards() {
    try {
        const rewardsContainer = document.getElementById('rewardsList');
        const rewards = await db.getRewards(currentChild);
        const totalPoints = await db.getTotalPoints(currentChild);
        
        rewardsContainer.innerHTML = '';
        
        rewards.forEach((reward, index) => {
            const rewardElement = document.createElement('div');
            rewardElement.className = 'reward-item';
            const canAfford = totalPoints >= reward.cost;
            
            rewardElement.innerHTML = `
                <div class="reward-name">${reward.name}</div>
                <div class="reward-cost">需要 ${reward.cost} 積分</div>
                <button class="reward-btn" ${!canAfford ? 'disabled' : ''}>
                    ${canAfford ? '兌換' : '積分不足'}
                </button>
            `;
            
            rewardsContainer.appendChild(rewardElement);
            
            // 綁定事件
            const button = rewardElement.querySelector('.reward-btn');
            button.addEventListener('click', () => redeemReward(index));
        });
    } catch (error) {
        console.error('顯示獎勵項目時發生錯誤:', error);
    }
}

// 切換作息項目完成狀態
async function toggleScheduleItem(scheduleIndex) {
    try {
        const dateKey = formatDate(currentDate);
        const dailyRecord = await db.getDailyRecord(currentChild, dateKey);
        
        if (!dailyRecord.schedule) {
            dailyRecord.schedule = {};
        }
        
        const wasCompleted = dailyRecord.schedule[scheduleIndex];
        dailyRecord.schedule[scheduleIndex] = !wasCompleted;
        
        await db.saveDailyRecord(dailyRecord);
        
        // 如果是勾選完成，顯示鼓勵話語
        if (!wasCompleted) {
            const schedules = await db.getSchedules(currentChild);
            const scheduleItem = schedules[scheduleIndex];
            const encouragement = scheduleItem?.note;
            showEncouragementPopup(encouragement);
        }
        
        await displaySchedule();
    } catch (error) {
        console.error('切換作息項目完成狀態時發生錯誤:', error);
    }
}

// 切換任務完成狀態
async function toggleTask(taskIndex) {
    try {
        const dateKey = formatDate(currentDate);
        const dailyRecord = await db.getDailyRecord(currentChild, dateKey);
        
        if (!dailyRecord.tasks) {
            dailyRecord.tasks = {};
        }
        
        const wasCompleted = dailyRecord.tasks[taskIndex];
        dailyRecord.tasks[taskIndex] = !wasCompleted;
        
        await db.saveDailyRecord(dailyRecord);
        await displayPoints();
    } catch (error) {
        console.error('切換任務完成狀態時發生錯誤:', error);
    }
}

// 兌換獎勵
async function redeemReward(rewardIndex) {
    try {
        const rewards = await db.getRewards(currentChild);
        const reward = rewards[rewardIndex];
        const totalPoints = await db.getTotalPoints(currentChild);
        
        if (totalPoints >= reward.cost) {
            if (confirm(`確定要兌換「${reward.name}」嗎？將扣除 ${reward.cost} 積分。`)) {
                const dateKey = formatDate(new Date());
                const dailyRecord = await db.getDailyRecord(currentChild, dateKey);
                
                if (!dailyRecord.rewards) {
                    dailyRecord.rewards = [];
                }
                
                dailyRecord.rewards.push({
                    name: reward.name,
                    cost: reward.cost,
                    time: new Date().toLocaleTimeString('zh-TW')
                });
                
                await db.saveDailyRecord(dailyRecord);
                await displayPoints();
                alert(`🎉 恭喜！成功兌換「${reward.name}」！`);
            }
        }
    } catch (error) {
        console.error('兌換獎勵時發生錯誤:', error);
    }
}

// 顯示歷史記錄
async function displayHistory() {
    try {
        const historyContent = document.getElementById('historyContent');
        const allRecords = await db.getAllDailyRecords(currentChild);
        
        // 填充月份選擇器
        const monthSelect = document.getElementById('historyMonth');
        monthSelect.innerHTML = '<option value="">選擇月份</option>';
        
        const months = new Set();
        allRecords.forEach(record => {
            const date = new Date(record.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months.add(monthKey);
        });
        
        Array.from(months).sort().reverse().forEach(monthKey => {
            const option = document.createElement('option');
            option.value = monthKey;
            option.textContent = monthKey;
            monthSelect.appendChild(option);
        });
        
        // 顯示所有記錄
        await displayHistoryRecords();
        
        // 設置篩選事件
        monthSelect.addEventListener('change', displayHistoryRecords);
        document.getElementById('historyType').addEventListener('change', displayHistoryRecords);
    } catch (error) {
        console.error('顯示歷史記錄時發生錯誤:', error);
    }
}

// 顯示歷史記錄內容
async function displayHistoryRecords() {
    try {
        const historyContent = document.getElementById('historyContent');
        const allRecords = await db.getAllDailyRecords(currentChild);
        const pointsTasks = await db.getPointsTasks(currentChild);
        const selectedMonth = document.getElementById('historyMonth').value;
        const selectedType = document.getElementById('historyType').value;
        
        historyContent.innerHTML = '';
        
        // 按日期排序（降序）
        const sortedRecords = allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        for (const record of sortedRecords) {
            const date = new Date(record.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (selectedMonth && monthKey !== selectedMonth) continue;
            
            const recordElement = document.createElement('div');
            recordElement.style.marginBottom = '20px';
            recordElement.style.padding = '15px';
            recordElement.style.background = '#fff';
            recordElement.style.borderRadius = '10px';
            recordElement.style.border = '2px solid #DDA0DD';
            
            let content = `<h4>${date.toLocaleDateString('zh-TW', { 
                year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
            })}</h4>`;
            
            if ((selectedType === 'all' || selectedType === 'points') && record.tasks) {
                content += '<h5>📊 完成任務：</h5><ul>';
                Object.keys(record.tasks).forEach(taskIndex => {
                    if (record.tasks[taskIndex] && pointsTasks[taskIndex]) {
                        const task = pointsTasks[taskIndex];
                        if (task) {
                            content += `<li>${task.name} (+${task.points}分)</li>`;
                        }
                    }
                });
                content += '</ul>';
            }
            
            if ((selectedType === 'all' || selectedType === 'points') && record.rewards && record.rewards.length > 0) {
                content += '<h5>🎁 兌換獎勵：</h5><ul>';
                record.rewards.forEach(reward => {
                    content += `<li>${reward.name} (-${reward.cost}分) ${reward.time}</li>`;
                });
                content += '</ul>';
            }
            
            recordElement.innerHTML = content;
            historyContent.appendChild(recordElement);
        }
        
        if (historyContent.children.length === 0) {
            historyContent.innerHTML = '<p style="text-align: center; color: #666;">暫無記錄</p>';
        }
    } catch (error) {
        console.error('顯示歷史記錄內容時發生錯誤:', error);
    }
}

// 顯示設定頁面
async function displaySettings() {
    await displayScheduleEditor();
    await displayPointsEditor();
    await displayRewardsEditor();
}

// 顯示作息表編輯器
async function displayScheduleEditor() {
    try {
        const container = document.getElementById('scheduleEditorList');
        const schedules = await db.getSchedules(currentChild);
        
        container.innerHTML = '';
        
        schedules.forEach((item, index) => {
            const editorItem = document.createElement('div');
            editorItem.className = 'editor-item';
            editorItem.innerHTML = `
                <input type="text" value="${item.time}" placeholder="時間" data-field="time" data-index="${index}">
                <input type="text" value="${item.activity}" placeholder="活動內容" data-field="activity" data-index="${index}">
                <textarea placeholder="鼓勵話語" data-field="note" data-index="${index}">${item.note || ''}</textarea>
                <button class="delete-btn" data-index="${index}">🗑️</button>
            `;
            container.appendChild(editorItem);
            
            // 綁定刪除按鈕事件
            const deleteBtn = editorItem.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => deleteScheduleItem(index));
        });
    } catch (error) {
        console.error('顯示作息表編輯器時發生錯誤:', error);
    }
}

// 顯示積分項目編輯器
async function displayPointsEditor() {
    try {
        const container = document.getElementById('pointsEditorList');
        const pointsTasks = await db.getPointsTasks(currentChild);
        
        container.innerHTML = '';
        
        pointsTasks.forEach((task, index) => {
            const editorItem = document.createElement('div');
            editorItem.className = 'editor-item';
            editorItem.innerHTML = `
                <input type="text" value="${task.name}" placeholder="任務名稱" data-field="name" data-index="${index}">
                <input type="number" value="${task.points}" placeholder="積分" min="1" data-field="points" data-index="${index}">
                <button class="delete-btn" data-index="${index}">🗑️</button>
            `;
            container.appendChild(editorItem);
            
            // 綁定刪除按鈕事件
            const deleteBtn = editorItem.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => deletePointsItem(index));
        });
    } catch (error) {
        console.error('顯示積分項目編輯器時發生錯誤:', error);
    }
}

// 顯示獎勵項目編輯器
async function displayRewardsEditor() {
    try {
        const container = document.getElementById('rewardsEditorList');
        const rewards = await db.getRewards(currentChild);
        
        container.innerHTML = '';
        
        rewards.forEach((reward, index) => {
            const editorItem = document.createElement('div');
            editorItem.className = 'editor-item';
            editorItem.innerHTML = `
                <input type="text" value="${reward.name}" placeholder="獎勵名稱" data-field="name" data-index="${index}">
                <input type="number" value="${reward.cost}" placeholder="所需積分" min="1" data-field="cost" data-index="${index}">
                <button class="delete-btn" data-index="${index}">🗑️</button>
            `;
            container.appendChild(editorItem);
            
            // 綁定刪除按鈕事件
            const deleteBtn = editorItem.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => deleteRewardItem(index));
        });
    } catch (error) {
        console.error('顯示獎勵項目編輯器時發生錯誤:', error);
    }
}

// 新增作息項目
async function addScheduleItem() {
    try {
        const schedules = await db.getSchedules(currentChild);
        schedules.push({
            time: '',
            activity: '',
            note: ''
        });
        await db.saveSchedules(currentChild, schedules);
        await displayScheduleEditor();
    } catch (error) {
        console.error('新增作息項目時發生錯誤:', error);
    }
}

// 新增積分項目
async function addPointsItem() {
    try {
        const pointsTasks = await db.getPointsTasks(currentChild);
        
        // 生成一個唯一的任務名稱
        let newTaskName = '';
        let counter = 1;
        
        // 檢查是否有空名稱的任務，如果有則使用它
        const emptyTask = pointsTasks.find(task => task.name === '');
        if (emptyTask) {
            // 已經有空名稱的任務，不需要添加新的
            await displayPointsEditor();
            return;
        }
        
        // 添加新任務
        pointsTasks.push({
            name: '',
            points: 1
        });
        
        // 確保沒有重複的積分任務
        const uniquePointsTasks = Array.from(
            new Map(pointsTasks.map(task => [task.name, task])).values()
        );
        
        await db.savePointsTasks(currentChild, uniquePointsTasks);
        await displayPointsEditor();
    } catch (error) {
        console.error('新增積分項目時發生錯誤:', error);
    }
}

// 新增獎勵項目
async function addRewardItem() {
    try {
        const rewards = await db.getRewards(currentChild);
        rewards.push({
            name: '',
            cost: 10
        });
        await db.saveRewards(currentChild, rewards);
        await displayRewardsEditor();
    } catch (error) {
        console.error('新增獎勵項目時發生錯誤:', error);
    }
}

// 刪除作息項目
async function deleteScheduleItem(index) {
    try {
        if (confirm('確定要刪除這個作息項目嗎？')) {
            const schedules = await db.getSchedules(currentChild);
            schedules.splice(index, 1);
            await db.saveSchedules(currentChild, schedules);
            await displayScheduleEditor();
        }
    } catch (error) {
        console.error('刪除作息項目時發生錯誤:', error);
    }
}

// 刪除積分項目
async function deletePointsItem(index) {
    try {
        if (confirm('確定要刪除這個積分項目嗎？')) {
            const pointsTasks = await db.getPointsTasks(currentChild);
            pointsTasks.splice(index, 1);
            await db.savePointsTasks(currentChild, pointsTasks);
            await displayPointsEditor();
        }
    } catch (error) {
        console.error('刪除積分項目時發生錯誤:', error);
    }
}

// 刪除獎勵項目
async function deleteRewardItem(index) {
    try {
        if (confirm('確定要刪除這個獎勵項目嗎？')) {
            const rewards = await db.getRewards(currentChild);
            rewards.splice(index, 1);
            await db.saveRewards(currentChild, rewards);
            await displayRewardsEditor();
        }
    } catch (error) {
        console.error('刪除獎勵項目時發生錯誤:', error);
    }
}

// 儲存作息表
async function saveSchedule() {
    try {
        const container = document.getElementById('scheduleEditorList');
        const inputs = container.querySelectorAll('input, textarea');
        const schedules = await db.getSchedules(currentChild);
        
        inputs.forEach(input => {
            const field = input.dataset.field;
            const index = parseInt(input.dataset.index);
            
            if (schedules[index] && field) {
                schedules[index][field] = input.value;
            }
        });
        
        await db.saveSchedules(currentChild, schedules);
        alert('作息表已儲存！');
        await displaySchedule();
    } catch (error) {
        console.error('儲存作息表時發生錯誤:', error);
    }
}

// 儲存積分項目
async function savePoints() {
    try {
        const container = document.getElementById('pointsEditorList');
        const inputs = container.querySelectorAll('input');
        const pointsTasks = await db.getPointsTasks(currentChild);
        
        inputs.forEach(input => {
            const index = parseInt(input.dataset.index);
            const field = input.dataset.field;
            let value = input.value;
            
            if (field === 'points') {
                value = parseInt(value) || 1;
            }
            
            if (pointsTasks[index] && field) {
                pointsTasks[index][field] = value;
            }
        });
        
        // 確保沒有重複的積分任務
        const uniquePointsTasks = Array.from(
            new Map(pointsTasks.map(task => [task.name, task])).values()
        );
        
        await db.savePointsTasks(currentChild, uniquePointsTasks);
        alert('積分項目已儲存！');
        await displayPoints();
    } catch (error) {
        console.error('儲存積分項目時發生錯誤:', error);
    }
}

// 儲存獎勵項目
async function saveRewards() {
    try {
        const container = document.getElementById('rewardsEditorList');
        const inputs = container.querySelectorAll('input');
        const rewards = await db.getRewards(currentChild);
        
        inputs.forEach(input => {
            const index = parseInt(input.dataset.index);
            const field = input.dataset.field;
            let value = input.value;
            
            if (field === 'cost') {
                value = parseInt(value) || 10;
            }
            
            if (rewards[index] && field) {
                rewards[index][field] = value;
            }
        });
        
        await db.saveRewards(currentChild, rewards);
        alert('獎勵項目已儲存！');
        await displayRewards();
    } catch (error) {
        console.error('儲存獎勵項目時發生錯誤:', error);
    }
}

// 新增孩子
async function addNewChild() {
    if (DEBUG_MODE) console.log('🔍 [DEBUG] 開始新增孩子流程');
    try {
        const name = prompt('請輸入新孩子的名字：');
        if (DEBUG_MODE) console.log('🔍 [DEBUG] 用戶輸入的名字:', name);
        
        if (name && name.trim()) {
            const childId = 'child' + Date.now();
            if (DEBUG_MODE) console.log('🔍 [DEBUG] 生成的孩子ID:', childId);
            
            // 保存孩子基本資料
            if (DEBUG_MODE) console.log('🔍 [DEBUG] 開始保存孩子基本資料...');
            const saveResult = await db.saveChild({
                id: childId,
                name: name.trim()
            });
            if (DEBUG_MODE) console.log('🔍 [DEBUG] 保存孩子基本資料結果:', saveResult);
            
            // 檢查是否成功保存
            if (DEBUG_MODE) console.log('🔍 [DEBUG] 驗證孩子是否成功保存...');
            const savedChild = await db.getChild(childId);
            if (DEBUG_MODE) console.log('🔍 [DEBUG] 驗證結果:', savedChild);
            
            // 保存預設數據
            if (DEBUG_MODE) console.log('🔍 [DEBUG] 開始保存預設作息表...');
            await db.saveSchedules(childId, defaultSchedule);
            if (DEBUG_MODE) console.log('🔍 [DEBUG] 預設作息表保存完成');
            
            if (DEBUG_MODE) console.log('🔍 [DEBUG] 開始保存預設積分任務...');
            await db.savePointsTasks(childId, defaultPointsTasks);
            if (DEBUG_MODE) console.log('🔍 [DEBUG] 預設積分任務保存完成');
            
            if (DEBUG_MODE) console.log('🔍 [DEBUG] 開始保存預設獎勵項目...');
            await db.saveRewards(childId, defaultRewards);
            if (DEBUG_MODE) console.log('🔍 [DEBUG] 預設獎勵項目保存完成');
            
            // 更新選擇器
            if (DEBUG_MODE) console.log('🔍 [DEBUG] 開始更新孩子選擇器...');
            await updateChildSelect();
            
            // 切換到新孩子
            if (DEBUG_MODE) console.log('🔍 [DEBUG] 切換到新孩子:', childId);
            currentChild = childId;
            const select = document.getElementById('childSelect');
            if (select) {
                select.value = childId;
                if (DEBUG_MODE) console.log('🔍 [DEBUG] 選擇器值已設置為:', select.value);
            } else {
                if (DEBUG_MODE) console.error('🔍 [DEBUG] 找不到孩子選擇器元素');
            }
            
            if (DEBUG_MODE) console.log('🔍 [DEBUG] 開始刷新當前視圖...');
            await refreshCurrentView();
            if (DEBUG_MODE) console.log('🔍 [DEBUG] 新增孩子流程完成');
            
            alert(`成功新增孩子「${name.trim()}」！`);
        } else {
            if (DEBUG_MODE) console.log('🔍 [DEBUG] 用戶取消或輸入空名字');
        }
    } catch (error) {
        console.error('新增孩子失敗:', error.message);
        if (DEBUG_MODE) {
            console.error('🔍 [DEBUG] 新增孩子時發生錯誤:', error);
            console.error('🔍 [DEBUG] 錯誤堆疊:', error.stack);
        }
        alert('新增孩子失敗：' + error.message);
    }
}

// 刪除孩子
async function deleteChild() {
    try {
        const allChildren = await db.getAllChildren();
        
        // 檢查是否至少有兩個孩子（不能刪除到只剩一個）
        if (allChildren.length <= 1) {
            alert('至少需要保留一個小朋友！');
            return;
        }
        
        const child = await db.getChild(currentChild);
        const confirmMessage = `確定要刪除「${child.name}」的所有數據嗎？\n\n⚠️ 此操作無法復原，將會永久刪除：\n• 所有作息記錄\n• 積分記錄\n• 獎勵兌換記錄\n• 個人設定`;
        
        if (confirm(confirmMessage)) {
            // 刪除當前孩子的數據
            await db.deleteChild(currentChild);
            
            // 更新選擇器
            const select = document.getElementById('childSelect');
            select.innerHTML = '';
            
            const remainingChildren = await db.getAllChildren();
            remainingChildren.forEach(child => {
                const option = document.createElement('option');
                option.value = child.id;
                option.textContent = child.name;
                select.appendChild(option);
            });
            
            // 切換到第一個可用的孩子
            if (remainingChildren.length > 0) {
                currentChild = remainingChildren[0].id;
                select.value = currentChild;
            }
            
            await refreshCurrentView();
            
            alert(`已成功刪除「${child.name}」的所有數據。`);
        }
    } catch (error) {
        console.error('刪除孩子時發生錯誤:', error);
    }
}

// 刷新當前視圖
async function refreshCurrentView() {
    const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
    await showTab(activeTab);
}

// 格式化日期
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// 顯示鼓勵話語彈窗
function showEncouragementPopup(message) {
    const popup = document.getElementById('encouragementPopup');
    const messageElement = document.getElementById('encouragementMessage');
    
    // 設置訊息內容
    messageElement.textContent = message || '你完成了一項任務！';
    
    // 顯示彈窗
    popup.style.display = 'block';
    
    // 3秒後自動關閉
    setTimeout(() => {
        closeEncouragementPopup();
    }, 3000);
}

// 關閉鼓勵彈窗
function closeEncouragementPopup() {
    const popup = document.getElementById('encouragementPopup');
    popup.style.display = 'none';
}

// 顯示模態框
function showModal(content) {
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('modal').style.display = 'block';
}

// 關閉模態框
function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// 從數據庫載入數據
async function loadData() {
    try {
        // 獲取所有孩子資料
        const allChildren = await db.getAllChildren();
        
        // 更新孩子選擇器
        const select = document.getElementById('childSelect');
        select.innerHTML = '';
        
        allChildren.forEach(child => {
            const option = document.createElement('option');
            option.value = child.id;
            option.textContent = child.name;
            select.appendChild(option);
        });
        
        // 設置當前選中的孩子
        if (allChildren.length > 0) {
            currentChild = allChildren[0].id;
            select.value = currentChild;
        }
        
        return true;
    } catch (error) {
        console.error('載入數據時發生錯誤:', error);
        return false;
    }
}

// 匯出數據
async function exportData() {
    try {
        const exportedData = await db.exportData();
        const dataStr = JSON.stringify(exportedData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'children_data.json';
        link.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('匯出數據時發生錯誤:', error);
        alert('匯出數據失敗：' + error.message);
    }
}

// 匯入數據
async function importData(event) {
    try {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    await db.importData(importedData);
                    await loadData();
                    await refreshCurrentView();
                    alert('數據匯入成功！');
                } catch (error) {
                    alert('匯入失敗：' + error.message);
                }
            };
            reader.readAsText(file);
        }
    } catch (error) {
        console.error('匯入數據時發生錯誤:', error);
        alert('匯入數據失敗：' + error.message);
    }
}

// 將全局函數暴露給window對象，以便HTML中的事件處理器可以訪問
window.toggleScheduleItem = toggleScheduleItem;
window.toggleTask = toggleTask;
window.redeemReward = redeemReward;
window.deleteScheduleItem = deleteScheduleItem;
window.deletePointsItem = deletePointsItem;
window.deleteRewardItem = deleteRewardItem;
window.displayHistoryRecords = displayHistoryRecords;
window.closeEncouragementPopup = closeEncouragementPopup;