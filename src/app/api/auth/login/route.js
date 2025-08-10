// 1. API d'authentification - src/app/api/auth/login/route.js
export const runtime = 'nodejs';
import db from '../../../../lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // Chercher l'utilisateur
    const [users] = await db.execute(
      'SELECT id, prenom, nom, email, mot_de_passe, role, photo, bio FROM users WHERE email = ? AND actif = TRUE',
      [email.toLowerCase().trim()]
    );

    if (users.length === 0) {
      return Response.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    const user = users[0];

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.mot_de_passe);
    if (!isValidPassword) {
      return Response.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    // Créer le token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Préparer les données utilisateur (sans mot de passe)
    const userData = {
      id: user.id,
      prenom: user.prenom,
      nom: user.nom,
      email: user.email,
      role: user.role,
      photo: user.photo,
      bio: user.bio
    };

    return Response.json({
      success: true,
      user: userData,
      token: token
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return Response.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
