// src/app/api/users/route.js - VERSION SIMPLIFIÉE SANS RÔLES
export const runtime = 'nodejs';
import db from '../../../lib/db';
import bcrypt from 'bcryptjs';

// GET - Récupérer tous les utilisateurs
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const query = `
      SELECT 
        id, prenom, nom, email, photo, bio, role, 
        date_inscription, date_modification, actif
      FROM users 
      WHERE actif = TRUE
      ORDER BY date_inscription DESC 
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [rows] = await db.query(query);

    const users = rows.map(row => ({
      id: row.id,
      prenom: row.prenom,
      nom: row.nom,
      email: row.email,
      photo: row.photo || '/images/default-avatar.jpg',
      bio: row.bio || '',
      role: row.role, // Sera toujours 'Administrateur' maintenant
      date_inscription: row.date_inscription,
      date_modification: row.date_modification,
      actif: Boolean(row.actif)
    }));

    return Response.json(users);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
    return Response.json(
      { 
        error: 'Erreur serveur lors de la récupération des utilisateurs',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel utilisateur (toujours Administrateur maintenant)
export async function POST(request) {
  try {
    console.log('🔄 Début de la création d\'utilisateur...');
    const body = await request.json();
    console.log('📝 Données reçues:', { ...body, password: '[MASQUÉ]' });

    const { 
      firstName, 
      lastName, 
      prenom, 
      nom, 
      email, 
      password, 
      photo, 
      bio
      // Suppression du paramètre role - sera toujours 'Administrateur'
    } = body;

    // Support pour les deux formats de noms
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
      const emailRegex = /\S+@\S+\.\S+/;
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
      console.log('❌ Erreurs de validation:', errors);
      return Response.json({ 
        message: 'Données manquantes ou invalides',
        errors
      }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe déjà
    console.log('🔍 Vérification utilisateur existant...');
    const checkEmailQuery = `SELECT id FROM users WHERE email = ${db.escape(email.toLowerCase().trim())}`;
    
    const [existingUsers] = await db.query(checkEmailQuery);

    if (existingUsers.length > 0) {
      console.log('❌ Email déjà utilisé');
      return Response.json({ 
        message: 'Utilisateur déjà existant',
        errors: { email: 'Cette adresse e-mail est déjà utilisée' }
      }, { status: 409 });
    }

    // Hacher le mot de passe
    console.log('🔐 Hachage du mot de passe...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Préparer les valeurs avec échappements manuels
    const prenomEscaped = db.escape(finalFirstName.trim());
    const nomEscaped = db.escape(finalLastName.trim());
    const emailEscaped = db.escape(email.toLowerCase().trim());
    const passwordEscaped = db.escape(hashedPassword);
    const photoEscaped = photo && photo.trim() !== '' ? db.escape(photo.trim()) : 'NULL';
    const bioEscaped = bio && bio.trim() !== '' ? db.escape(bio.trim()) : 'NULL';
    // SIMPLIFIÉ : Tous les nouveaux utilisateurs sont Administrateurs
    const roleEscaped = db.escape('Administrateur');

    // Construire la requête d'insertion
    console.log('💾 Insertion en base...');
    const insertQuery = `
      INSERT INTO users (prenom, nom, email, mot_de_passe, photo, bio, role, date_inscription) 
      VALUES (${prenomEscaped}, ${nomEscaped}, ${emailEscaped}, ${passwordEscaped}, ${photoEscaped}, ${bioEscaped}, ${roleEscaped}, NOW())
    `;

    console.log('📝 Requête d\'insertion:', insertQuery.replace(passwordEscaped, '[HASH_MASQUÉ]'));

    const [result] = await db.query(insertQuery);
    console.log('✅ Utilisateur inséré avec ID:', result.insertId);

    // Récupérer l'utilisateur créé (sans le mot de passe)
    const selectQuery = `
      SELECT id, prenom, nom, email, photo, bio, role, date_inscription 
      FROM users 
      WHERE id = ${result.insertId}
    `;

    const [newUser] = await db.query(selectQuery);

    if (newUser.length === 0) {
      console.error('❌ Impossible de récupérer l\'utilisateur créé');
      return Response.json({
        message: 'Utilisateur créé mais impossible de le récupérer'
      }, { status: 500 });
    }

    const userCreated = {
      id: newUser[0].id,
      prenom: newUser[0].prenom,
      nom: newUser[0].nom,
      email: newUser[0].email,
      photo: newUser[0].photo || '/images/default-avatar.jpg',
      bio: newUser[0].bio || '',
      role: newUser[0].role, // Sera 'Administrateur'
      date_inscription: newUser[0].date_inscription
    };

    console.log('✅ Utilisateur créé avec succès:', userCreated.email);

    return Response.json({
      message: 'Utilisateur créé avec succès',
      user: userCreated
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error);
    console.error('❌ Stack trace:', error.stack);
    
    // Gestion des erreurs spécifiques MySQL
    let errorMessage = 'Erreur serveur lors de la création de l\'utilisateur';
    let statusCode = 500;
    
    if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'Cette adresse e-mail est déjà utilisée';
      statusCode = 409;
    } else if (error.code === 'ER_DATA_TOO_LONG') {
      errorMessage = 'Données trop longues pour un ou plusieurs champs';
      statusCode = 400;
    } else if (error.code === 'ER_BAD_NULL_ERROR') {
      errorMessage = 'Un champ obligatoire est manquant';
      statusCode = 400;
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      errorMessage = 'Table utilisateurs non trouvée dans la base de données';
      statusCode = 500;
    } else if (error.code === 'ER_PARSE_ERROR') {
      errorMessage = 'Erreur de syntaxe SQL';
      statusCode = 500;
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      errorMessage = 'Accès refusé à la base de données';
      statusCode = 500;
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Impossible de se connecter à la base de données';
      statusCode = 500;
    }

    return Response.json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue lors de la création de l\'utilisateur',
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        sqlMessage: error.sqlMessage,
        stack: error.stack
      } : undefined
    }, { status: statusCode });
  }
}