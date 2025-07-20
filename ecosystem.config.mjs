export default {
  apps: [{
    name: 'baby-worksheet',
    script: 'server.js',
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