export const runtime = 'nodejs';
import { query } from '../../../lib/db';

export async function GET() {
  try {
    const result = await query('SELECT 1 AS test, NOW() AS now_time');
    return Response.json({
      success: true,
      message: 'Connexion à la base de données réussie !',
      data: result.rows,
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