// lib/db.js
import mysql from 'mysql2/promise';

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'maison_actions_solidaires',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  charset: 'utf8mb4',
  debug: process.env.NODE_ENV === 'development',
  multipleStatements: false
};

const pool = mysql.createPool(config);

// Test de connexion au démarrage
pool.getConnection()
  .then(connection => {
    console.log('✅ Connexion à la base de données réussie');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Erreur de connexion à la base de données:', err.message);
  });

export default pool;