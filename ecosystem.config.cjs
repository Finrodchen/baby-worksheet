module.exports = {
  apps: [{
    name: 'baby-worksheet',
    script: 'server.js',
    pmx: false,
    disable_logs: false,
    merge_logs: true,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PM2_DISABLE_LOGS: 'false'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      DB_PATH: './data/database.sqlite',
      PM2_DISABLE_LOGS: 'false'
    }
  }]
};