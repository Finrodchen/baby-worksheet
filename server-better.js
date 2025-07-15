import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { db, initializeDatabase } from './db-better.js';

const app = express();
const PORT = process.env.PORT || 3001;

// 健康檢查端點
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'better-sqlite3'
    });
});

// 中間件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 靜態文件服務
app.use(express.static('.'));

// 初始化資料庫
try {
    initializeDatabase();
} catch (error) {
    console.error('資料庫初始化失敗:', error);
    process.exit(1);
}

// API 路由

// 獲取所有孩子
app.get('/api/children', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM children ORDER BY created_at');
        const children = stmt.all();
        res.json(children);
    } catch (error) {
        console.error('獲取孩子列表失敗:', error);
        res.status(500).json({ error: '獲取孩子列表失敗' });
    }
});

// 獲取特定孩子
app.get('/api/children/:id', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM children WHERE id = ?');
        const child = stmt.get(req.params.id);
        if (child) {
            res.json(child);
        } else {
            res.status(404).json({ error: '找不到該孩子' });
        }
    } catch (error) {
        console.error('獲取孩子資料失敗:', error);
        res.status(500).json({ error: '獲取孩子資料失敗' });
    }
});

// 新增/更新孩子
app.post('/api/children', (req, res) => {
    try {
        const { id, name } = req.body;
        const stmt = db.prepare('INSERT OR REPLACE INTO children (id, name) VALUES (?, ?)');
        stmt.run(id, name);
        res.json({ success: true, message: '孩子資料保存成功' });
    } catch (error) {
        console.error('保存孩子資料失敗:', error);
        res.status(500).json({ error: '保存孩子資料失敗' });
    }
});

// 刪除孩子
app.delete('/api/children/:id', (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM children WHERE id = ?');
        const result = stmt.run(req.params.id);
        if (result.changes > 0) {
            res.json({ success: true, message: '孩子資料刪除成功' });
        } else {
            res.status(404).json({ error: '找不到該孩子' });
        }
    } catch (error) {
        console.error('刪除孩子資料失敗:', error);
        res.status(500).json({ error: '刪除孩子資料失敗' });
    }
});

// 獲取作息表
app.get('/api/children/:id/schedules', (req, res) => {
    try {
        const stmt = db.prepare('SELECT time, activity, note FROM schedules WHERE child_id = ? ORDER BY time');
        const schedules = stmt.all(req.params.id);
        res.json(schedules);
    } catch (error) {
        console.error('獲取作息表失敗:', error);
        res.status(500).json({ error: '獲取作息表失敗' });
    }
});

// 保存作息表
app.post('/api/children/:id/schedules', (req, res) => {
    try {
        const childId = req.params.id;
        const schedules = req.body;
        
        // 刪除舊的作息表
        const deleteStmt = db.prepare('DELETE FROM schedules WHERE child_id = ?');
        deleteStmt.run(childId);
        
        // 插入新的作息表
        const insertStmt = db.prepare('INSERT INTO schedules (child_id, time, activity, note) VALUES (?, ?, ?, ?)');
        schedules.forEach(schedule => {
            insertStmt.run(childId, schedule.time, schedule.activity, schedule.note || '');
        });
        
        res.json({ success: true, message: '作息表保存成功' });
    } catch (error) {
        console.error('保存作息表失敗:', error);
        res.status(500).json({ error: '保存作息表失敗' });
    }
});

// 獲取積分任務
app.get('/api/children/:id/points-tasks', (req, res) => {
    try {
        const stmt = db.prepare('SELECT task, points FROM points_tasks WHERE child_id = ?');
        const tasks = stmt.all(req.params.id);
        res.json(tasks);
    } catch (error) {
        console.error('獲取積分任務失敗:', error);
        res.status(500).json({ error: '獲取積分任務失敗' });
    }
});

// 保存積分任務
app.post('/api/children/:id/points-tasks', (req, res) => {
    try {
        const childId = req.params.id;
        const tasks = req.body;
        
        // 刪除舊的積分任務
        const deleteStmt = db.prepare('DELETE FROM points_tasks WHERE child_id = ?');
        deleteStmt.run(childId);
        
        // 插入新的積分任務
        const insertStmt = db.prepare('INSERT INTO points_tasks (child_id, task, points) VALUES (?, ?, ?)');
        tasks.forEach(task => {
            insertStmt.run(childId, task.task, task.points);
        });
        
        res.json({ success: true, message: '積分任務保存成功' });
    } catch (error) {
        console.error('保存積分任務失敗:', error);
        res.status(500).json({ error: '保存積分任務失敗' });
    }
});

// 獲取獎勵項目
app.get('/api/children/:id/rewards', (req, res) => {
    try {
        const stmt = db.prepare('SELECT item, cost FROM rewards WHERE child_id = ?');
        const rewards = stmt.all(req.params.id);
        res.json(rewards);
    } catch (error) {
        console.error('獲取獎勵項目失敗:', error);
        res.status(500).json({ error: '獲取獎勵項目失敗' });
    }
});

// 保存獎勵項目
app.post('/api/children/:id/rewards', (req, res) => {
    try {
        const childId = req.params.id;
        const { rewards } = req.body;
        
        // 刪除舊的獎勵項目
        const deleteStmt = db.prepare('DELETE FROM rewards WHERE child_id = ?');
        deleteStmt.run(childId);
        
        // 插入新的獎勵項目
        const insertStmt = db.prepare('INSERT INTO rewards (child_id, item, cost) VALUES (?, ?, ?)');
        rewards.forEach(reward => {
            insertStmt.run(childId, reward.item, reward.cost);
        });
        
        res.json({ success: true, message: '獎勵項目保存成功' });
    } catch (error) {
        console.error('保存獎勵項目失敗:', error);
        res.status(500).json({ error: '保存獎勵項目失敗' });
    }
});

// 獲取每日記錄
app.get('/api/children/:id/daily-records/:date', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM daily_records WHERE child_id = ? AND date = ?');
        const record = stmt.get(req.params.id, req.params.date);
        
        if (record) {
            // 解析 JSON 字段
            record.schedule = record.schedule ? JSON.parse(record.schedule) : {};
            record.points_tasks = record.points_tasks ? JSON.parse(record.points_tasks) : {};
            record.rewards = record.rewards ? JSON.parse(record.rewards) : {};
        }
        
        res.json(record || {
            childId: req.params.id,
            date: req.params.date,
            schedule: {},
            points_tasks: {},
            rewards: {},
            total_points: 0
        });
    } catch (error) {
        console.error('獲取每日記錄失敗:', error);
        res.status(500).json({ error: '獲取每日記錄失敗' });
    }
});

// 保存每日記錄
app.post('/api/children/:id/daily-records', (req, res) => {
    try {
        const record = req.body;
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO daily_records 
            (child_id, date, schedule, points_tasks, rewards, total_points) 
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
            record.childId,
            record.date,
            JSON.stringify(record.schedule || {}),
            JSON.stringify(record.points_tasks || {}),
            JSON.stringify(record.rewards || {}),
            record.total_points || 0
        );
        
        res.json({ success: true, message: '每日記錄保存成功' });
    } catch (error) {
        console.error('保存每日記錄失敗:', error);
        res.status(500).json({ error: '保存每日記錄失敗' });
    }
});

// 獲取所有每日記錄
app.get('/api/children/:id/daily-records', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM daily_records WHERE child_id = ? ORDER BY date DESC');
        const records = stmt.all(req.params.id);
        
        // 解析 JSON 字段
        records.forEach(record => {
            record.schedule = record.schedule ? JSON.parse(record.schedule) : {};
            record.points_tasks = record.points_tasks ? JSON.parse(record.points_tasks) : {};
            record.rewards = record.rewards ? JSON.parse(record.rewards) : {};
        });
        
        res.json(records);
    } catch (error) {
        console.error('獲取每日記錄失敗:', error);
        res.status(500).json({ error: '獲取每日記錄失敗' });
    }
});

// 計算孩子總積分
app.get('/api/children/:id/total-points', (req, res) => {
    try {
        const stmt = db.prepare('SELECT SUM(total_points) as total FROM daily_records WHERE child_id = ?');
        const result = stmt.get(req.params.id);
        res.json({ total_points: result.total || 0 });
    } catch (error) {
        console.error('計算總積分失敗:', error);
        res.status(500).json({ error: '計算總積分失敗' });
    }
});

// 匯出所有資料
app.get('/api/export', (req, res) => {
    try {
        const children = db.prepare('SELECT * FROM children').all();
        const schedules = db.prepare('SELECT * FROM schedules').all();
        const pointsTasks = db.prepare('SELECT * FROM points_tasks').all();
        const rewards = db.prepare('SELECT * FROM rewards').all();
        const dailyRecords = db.prepare('SELECT * FROM daily_records').all();
        
        // 解析每日記錄的 JSON 字段
        dailyRecords.forEach(record => {
            record.schedule = record.schedule ? JSON.parse(record.schedule) : {};
            record.points_tasks = record.points_tasks ? JSON.parse(record.points_tasks) : {};
            record.rewards = record.rewards ? JSON.parse(record.rewards) : {};
        });
        
        const exportData = {
            children,
            schedules,
            pointsTasks,
            rewards,
            dailyRecords,
            exportDate: new Date().toISOString()
        };
        
        res.json(exportData);
    } catch (error) {
        console.error('匯出資料失敗:', error);
        res.status(500).json({ error: '匯出資料失敗' });
    }
});

// 獲取預設模板 - 作息表
app.get('/api/templates/schedules', (req, res) => {
    try {
        const stmt = db.prepare('SELECT time, activity, note FROM default_schedules ORDER BY time');
        const schedules = stmt.all();
        res.json(schedules);
    } catch (error) {
        console.error('獲取預設作息表模板失敗:', error);
        res.status(500).json({ error: '獲取預設作息表模板失敗' });
    }
});

// 獲取預設模板 - 積分任務
app.get('/api/templates/points-tasks', (req, res) => {
    try {
        const stmt = db.prepare('SELECT task, points FROM default_points_tasks');
        const tasks = stmt.all();
        res.json(tasks);
    } catch (error) {
        console.error('獲取預設積分任務模板失敗:', error);
        res.status(500).json({ error: '獲取預設積分任務模板失敗' });
    }
});

// 獲取預設模板 - 獎勵項目
app.get('/api/templates/rewards', (req, res) => {
    try {
        const stmt = db.prepare('SELECT item, cost FROM default_rewards');
        const rewards = stmt.all();
        res.json(rewards);
    } catch (error) {
        console.error('獲取預設獎勵項目模板失敗:', error);
        res.status(500).json({ error: '獲取預設獎勵項目模板失敗' });
    }
});

// 啟動服務器
app.listen(PORT, '0.0.0.0', () => {
    console.log(`服務器運行在端口 ${PORT} (使用 better-sqlite3)`);
});

// 優雅關閉
process.on('SIGINT', () => {
    console.log('\n正在關閉服務器...');
    db.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n正在關閉服務器...');
    db.close();
    process.exit(0);
});