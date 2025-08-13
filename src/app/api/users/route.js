// src/app/api/users/route.js
export const runtime = 'nodejs';
import db from '../../../lib/db';
import bcrypt from 'bcryptjs';

// GET - Récupérer tous les utilisateurs
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Simplification : plus de filtre par rôle puisque tous sont administrateurs
    let query = `
      SELECT 
        id, prenom, nom, email, photo, bio, role, 
        date_inscription, date_modification, actif
      FROM users 
      WHERE actif = TRUE
      ORDER BY date_inscription DESC 
      LIMIT ? OFFSET ?
    `;
    
    const params = [limit, offset];
    const [rows] = await db.execute(query, params);

    // Transformer les données pour correspondre au format attendu par le frontend
    const users = rows.map(row => ({
      id: row.id,
      prenom: row.prenom,
      nom: row.nom,
      email: row.email,
      photo: row.photo || '/images/default-avatar.jpg',
      bio: row.bio || '',
      role: row.role,
      date_inscription: row.date_inscription,
      date_modification: row.date_modification,
      actif: Boolean(row.actif)
    }));

    return Response.json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return Response.json(
      { 
        error: 'Erreur serveur lors de la récupération des utilisateurs',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel utilisateur (toujours administrateur)
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
      bio 
    } = body;

    // Support pour les deux formats de noms (compatibilité)
    const finalFirstName = firstName || prenom;
    const finalLastName = lastName || nom;

    // Validation des données
    const errors = {};
    
    if (!finalFirstName || !finalFirstName.trim()) {
      errors.firstName = 'Le prénom est requis';
      errors.prenom = 'Le prénom est requis';
    }
    
    if (!finalLastName || !finalLastName.trim()) {
      errors.lastName = 'Le nom est requis';
      errors.nom = 'Le nom est requis';
    }
    
    if (!email || !email.trim()) {
      errors.email = 'L\'email est requis';
    }
    
    if (!password || !password.trim()) {
      errors.password = 'Le mot de passe est requis';
    }

    if (Object.keys(errors).length > 0) {
      return Response.json({ 
        message: 'Données manquantes ou invalides',
        errors
      }, { status: 400 });
    }

    // Validation de l'email
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email.trim())) {
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

    // Préparer les valeurs - Tous les nouveaux utilisateurs sont administrateurs
    const photoValue = photo && photo.trim() !== '' ? photo.trim() : null;
    const bioValue = bio && bio.trim() !== '' ? bio.trim() : null;

    // Insérer le nouvel utilisateur (toujours avec le rôle Administrateur)
    const [result] = await db.execute(
      `INSERT INTO users (prenom, nom, email, mot_de_passe, photo, bio, role, date_inscription) 
       VALUES (?, ?, ?, ?, ?, ?, 'Administrateur', NOW())`,
      [
        finalFirstName.trim(),
        finalLastName.trim(),
        email.toLowerCase().trim(),
        hashedPassword,
        photoValue,
        bioValue
      ]
    );

    // Récupérer l'utilisateur créé (sans le mot de passe)
    const [newUser] = await db.execute(
      'SELECT id, prenom, nom, email, photo, bio, role, date_inscription FROM users WHERE id = ?',
      [result.insertId]
    );

    const userCreated = {
      id: newUser[0].id,
      prenom: newUser[0].prenom,
      nom: newUser[0].nom,
      email: newUser[0].email,
      photo: newUser[0].photo || '/images/default-avatar.jpg',
      bio: newUser[0].bio || '',
      role: newUser[0].role, // Toujours 'Administrateur'
      date_inscription: newUser[0].date_inscription
    };

    return Response.json({
      message: 'Administrateur créé avec succès',
      user: userCreated
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    
    // Gestion des erreurs spécifiques MySQL
    if (error.code === 'ER_DUP_ENTRY') {
      return Response.json({ 
        message: 'Utilisateur déjà existant',
        errors: { email: 'Cette adresse e-mail est déjà utilisée' }
      }, { status: 409 });
    }

    if (error.code === 'ER_DATA_TOO_LONG') {
      return Response.json({ 
        message: 'Données trop longues',
        errors: { general: 'Un ou plusieurs champs contiennent trop de caractères' }
      }, { status: 400 });
    }

    if (error.code === 'ER_BAD_NULL_ERROR') {
      return Response.json({ 
        message: 'Champ obligatoire manquant',
        errors: { general: 'Un champ obligatoire est manquant' }
      }, { status: 400 });
    }

    return Response.json({ 
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue lors de la création de l\'utilisateur'
    }, { status: 500 });
  }
}