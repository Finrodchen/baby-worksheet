module.exports = {
  apps: [{
    name: 'baby-worksheet',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      DB_PATH: './data/database.sqlite'
    }
  }]
};