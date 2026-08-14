// src/lib/auth.js — Helpers d'authentification/autorisation pour les route handlers (runtime Node.js)
//
// ⚠️ Le middleware (Edge) effectue une première vérification de signature, mais il ne constitue
// PAS à lui seul une frontière de sécurité : chaque route sensible doit revérifier ici.
import jwt from 'jsonwebtoken';

/** Rôles connus de l'application (cf. src/database/schema.sql). */
export const ROLES = {
  ADMIN: 'Administrateur',
  REDACTEUR: 'Rédacteur',
  UTILISATEUR: 'Utilisateur',
};

/**
 * Extrait et vérifie le JWT porté par l'en-tête Authorization.
 * Vérifie la signature ET l'expiration (jwt.verify échoue sur un token expiré).
 *
 * @returns {object|null} le payload vérifié, ou null si absent/invalide/expiré.
 */
export function getVerifiedUser(request) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('❌ JWT_SECRET non défini — impossible de vérifier le token');
    return null;
  }

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!token) return null;

  try {
    // algorithms explicite : empêche une attaque par confusion d'algorithme (ex. alg:none)
    return jwt.verify(token, secret, { algorithms: ['HS256'] });
  } catch {
    // Pas de log du token ni du détail de l'erreur : évite de fuiter de la matière exploitable
    return null;
  }
}

/**
 * Exige un utilisateur authentifié dont le rôle figure parmi `allowedRoles`.
 * Si `allowedRoles` est vide, seule l'authentification est exigée.
 *
 * @returns {{ user: object, error: null } | { user: null, error: Response }}
 *   Le pattern retourne la Response d'erreur au lieu de la lancer, afin que
 *   l'appelant fasse `if (error) return error;` en tête de handler.
 */
export function requireRole(request, allowedRoles = []) {
  const user = getVerifiedUser(request);

  if (!user) {
    return {
      user: null,
      error: Response.json(
        { error: "Token d'authentification requis ou invalide" },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return {
      user: null,
      error: Response.json(
        { error: 'Accès refusé — privilèges insuffisants' },
        { status: 403 }
      ),
    };
  }

  return { user, error: null };
}

/** Raccourci : réservé aux Administrateurs. */
export function requireAdmin(request) {
  return requireRole(request, [ROLES.ADMIN]);
}

/** Raccourci : réservé aux Administrateurs et Rédacteurs (rôles éditoriaux). */
export function requireEditor(request) {
  return requireRole(request, [ROLES.ADMIN, ROLES.REDACTEUR]);
}
