// src/app/api/auth/me/route.js
export const runtime = 'nodejs';
import { query } from '../../../../lib/db';
import { getVerifiedUser } from '../../../../lib/auth';

// GET - Retourne l'utilisateur de la session courante.
//
// Le cookie de session étant HttpOnly, le client ne peut plus lire le token ni en
// extraire le rôle : il doit demander au serveur qui il est au chargement de la page.
// C'est aussi plus sûr que l'ancien modèle, où le rôle affiché venait d'un objet
// stocké dans localStorage, donc modifiable par l'utilisateur.
export async function GET(request) {
  const payload = getVerifiedUser(request);

  if (!payload) {
    return Response.json({ authenticated: false, user: null }, { status: 200 });
  }

  try {
    // On relit l'utilisateur en base plutôt que de faire confiance au contenu du
    // token : un compte désactivé ou dont le rôle a changé est ainsi pris en compte
    // immédiatement, sans attendre l'expiration du JWT.
    const result = await query(
      `SELECT id, prenom, nom, email, photo, bio, role, actif
       FROM users WHERE id = $1 AND actif = TRUE`,
      [payload.userId]
    );

    if (result.rows.length === 0) {
      return Response.json({ authenticated: false, user: null }, { status: 200 });
    }

    const u = result.rows[0];
    return Response.json({
      authenticated: true,
      user: {
        id: u.id,
        prenom: u.prenom,
        nom: u.nom,
        email: u.email,
        role: u.role,
        photo: u.photo || '/images/default-avatar.jpg',
        bio: u.bio || '',
      },
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la session:', error?.message);
    return Response.json(
      { error: 'Erreur serveur lors de la récupération de la session' },
      { status: 500 }
    );
  }
}
