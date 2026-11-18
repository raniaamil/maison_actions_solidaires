// src/lib/reset-token.js — Jetons de (ré)initialisation de mot de passe (runtime Node.js)
//
// Le jeton en clair n'existe que dans le lien envoyé par e-mail. La base ne stocke que
// son empreinte SHA-256 (colonne password_reset_tokens.token) : une fuite de la table
// ne permet pas de réinitialiser un mot de passe.
import crypto from 'crypto';
import { query } from './db';

/** Durée de validité d'un jeton : 1 heure maximum. */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/** Empreinte SHA-256 (hex) d'un jeton en clair, telle que stockée en base. */
export function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Crée un jeton pour `userId` après avoir supprimé ses anciens jetons et les jetons expirés.
 *
 * @returns {Promise<string>} le jeton EN CLAIR, à placer uniquement dans le lien de l'e-mail.
 */
export async function createResetToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await query(
    'DELETE FROM password_reset_tokens WHERE user_id = $1 OR expires_at < NOW()',
    [userId]
  );

  await query(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, hashResetToken(token), expiresAt]
  );

  return token;
}
