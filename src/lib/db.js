// lib/db.js
import pkg from 'pg';
const { Pool } = pkg;

const config = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10, // nombre maximum de connexions dans le pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(config);

// Test de connexion au démarrage
pool.connect()
  .then(client => {
    console.log('✅ Connexion à PostgreSQL réussie');
    client.release();
  })
  .catch(err => {
    console.error('❌ Erreur de connexion à PostgreSQL:', err.message);
  });

// Fonction helper pour les requêtes
export const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

export default pool;