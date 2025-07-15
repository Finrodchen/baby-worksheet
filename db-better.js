import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'database.sqlite');
let db;

try {
    db = new Database(dbPath);
    console.log('已連接到 SQLite 資料庫 (better-sqlite3)');
} catch (error) {
    console.error('資料庫連接失敗:', error);
    process.exit(1);
}

// 創建資料表
function createTables() {
    const tables = [
        `CREATE TABLE IF NOT EXISTS children (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            child_id TEXT NOT NULL,
            time TEXT NOT NULL,
            activity TEXT NOT NULL,
            note TEXT,
            FOREIGN KEY (child_id) REFERENCES children (id) ON DELETE CASCADE
        )`,
        
        `CREATE TABLE IF NOT EXISTS points_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            child_id TEXT NOT NULL,
            task TEXT NOT NULL,
            points INTEGER NOT NULL,
            FOREIGN KEY (child_id) REFERENCES children (id) ON DELETE CASCADE
        )`,
        
        `CREATE TABLE IF NOT EXISTS rewards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            child_id TEXT NOT NULL,
            item TEXT NOT NULL,
            cost INTEGER NOT NULL,
            FOREIGN KEY (child_id) REFERENCES children (id) ON DELETE CASCADE
        )`,
        
        `CREATE TABLE IF NOT EXISTS daily_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            child_id TEXT NOT NULL,
            date TEXT NOT NULL,
            schedule TEXT,
            points_tasks TEXT,
            rewards TEXT,
            total_points INTEGER DEFAULT 0,
            UNIQUE(child_id, date),
            FOREIGN KEY (child_id) REFERENCES children (id) ON DELETE CASCADE
        )`,
        
        `CREATE TABLE IF NOT EXISTS default_schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            time TEXT NOT NULL,
            activity TEXT NOT NULL,
            note TEXT
        )`,
        
        `CREATE TABLE IF NOT EXISTS default_points_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task TEXT NOT NULL,
            points INTEGER NOT NULL
        )`,
        
        `CREATE TABLE IF NOT EXISTS default_rewards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item TEXT NOT NULL,
            cost INTEGER NOT NULL
        )`
    ];
    
    tables.forEach(sql => {
        try {
            db.exec(sql);
        } catch (error) {
            console.error('創建資料表失敗:', error);
        }
    });
    
    console.log('所有資料表創建完成');
}

// 插入預設模板資料
function createTemplateData() {
    // 預設作息表模板
    const defaultSchedules = [
        { time: '07:00', activity: '起床', note: '早起的鳥兒有蟲吃' },
        { time: '07:30', activity: '刷牙洗臉', note: '保持清潔很重要' },
        { time: '08:00', activity: '吃早餐', note: '營養豐富的早餐' },
        { time: '09:00', activity: '學習時間', note: '專心學習30分鐘' },
        { time: '10:00', activity: '戶外活動', note: '到公園玩耍' },
        { time: '12:00', activity: '吃午餐', note: '均衡飲食' },
        { time: '13:00', activity: '午休', note: '休息一下' },
        { time: '15:00', activity: '點心時間', note: '健康小點心' },
        { time: '16:00', activity: '自由玩耍', note: '發揮創意' },
        { time: '18:00', activity: '吃晚餐', note: '家人一起用餐' },
        { time: '19:00', activity: '洗澡', note: '保持身體清潔' },
        { time: '20:00', activity: '睡前故事', note: '親子共讀時光' },
        { time: '21:00', activity: '睡覺', note: '充足睡眠很重要' }
    ];
    
    // 預設積分任務模板
    const defaultPointsTasks = [
        { task: '自己刷牙', points: 5 },
        { task: '整理玩具', points: 10 },
        { task: '幫忙做家事', points: 15 },
        { task: '完成作業', points: 20 },
        { task: '主動分享', points: 10 },
        { task: '禮貌用語', points: 5 },
        { task: '早睡早起', points: 10 },
        { task: '吃完飯菜', points: 10 },
        { task: '運動30分鐘', points: 15 },
        { task: '閱讀書籍', points: 15 }
    ];
    
    // 預設獎勵項目模板
    const defaultRewards = [
        { item: '貼紙一張', cost: 10 },
        { item: '額外遊戲時間15分鐘', cost: 20 },
        { item: '選擇今天的點心', cost: 30 },
        { item: '小玩具', cost: 50 },
        { item: '去公園玩', cost: 60 },
        { item: '看卡通30分鐘', cost: 40 },
        { item: '和朋友玩耍', cost: 70 },
        { item: '選擇晚餐菜色', cost: 80 },
        { item: '新書一本', cost: 100 },
        { item: '特別的一日遊', cost: 200 }
    ];
    
    // 插入預設作息表
    const insertSchedule = db.prepare('INSERT OR IGNORE INTO default_schedules (time, activity, note) VALUES (?, ?, ?)');
    defaultSchedules.forEach(schedule => {
        insertSchedule.run(schedule.time, schedule.activity, schedule.note);
    });
    
    // 插入預設積分任務
    const insertPointsTask = db.prepare('INSERT OR IGNORE INTO default_points_tasks (task, points) VALUES (?, ?)');
    defaultPointsTasks.forEach(task => {
        insertPointsTask.run(task.task, task.points);
    });
    
    // 插入預設獎勵項目
    const insertReward = db.prepare('INSERT OR IGNORE INTO default_rewards (item, cost) VALUES (?, ?)');
    defaultRewards.forEach(reward => {
        insertReward.run(reward.item, reward.cost);
    });
    
    console.log('預設模板資料插入完成');
}

// 初始化資料庫
function initializeDatabase() {
    try {
        createTables();
        createTemplateData();
        console.log('資料庫初始化完成！');
    } catch (error) {
        console.error('資料庫初始化失敗:', error);
        throw error;
    }
}

// 導出資料庫實例和初始化函數
export { db, initializeDatabase };
export default db;