// src/app/api/register/route.js
export const runtime = 'nodejs';
import { query } from '../../../lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  console.log("🔄 Tentative d'inscription...");
  try {
    const body = await request.json();
    const {
      email,
      password,
      prenom,
      nom,
      firstName,
      lastName,
      role,          // optionnel : si tu veux permettre de passer un rôle précis
    } = body;

    const first = (prenom || firstName || '').trim();
    const last  = (nom || lastName || '').trim();
    const emailNorm = (email || '').toLowerCase().trim();

    if (!emailNorm || !password || !first || !last) {
      return Response.json({ success: false, message: 'Tous les champs sont requis' }, { status: 400 });
    }
    if (!/\S+@\S+\.\S+/.test(emailNorm)) {
      return Response.json({ success: false, message: 'Veuillez entrer une adresse email valide' }, { status: 400 });
    }
    if (password.length < 8) {
      return Response.json({ success: false, message: 'Le mot de passe doit contenir au moins 8 caractères' }, { status: 400 });
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return Response.json({ success: false, message: 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre' }, { status: 400 });
    }

    // Email déjà pris ?
    const existing = await query('SELECT id FROM users WHERE email = $1', [emailNorm]);
    if (existing.rows.length > 0) {
      return Response.json({ success: false, message: 'Cette adresse email est déjà utilisée' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Insertion conforme aux colonnes de ta table Supabase
    const inserted = await query(
      `INSERT INTO users (prenom, nom, email, mot_de_passe, role, date_inscription, date_modification, actif)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), TRUE)
       RETURNING id`,
      [first, last, emailNorm, hashed, role || 'Utilisateur']
    );

    const userId = inserted.rows[0].id;
    const userRes = await query(
      'SELECT id, prenom, nom, email, role, actif, date_inscription, date_modification FROM users WHERE id = $1',
      [userId]
    );
    const user = userRes.rows[0];

    return Response.json({
      success: true,
      message: 'Inscription réussie !',
      user: {
        id: user.id,
        firstName: user.prenom,
        lastName: user.nom,
        email: user.email,
        role: user.role,
        actif: user.actif,
        dateInscription: user.date_inscription,
        dateModification: user.date_modification,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('💥 Erreur inscription:', error);

    if (error.code === '23505') { // unique_violation (PG)
      return Response.json({ success: false, message: 'Cette adresse email est déjà utilisée' }, { status: 409 });
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return Response.json({ success: false, message: 'Erreur de connexion à la base de données' }, { status: 503 });
    }

    return Response.json({ success: false, message: "Erreur lors de l'inscription" }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({
    message: 'Route d’inscription active',
    timestamp: new Date().toISOString(),
    path: '/api/register'
  });
}


