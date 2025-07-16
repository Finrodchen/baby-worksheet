import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// 使用環境變數或預設路徑
const dbPath = process.env.DB_PATH || join(__dirname, 'data', 'database.sqlite');
const dataDir = dirname(dbPath);

// Debug 模式控制
const DEBUG_MODE = process.env.NODE_ENV !== 'production';

if (DEBUG_MODE) {
    console.log('🔍 [INIT DEBUG] 資料庫路徑:', dbPath);
    console.log('🔍 [INIT DEBUG] 資料目錄:', dataDir);
}

// 確保資料目錄存在
if (!fs.existsSync(dataDir)) {
    if (DEBUG_MODE) console.log('🔍 [INIT DEBUG] 資料目錄不存在，正在創建:', dataDir);
    fs.mkdirSync(dataDir, { recursive: true });
    if (DEBUG_MODE) console.log('🔍 [INIT DEBUG] 資料目錄創建成功');
} else {
    if (DEBUG_MODE) console.log('🔍 [INIT DEBUG] 資料目錄已存在');
}

const app = express();
const PORT = process.env.PORT || 3001;

// 中間件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// 檢查資料庫是否存在
if (!fs.existsSync(dbPath)) {
    if (DEBUG_MODE) console.log('🔍 [INIT DEBUG] 資料庫文件不存在，將在連接時創建:', dbPath);
} else {
    if (DEBUG_MODE) console.log('🔍 [INIT DEBUG] 資料庫文件已存在:', dbPath);
}

// 創建資料庫連接
if (DEBUG_MODE) console.log('🔍 [INIT DEBUG] 嘗試連接資料庫...');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('無法連接到資料庫:', err.message);
        if (DEBUG_MODE) {
            console.error('🔍 [INIT DEBUG] 錯誤代碼:', err.code);
            console.error('🔍 [INIT DEBUG] 資料庫路徑:', dbPath);
            console.error('🔍 [INIT DEBUG] 目錄權限檢查...');
            
            try {
                fs.accessSync(dataDir, fs.constants.W_OK);
                console.log('🔍 [INIT DEBUG] 目錄有寫入權限');
            } catch (accessErr) {
                console.error('🔍 [INIT DEBUG] 目錄沒有寫入權限:', accessErr.message);
            }
        }
        process.exit(1);
    }
    console.log('已連接到 SQLite 資料庫');
    if (DEBUG_MODE) console.log('🔍 [INIT DEBUG] 資料庫連接成功，路徑:', dbPath);
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
    if (DEBUG_MODE) {
        console.log('🔍 [SERVER DEBUG] 收到新增孩子請求');
        console.log('🔍 [SERVER DEBUG] 請求體:', req.body);
    }
    
    const { id, name } = req.body;
    
    if (!id || !name) {
        if (DEBUG_MODE) console.error('🔍 [SERVER DEBUG] 缺少必要參數: id或name');
        res.status(400).json({ error: '缺少必要參數: id和name' });
        return;
    }
    
    if (DEBUG_MODE) {
        console.log('🔍 [SERVER DEBUG] 開始執行SQL插入操作...');
        console.log('🔍 [SERVER DEBUG] 參數 - ID:', id, 'Name:', name);
    }
    
    db.run(
        'INSERT OR REPLACE INTO children (id, name, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [id, name],
        function(err) {
            if (err) {
                console.error('保存孩子資料失敗:', err.message);
                if (DEBUG_MODE) {
                    console.error('🔍 [SERVER DEBUG] SQL執行錯誤:', err);
                    console.error('🔍 [SERVER DEBUG] 錯誤詳情:', err.message);
                }
                res.status(500).json({ error: err.message });
                return;
            }
            
            if (DEBUG_MODE) {
                console.log('🔍 [SERVER DEBUG] SQL執行成功');
                console.log('🔍 [SERVER DEBUG] 影響的行數:', this.changes);
                console.log('🔍 [SERVER DEBUG] 最後插入的行ID:', this.lastID);
            }
            
            const response = { id, name, message: '孩子資料保存成功' };
            if (DEBUG_MODE) console.log('🔍 [SERVER DEBUG] 返回響應:', response);
            res.json(response);
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

// 資料庫診斷函數
function debugDatabase() {
    console.log('🔍 [DB DIAGNOSTIC] 開始資料庫診斷...');
    
    // 檢查資料庫文件是否存在
    console.log('🔍 [DB DIAGNOSTIC] 資料庫路徑:', dbPath);
    console.log('🔍 [DB DIAGNOSTIC] 資料庫文件是否存在:', fs.existsSync(dbPath));
    
    if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        console.log('🔍 [DB DIAGNOSTIC] 資料庫文件大小:', stats.size, 'bytes');
        console.log('🔍 [DB DIAGNOSTIC] 資料庫文件修改時間:', stats.mtime);
    }
    
    // 檢查表結構
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
            console.error('🔍 [DB DIAGNOSTIC] 查詢表結構失敗:', err);
        } else {
            console.log('🔍 [DB DIAGNOSTIC] 資料庫中的表:', tables.map(t => t.name));
            
            // 檢查 children 表的結構
            db.all("PRAGMA table_info(children)", (err, columns) => {
                if (err) {
                    console.error('🔍 [DB DIAGNOSTIC] 查詢 children 表結構失敗:', err);
                } else {
                    console.log('🔍 [DB DIAGNOSTIC] children 表結構:', columns);
                }
            });
            
            // 檢查現有的孩子數據
            db.all("SELECT * FROM children", (err, children) => {
                if (err) {
                    console.error('🔍 [DB DIAGNOSTIC] 查詢 children 數據失敗:', err);
                } else {
                    console.log('🔍 [DB DIAGNOSTIC] 現有孩子數據:', children);
                }
            });
        }
    });
}

// 啟動服務器
app.listen(PORT, () => {
    console.log(`服務器運行在 http://localhost:${PORT}`);
    
    // 延遲執行資料庫診斷，確保資料庫已初始化
    setTimeout(debugDatabase, 1000);
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