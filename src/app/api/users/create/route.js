// src/app/api/users/create/route.js
export const runtime = 'nodejs';
import db from '../../../../lib/db';
import bcrypt from 'bcryptjs';

// POST - Créer un nouvel utilisateur (endpoint dédié pour la création)
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
      role = 'Administrateur' // Tous les nouveaux utilisateurs sont administrateurs
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
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.email = 'L\'adresse e-mail n\'est pas valide';
      }
    }
    
    if (!password || !password.trim()) {
      errors.password = 'Le mot de passe est requis';
    } else if (password.length < 6) {
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (Object.keys(errors).length > 0) {
      return Response.json({ 
        message: 'Données manquantes ou invalides',
        errors
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

    // Préparer les valeurs
    const photoValue = photo && photo.trim() !== '' ? photo.trim() : null;
    const bioValue = bio && bio.trim() !== '' ? bio.trim() : null;

    // Insérer le nouvel utilisateur
    const [result] = await db.execute(
      `INSERT INTO users (prenom, nom, email, mot_de_passe, photo, bio, role, date_inscription) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        finalFirstName.trim(),
        finalLastName.trim(),
        email.toLowerCase().trim(),
        hashedPassword,
        photoValue,
        bioValue,
        role
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
      role: newUser[0].role,
      date_inscription: newUser[0].date_inscription
    };

    console.log('✅ Utilisateur créé avec succès:', userCreated.email);

    return Response.json({
      message: 'Utilisateur créé avec succès',
      user: userCreated
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error);
    
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