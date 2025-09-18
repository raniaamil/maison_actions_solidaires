// lib/db.js
import pkg from 'pg';
const { Pool } = pkg;

const hasDbUrl = !!process.env.DATABASE_URL;

const config = hasDbUrl
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10, // nombre maximum de connexions dans le pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  : null;

// ⚠️ On n'initialise le pool que si DATABASE_URL est présent
let pool = null;

if (hasDbUrl) {
  pool = new Pool(config);

  // Test de connexion au démarrage : utile en dev, inutile (bruyant) en prod/serverless
  if (process.env.NODE_ENV !== 'production') {
    pool
      .connect()
      .then((client) => {
        console.log('✅ Connexion à PostgreSQL réussie');
        client.release();
      })
      .catch((err) => {
        console.error('❌ Erreur de connexion à PostgreSQL:', err.message);
      });
  }
} else {
  console.warn('⚠️ DATABASE_URL non défini — le pool Postgres ne sera pas initialisé.');
}

// Fonction helper pour les requêtes
export const query = async (text, params) => {
  if (!pool) {
    throw new Error(
      'DATABASE_URL manquant — impossible d’exécuter une requête Postgres (utilise ta DB locale MySQL OU définis DATABASE_URL).'
    );
  }
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

// Export par défaut : on garde une API compatible (db.query / db.connect)
const fallbackDb = {
  query: async () => {
    throw new Error(
      'DATABASE_URL manquant — db.query indisponible (route Postgres appelée sans config).'
    );
  },
  connect: async () => {
    throw new Error(
      'DATABASE_URL manquant — db.connect indisponible (route Postgres appelée sans config).'
    );
  },
};

export default pool || fallbackDb;
