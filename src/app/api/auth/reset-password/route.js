// src/app/api/auth/reset-password/route.js
export const runtime = 'nodejs';
import db, { query } from '../../../../lib/db';
import bcrypt from 'bcryptjs';
import { hashResetToken } from '../../../../lib/reset-token';

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

    // Vérifier le token dans la base de données - PostgreSQL (comparaison par empreinte SHA-256)
    const result = await query(`
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
      WHERE prt.token = $1 AND prt.used = false
    `, [hashResetToken(token.trim())]);

    if (result.rows.length === 0) {
      return Response.json(
        { error: 'Token de réinitialisation invalide ou déjà utilisé' },
        { status: 400 }
      );
    }

    const tokenData = result.rows[0];

    // Vérifier si le token a expiré
    const now = new Date();
    const expiryDate = new Date(tokenData.expires_at);
    
    if (now > expiryDate) {
      // Supprimer le token expiré
      await query(
        'DELETE FROM password_reset_tokens WHERE id = $1',
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

    // Hacher le nouveau mot de passe avant d'ouvrir la transaction (bcrypt est lent)
    const hashedPassword = await bcrypt.hash(password, 12);

    // 🔐 Transaction sur UN client dédié : `query()` prend un client différent du pool à
    // chaque appel, BEGIN/COMMIT n'y forment donc pas une vraie transaction.
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Marquer le token comme utilisé AVANT de changer le mot de passe, en une seule
      // requête conditionnelle : si deux requêtes arrivent en même temps avec le même
      // jeton, une seule obtient la ligne (usage unique), et l'expiration est revérifiée.
      const claimResult = await client.query(
        `UPDATE password_reset_tokens SET used = true
         WHERE id = $1 AND used = false AND expires_at > NOW()
         RETURNING id`,
        [tokenData.id]
      );

      if (claimResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return Response.json(
          { error: 'Token de réinitialisation invalide ou déjà utilisé' },
          { status: 400 }
        );
      }

      // Mettre à jour le mot de passe de l'utilisateur - PostgreSQL
      await client.query(
        'UPDATE users SET mot_de_passe = $1, date_modification = NOW() WHERE id = $2',
        [hashedPassword, tokenData.user_id]
      );

      // Supprimer tous les autres tokens de réinitialisation pour cet utilisateur
      await client.query(
        'DELETE FROM password_reset_tokens WHERE user_id = $1 AND id != $2',
        [tokenData.user_id, tokenData.id]
      );

      // Valider la transaction
      await client.query('COMMIT');

      console.log('✅ Mot de passe réinitialisé');

      // Aucune donnée du compte dans la réponse
      return Response.json({ success: true }, { status: 200 });

    } catch (updateError) {
      // Annuler la transaction en cas d'erreur
      await client.query('ROLLBACK').catch(() => {});
      throw updateError;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation du mot de passe:', error?.message);
    
    // Gestion des erreurs spécifiques PostgreSQL
    let errorMessage = 'Erreur serveur lors de la réinitialisation du mot de passe';
    let statusCode = 500;
    
    if (error.code === '42P01') { // Relation does not exist
      errorMessage = 'Service de réinitialisation non configuré';
    } else if (error.code === '23505') { // Unique violation
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