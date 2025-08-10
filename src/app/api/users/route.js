// src/app/api/users/route.js
export const runtime = 'nodejs';
import db from '../../../../lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const [rows] = await db.execute('SELECT id, prenom, nom, email FROM users');
    return Response.json(rows);
  } catch (error) {
    console.error('Erreur base de données:', error);
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST pour l'inscription
export async function POST(request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password } = body;

    // Validation des données
    if (!firstName || !lastName || !email || !password) {
      return Response.json({ 
        message: 'Tous les champs sont requis',
        errors: {
          firstName: !firstName ? 'Le prénom est requis' : '',
          lastName: !lastName ? 'Le nom est requis' : '',
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

    // Insérer le nouvel utilisateur (en utilisant vos noms de colonnes français)
    const [result] = await db.execute(
      `INSERT INTO users (prenom, nom, email, mot_de_passe, date_inscription) 
       VALUES (?, ?, ?, ?, NOW())`,
      [
        firstName.trim(),
        lastName.trim(),
        email.toLowerCase().trim(),
        hashedPassword
      ]
    );

    // Retourner une réponse de succès (sans le mot de passe)
    return Response.json({
      message: 'Utilisateur créé avec succès',
      user: {
        id: result.insertId,
        prenom: firstName.trim(),
        nom: lastName.trim(),
        email: email.toLowerCase().trim(),
        date_inscription: new Date()
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    
    // Gérer les erreurs MySQL spécifiques
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