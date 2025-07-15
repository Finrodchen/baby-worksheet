import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'database.sqlite');

const app = express();
const PORT = process.env.PORT || 3001;

// 健康檢查端點
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 中間件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// 檢查資料庫是否存在，如果不存在則創建
if (!fs.existsSync(dbPath)) {
    console.log('資料庫不存在，正在創建...');
    // 這裡可以執行初始化腳本
}

// 創建資料庫連接
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('無法連接到資料庫:', err.message);
        process.exit(1);
    }
    console.log('已連接到 SQLite 資料庫');
});

// API 路由

// 獲取所有孩子
app.get('/api/children', (req, res) => {
    db.all('SELECT * FROM children ORDER BY created_at', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 獲取指定孩子
app.get('/api/children/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM children WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: '找不到指定的孩子' });
            return;
        }
        res.json(row);
    });
});

// 新增或更新孩子
app.post('/api/children', (req, res) => {
    const { id, name } = req.body;
    
    db.run(
        'INSERT OR REPLACE INTO children (id, name, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [id, name],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id, name, message: '孩子資料保存成功' });
        }
    );
});

// 刪除孩子
app.delete('/api/children/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM children WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: '找不到指定的孩子' });
            return;
        }
        res.json({ message: '孩子資料刪除成功' });
    });
});

// 獲取孩子的作息表
app.get('/api/children/:id/schedules', (req, res) => {
    const { id } = req.params;
    
    db.all(
        'SELECT * FROM schedules WHERE child_id = ? ORDER BY id',
        [id],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        }
    );
});

// 保存孩子的作息表
app.post('/api/children/:id/schedules', (req, res) => {
    const { id } = req.params;
    const { schedules } = req.body;
    
    db.serialize(() => {
        // 先刪除該孩子的所有作息表
        db.run('DELETE FROM schedules WHERE child_id = ?', [id]);
        
        // 插入新的作息表
        const stmt = db.prepare('INSERT INTO schedules (child_id, time, activity, note) VALUES (?, ?, ?, ?)');
        
        schedules.forEach(schedule => {
            stmt.run(id, schedule.time, schedule.activity, schedule.note);
        });
        
        stmt.finalize((err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: '作息表保存成功' });
        });
    });
});

// 獲取孩子的積分項目
app.get('/api/children/:id/points-tasks', (req, res) => {
    const { id } = req.params;
    
    db.all(
        'SELECT * FROM points_tasks WHERE child_id = ? ORDER BY id',
        [id],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        }
    );
});

// 保存孩子的積分項目
app.post('/api/children/:id/points-tasks', (req, res) => {
    const { id } = req.params;
    const { pointsTasks } = req.body;
    
    db.serialize(() => {
        // 先刪除該孩子的所有積分項目
        db.run('DELETE FROM points_tasks WHERE child_id = ?', [id]);
        
        // 插入新的積分項目
        const stmt = db.prepare('INSERT INTO points_tasks (child_id, name, points) VALUES (?, ?, ?)');
        
        pointsTasks.forEach(task => {
            stmt.run(id, task.name, task.points);
        });
        
        stmt.finalize((err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: '積分項目保存成功' });
        });
    });
});

// 獲取孩子的獎勵項目
app.get('/api/children/:id/rewards', (req, res) => {
    const { id } = req.params;
    
    db.all(
        'SELECT * FROM rewards WHERE child_id = ? ORDER BY id',
        [id],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        }
    );
});

// 保存孩子的獎勵項目
app.post('/api/children/:id/rewards', (req, res) => {
    const { id } = req.params;
    const { rewards } = req.body;
    
    db.serialize(() => {
        // 先刪除該孩子的所有獎勵項目
        db.run('DELETE FROM rewards WHERE child_id = ?', [id]);
        
        // 插入新的獎勵項目
        const stmt = db.prepare('INSERT INTO rewards (child_id, name, cost) VALUES (?, ?, ?)');
        
        rewards.forEach(reward => {
            stmt.run(id, reward.name, reward.cost);
        });
        
        stmt.finalize((err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: '獎勵項目保存成功' });
        });
    });
});

// 獲取孩子的每日記錄
app.get('/api/children/:id/daily-records/:date', (req, res) => {
    const { id, date } = req.params;
    
    db.get(
        'SELECT * FROM daily_records WHERE child_id = ? AND date = ?',
        [id, date],
        (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            if (!row) {
                // 如果沒有記錄，返回空的記錄結構
                res.json({
                    childId: id,
                    date: date,
                    schedule: {},
                    tasks: {},
                    rewards: []
                });
                return;
            }
            
            // 解析 JSON 資料
            const record = {
                id: row.id,
                childId: row.child_id,
                date: row.date,
                schedule: row.schedule_data ? JSON.parse(row.schedule_data) : {},
                tasks: row.tasks_data ? JSON.parse(row.tasks_data) : {},
                rewards: row.rewards_data ? JSON.parse(row.rewards_data) : []
            };
            
            res.json(record);
        }
    );
});

// 保存孩子的每日記錄
app.post('/api/children/:id/daily-records', (req, res) => {
    const { id } = req.params;
    const { date, schedule, tasks, rewards } = req.body;
    
    const scheduleData = JSON.stringify(schedule || {});
    const tasksData = JSON.stringify(tasks || {});
    const rewardsData = JSON.stringify(rewards || []);
    
    db.run(
        `INSERT OR REPLACE INTO daily_records 
         (child_id, date, schedule_data, tasks_data, rewards_data, updated_at) 
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [id, date, scheduleData, tasksData, rewardsData],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: '每日記錄保存成功' });
        }
    );
});

// 獲取孩子的所有每日記錄
app.get('/api/children/:id/daily-records', (req, res) => {
    const { id } = req.params;
    
    db.all(
        'SELECT * FROM daily_records WHERE child_id = ? ORDER BY date DESC',
        [id],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            const records = rows.map(row => ({
                id: row.id,
                childId: row.child_id,
                date: row.date,
                schedule: row.schedule_data ? JSON.parse(row.schedule_data) : {},
                tasks: row.tasks_data ? JSON.parse(row.tasks_data) : {},
                rewards: row.rewards_data ? JSON.parse(row.rewards_data) : []
            }));
            
            res.json(records);
        }
    );
});

// 計算孩子的總積分
app.get('/api/children/:id/total-points', async (req, res) => {
    const { id } = req.params;
    
    try {
        // 獲取所有每日記錄
        const dailyRecords = await new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM daily_records WHERE child_id = ?',
                [id],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
        
        // 獲取積分項目
        const pointsTasks = await new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM points_tasks WHERE child_id = ?',
                [id],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
        
        let totalPoints = 0;
        
        // 計算所有完成任務的積分
        dailyRecords.forEach(record => {
            if (record.tasks_data) {
                const tasks = JSON.parse(record.tasks_data);
                Object.keys(tasks).forEach(taskIndex => {
                    if (tasks[taskIndex] && pointsTasks[taskIndex]) {
                        totalPoints += pointsTasks[taskIndex].points;
                    }
                });
            }
            
            // 減去兌換獎勵的積分
            if (record.rewards_data) {
                const rewards = JSON.parse(record.rewards_data);
                rewards.forEach(reward => {
                    totalPoints -= reward.cost;
                });
            }
        });
        
        res.json({ totalPoints });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 獲取預設作息表模板
app.get('/api/templates/schedules', (req, res) => {
    db.all('SELECT * FROM default_schedules ORDER BY id', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 獲取預設積分項目模板
app.get('/api/templates/points-tasks', (req, res) => {
    db.all('SELECT * FROM default_points_tasks ORDER BY id', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 獲取預設獎勵項目模板
app.get('/api/templates/rewards', (req, res) => {
    db.all('SELECT * FROM default_rewards ORDER BY id', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 匯出所有資料
app.get('/api/export', async (req, res) => {
    try {
        const children = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM children', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        const exportData = {};
        
        for (const child of children) {
            const childId = child.id;
            
            // 獲取各種資料
            const [schedules, pointsTasks, rewards, dailyRecords] = await Promise.all([
                new Promise((resolve, reject) => {
                    db.all('SELECT * FROM schedules WHERE child_id = ?', [childId], (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    });
                }),
                new Promise((resolve, reject) => {
                    db.all('SELECT * FROM points_tasks WHERE child_id = ?', [childId], (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    });
                }),
                new Promise((resolve, reject) => {
                    db.all('SELECT * FROM rewards WHERE child_id = ?', [childId], (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    });
                }),
                new Promise((resolve, reject) => {
                    db.all('SELECT * FROM daily_records WHERE child_id = ?', [childId], (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows.map(row => ({
                            date: row.date,
                            schedule: row.schedule_data ? JSON.parse(row.schedule_data) : {},
                            tasks: row.tasks_data ? JSON.parse(row.tasks_data) : {},
                            rewards: row.rewards_data ? JSON.parse(row.rewards_data) : []
                        })));
                    });
                })
            ]);
            
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
                    }, {})
                }
            };
        }
        
        res.json(exportData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 啟動服務器
app.listen(PORT, '0.0.0.0', () => {
    console.log(`服務器運行在端口 ${PORT}`);
});

// 優雅關閉
process.on('SIGINT', () => {
    console.log('\n正在關閉服務器...');
    db.close((err) => {
        if (err) {
            console.error('關閉資料庫連接時發生錯誤:', err.message);
        } else {
            console.log('資料庫連接已關閉');
        }
        process.exit(0);
    });
});