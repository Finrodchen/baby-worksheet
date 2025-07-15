import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 資料庫檔案路徑
const dbPath = join(__dirname, '..', 'database.sqlite');

// 創建資料庫連接
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('無法連接到資料庫:', err.message);
        process.exit(1);
    }
    console.log('已連接到 SQLite 資料庫');
});

// 創建資料表
const createTables = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // 創建孩子資料表
            db.run(`
                CREATE TABLE IF NOT EXISTS children (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // 創建作息表資料表
            db.run(`
                CREATE TABLE IF NOT EXISTS schedules (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    child_id TEXT NOT NULL,
                    time TEXT NOT NULL,
                    activity TEXT NOT NULL,
                    note TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (child_id) REFERENCES children (id) ON DELETE CASCADE
                )
            `);

            // 創建積分項目資料表
            db.run(`
                CREATE TABLE IF NOT EXISTS points_tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    child_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    points INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (child_id) REFERENCES children (id) ON DELETE CASCADE
                )
            `);

            // 創建獎勵項目資料表
            db.run(`
                CREATE TABLE IF NOT EXISTS rewards (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    child_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    cost INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (child_id) REFERENCES children (id) ON DELETE CASCADE
                )
            `);

            // 創建每日記錄資料表
            db.run(`
                CREATE TABLE IF NOT EXISTS daily_records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    child_id TEXT NOT NULL,
                    date TEXT NOT NULL,
                    schedule_data TEXT,
                    tasks_data TEXT,
                    rewards_data TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (child_id) REFERENCES children (id) ON DELETE CASCADE,
                    UNIQUE(child_id, date)
                )
            `, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('所有資料表創建完成');
                    resolve();
                }
            });
        });
    });
};

// 創建預設模板資料表
const createTemplateData = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // 創建預設作息表模板
            db.run(`
                CREATE TABLE IF NOT EXISTS default_schedules (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    time TEXT NOT NULL,
                    activity TEXT NOT NULL,
                    note TEXT
                )
            `);

            // 創建預設積分項目模板
            db.run(`
                CREATE TABLE IF NOT EXISTS default_points_tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    points INTEGER NOT NULL
                )
            `);

            // 創建預設獎勵項目模板
            db.run(`
                CREATE TABLE IF NOT EXISTS default_rewards (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    cost INTEGER NOT NULL
                )
            `);

            // 預設作息表模板
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

            // 插入預設作息表模板
            const insertScheduleTemplate = db.prepare('INSERT OR IGNORE INTO default_schedules (time, activity, note) VALUES (?, ?, ?)');
            defaultSchedule.forEach(item => {
                insertScheduleTemplate.run(item.time, item.activity, item.note);
            });
            insertScheduleTemplate.finalize();

            // 預設積分項目模板
            const defaultPointsTasks = [
                { name: '準時起床', points: 1 },
                { name: '完成功課', points: 2 },
                { name: '幫忙家事', points: 1 },
                { name: '閱讀30分鐘', points: 1 },
                { name: '運動30分鐘', points: 1 },
                { name: '分享心得', points: 1 }
            ];

            // 插入預設積分項目模板
            const insertPointsTaskTemplate = db.prepare('INSERT OR IGNORE INTO default_points_tasks (name, points) VALUES (?, ?)');
            defaultPointsTasks.forEach(task => {
                insertPointsTaskTemplate.run(task.name, task.points);
            });
            insertPointsTaskTemplate.finalize();

            // 預設獎勵項目模板
            const defaultRewards = [
                { name: '🎨 貼紙一張', cost: 10 },
                { name: '📝 小文具', cost: 15 },
                { name: '🎁 小禮物', cost: 30 },
                { name: '🎮 遊戲時間30分鐘', cost: 25 },
                { name: '🍦 冰淇淋', cost: 20 },
                { name: '🎪 親子共遊', cost: 50 }
            ];

            // 插入預設獎勵項目模板
            const insertRewardTemplate = db.prepare('INSERT OR IGNORE INTO default_rewards (name, cost) VALUES (?, ?)');
            defaultRewards.forEach(reward => {
                insertRewardTemplate.run(reward.name, reward.cost);
            });
            insertRewardTemplate.finalize((err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('預設模板資料插入完成');
                    resolve();
                }
            });
        });
    });
};

// 執行初始化
async function initializeDatabase() {
    try {
        await createTables();
        await createTemplateData();
        console.log('資料庫初始化完成！');
    } catch (error) {
        console.error('資料庫初始化失敗:', error);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('關閉資料庫連接時發生錯誤:', err.message);
            } else {
                console.log('資料庫連接已關閉');
            }
        });
    }
}

initializeDatabase();