// src/app/api/auth/register/route.js
export const runtime = 'nodejs';
import { query } from '../../../../lib/db'; // <-- corrige l'import
import bcrypt from 'bcryptjs';

export async function POST(request) {
  console.log("🔄 Tentative d'inscription...");

  try {
    const body = await request.json();
    console.log('📝 Données reçues:', { ...body, password: '[MASQUÉ]' });

    const { email, password, firstName, lastName } = body;

    // Validations
    if (!email || !password || !firstName || !lastName) {
      return Response.json({
        success: false,
        message: 'Tous les champs obligatoires sont requis',
        missing: {
          email: !email, password: !password, firstName: !firstName, lastName: !lastName
        }
      }, { status: 400 });
    }

    const emailNorm = email.toLowerCase().trim();
    if (!/\S+@\S+\.\S+/.test(emailNorm)) {
      return Response.json({ success: false, message: 'Veuillez entrer une adresse email valide' }, { status: 400 });
    }
    if (password.length < 8) {
      return Response.json({ success: false, message: 'Le mot de passe doit contenir au moins 8 caractères' }, { status: 400 });
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return Response.json({ success: false, message: 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre' }, { status: 400 });
    }

    // Email déjà utilisé ?
    const existing = await query('SELECT id FROM users WHERE email = $1', [emailNorm]);
    if (existing.rows.length > 0) {
      return Response.json({ success: false, message: 'Cette adresse email est déjà utilisée' }, { status: 409 });
    }

    // Hash + insertion
    const hashed = await bcrypt.hash(password, 10);
    const inserted = await query(
      `INSERT INTO users (prenom, nom, email, mot_de_passe, role, date_inscription)
       VALUES ($1, $2, $3, $4, 'Administrateur', CURRENT_TIMESTAMP)
       RETURNING id`,
      [firstName.trim(), lastName.trim(), emailNorm, hashed]
    );

    const userId = inserted.rows[0].id;
    const userRes = await query('SELECT id, prenom, nom, email, role FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];

    return Response.json({
      success: true,
      message: 'Inscription réussie !',
      user: {
        id: user.id,
        firstName: user.prenom,
        lastName: user.nom,
        email: user.email,
        role: user.role
      }
    }, { status: 201 });

  } catch (error) {
    console.error('💥 Erreur inscription:', error);

    if (error.code === '23505') {
      return Response.json({ success: false, message: 'Cette adresse email est déjà utilisée' }, { status: 409 });
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return Response.json({ success: false, message: 'Erreur de connexion à la base de données' }, { status: 503 });
    }

    return Response.json({
      success: false,
      message: "Erreur lors de l'inscription",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
    }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({
    message: "Route d'inscription auth active",
    timestamp: new Date().toISOString(),
    path: '/api/auth/register'
  });
}
