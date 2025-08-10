// src/app/api/users/route.js
export const runtime = 'nodejs';
import db from '../../../lib/db';
import bcrypt from 'bcryptjs';

// GET - Récupérer tous les utilisateurs
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = `
      SELECT 
        id, prenom, nom, email, photo, bio, role, 
        date_inscription, date_modification, actif
      FROM users 
      WHERE actif = TRUE
    `;
    
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    query += ' ORDER BY date_inscription DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await db.execute(query, params);

    // Transformer les données pour correspondre au format attendu par le frontend
    const users = rows.map(row => ({
      id: row.id,
      prenom: row.prenom,
      nom: row.nom,
      email: row.email,
      photo: row.photo || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      bio: row.bio || '',
      role: row.role,
      date_inscription: row.date_inscription,
      date_modification: row.date_modification,
      actif: row.actif
    }));

    return Response.json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return Response.json(
      { error: 'Erreur serveur lors de la récupération des utilisateurs' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel utilisateur (inscription ou création par admin)
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      firstName, 
      lastName, 
      prenom, 
      nom, 
      email, 
      password, 
      photo, 
      bio, 
      role = 'Rédacteur' 
    } = body;

    // Support pour les deux formats de noms (compatibilité)
    const finalFirstName = firstName || prenom;
    const finalLastName = lastName || nom;

    // Validation des données
    if (!finalFirstName || !finalLastName || !email || !password) {
      return Response.json({ 
        message: 'Tous les champs sont requis',
        errors: {
          firstName: !finalFirstName ? 'Le prénom est requis' : '',
          lastName: !finalLastName ? 'Le nom est requis' : '',
          email: !email ? 'L\'email est requis' : '',
          password: !password ? 'Le mot de passe est requis' : ''
        }
      }, { status: 400 });
    }

    // Validation de l'email
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return Response.json({ 
        message: 'Format d\'email invalide',
        errors: { email: 'L\'adresse e-mail n\'est pas valide' }
      }, { status: 400 });
    }

    // Validation du mot de passe
    if (password.length < 6) {
      return Response.json({ 
        message: 'Mot de passe trop court',
        errors: { password: 'Le mot de passe doit contenir au moins 6 caractères' }
      }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe déjà
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (existingUsers.length > 0) {
      return Response.json({ 
        message: 'Utilisateur déjà existant',
        errors: { email: 'Cette adresse e-mail est déjà utilisée' }
      }, { status: 409 });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insérer le nouvel utilisateur
    const [result] = await db.execute(
      `INSERT INTO users (prenom, nom, email, mot_de_passe, photo, bio, role, date_inscription) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        finalFirstName.trim(),
        finalLastName.trim(),
        email.toLowerCase().trim(),
        hashedPassword,
        photo || null,
        bio || null,
        role
      ]
    );

    // Récupérer l'utilisateur créé
    const [newUser] = await db.execute(
      'SELECT id, prenom, nom, email, photo, bio, role, date_inscription FROM users WHERE id = ?',
      [result.insertId]
    );

    return Response.json({
      message: 'Utilisateur créé avec succès',
      user: {
        id: newUser[0].id,
        prenom: newUser[0].prenom,
        nom: newUser[0].nom,
        email: newUser[0].email,
        photo: newUser[0].photo,
        bio: newUser[0].bio,
        role: newUser[0].role,
        date_inscription: newUser[0].date_inscription
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return Response.json({ 
        message: 'Utilisateur déjà existant',
        errors: { email: 'Cette adresse e-mail est déjà utilisée' }
      }, { status: 409 });
    }

    return Response.json({ 
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
    }, { status: 500 });
  }
}