// src/app/api/test-db/route.js
export const runtime = 'nodejs';
import db from '../../../../lib/db';

export async function GET() {
  try {
    const [rows] = await db.execute('SELECT 1 AS test, NOW() AS now_time');
    return Response.json({
      success: true,
      message: 'Connexion à la base de données réussie !',
      data: rows,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erreur de connexion à la base de données:', error);
    return Response.json(
      { success: false, error: error.message, code: error.code || 'UNKNOWN_ERROR' },
      { status: 500 }
    );
  }
}
