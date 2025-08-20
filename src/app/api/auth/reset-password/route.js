// src/app/api/auth/reset-password/route.js
export const runtime = 'nodejs';
import db from '../../../../lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { token, password } = await request.json();

    // Validation des données
    if (!token || !token.trim()) {
      return Response.json(
        { error: 'Token de réinitialisation requis' },
        { status: 400 }
      );
    }

    if (!password || !password.trim()) {
      return Response.json(
        { error: 'Nouveau mot de passe requis' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
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

    try {
      // Démarrer une transaction
      await db.query('START TRANSACTION');

      // Hacher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(password, 12);

      // Mettre à jour le mot de passe de l'utilisateur
      await db.execute(
        'UPDATE users SET mot_de_passe = ?, date_modification = NOW() WHERE id = ?',
        [hashedPassword, tokenData.user_id]
      );

      // Marquer le token comme utilisé
      await db.execute(
        'UPDATE password_reset_tokens SET used = TRUE WHERE id = ?',
        [tokenData.id]
      );

      // Supprimer tous les autres tokens de réinitialisation pour cet utilisateur
      await db.execute(
        'DELETE FROM password_reset_tokens WHERE user_id = ? AND id != ?',
        [tokenData.user_id, tokenData.id]
      );

      // Valider la transaction
      await db.query('COMMIT');

      console.log(`✅ Mot de passe réinitialisé pour l'utilisateur: ${tokenData.email}`);

      return Response.json(
        { 
          message: 'Mot de passe réinitialisé avec succès',
          user: {
            email: tokenData.email,
            prenom: tokenData.prenom,
            nom: tokenData.nom
          }
        },
        { status: 200 }
      );

    } catch (updateError) {
      // Annuler la transaction en cas d'erreur
      await db.query('ROLLBACK');
      throw updateError;
    }

  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation du mot de passe:', error);
    
    // Gestion des erreurs spécifiques
    let errorMessage = 'Erreur serveur lors de la réinitialisation du mot de passe';
    let statusCode = 500;
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      errorMessage = 'Service de réinitialisation non configuré';
    } else if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'Conflit lors de la mise à jour';
    }
    
    return Response.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: statusCode }
    );
  }
}