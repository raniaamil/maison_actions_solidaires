// src/app/api/auth/verify-reset-token/route.js
export const runtime = 'nodejs';
import db from '../../../../lib/db';

export async function POST(request) {
  try {
    const { token } = await request.json();

    // Validation du token
    if (!token || !token.trim()) {
      return Response.json(
        { error: 'Token de réinitialisation requis' },
        { status: 400 }
      );
    }

    // Vérifier le token dans la base de données
    const [tokens] = await db.execute(`
      SELECT 
        prt.id, 
        prt.user_id, 
        prt.expires_at, 
        prt.used,
        u.email, 
        u.prenom, 
        u.nom,
        u.actif
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.id
      WHERE prt.token = ? AND prt.used = FALSE
    `, [token.trim()]);

    if (tokens.length === 0) {
      return Response.json(
        { error: 'Token de réinitialisation invalide ou déjà utilisé' },
        { status: 400 }
      );
    }

    const tokenData = tokens[0];

    // Vérifier si le token a expiré
    const now = new Date();
    const expiryDate = new Date(tokenData.expires_at);
    
    if (now > expiryDate) {
      // Supprimer le token expiré
      await db.execute(
        'DELETE FROM password_reset_tokens WHERE id = ?',
        [tokenData.id]
      );
      
      return Response.json(
        { error: 'Token de réinitialisation expiré' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur est toujours actif
    if (!tokenData.actif) {
      return Response.json(
        { error: 'Compte utilisateur désactivé' },
        { status: 400 }
      );
    }

    // Token valide
    return Response.json(
      { 
        message: 'Token valide',
        user: {
          email: tokenData.email,
          prenom: tokenData.prenom,
          nom: tokenData.nom
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Erreur lors de la vérification du token:', error);
    return Response.json(
      { 
        error: 'Erreur serveur lors de la vérification du token',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}