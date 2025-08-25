// src/app/api/users/route.js - VERSION AVEC ENVOI D'EMAIL
export const runtime = 'nodejs';
import db from '../../../lib/db';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

// Configuration du transporteur email
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true pour 465, false pour les autres ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

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

    // Transformer les données
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

// POST - Créer un nouvel utilisateur avec envoi d'email
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
      bio,
      role = 'Administrateur' // Valeur par défaut
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
      // Validation de l'email
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

    // Vérifier si l'utilisateur existe déjà avec échappement manuel
    console.log('🔍 Vérification utilisateur existant...');
    const checkEmailQuery = `SELECT id FROM users WHERE email = ${db.escape(email.toLowerCase().trim())}`;
    console.log('📝 Requête vérification email:', checkEmailQuery);
    
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
    const roleEscaped = db.escape(role);

    // Construire la requête d'insertion avec échappements manuels
    console.log('💾 Insertion en base...');
    const insertQuery = `
      INSERT INTO users (prenom, nom, email, mot_de_passe, photo, bio, role, date_inscription) 
      VALUES (${prenomEscaped}, ${nomEscaped}, ${emailEscaped}, ${passwordEscaped}, ${photoEscaped}, ${bioEscaped}, ${roleEscaped}, NOW())
    `;

    console.log('📝 Requête d\'insertion:', insertQuery.replace(passwordEscaped, '[HASH_MASQUÉ]'));

    const [result] = await db.query(insertQuery);
    console.log('✅ Utilisateur inséré avec ID:', result.insertId);

    // Récupérer l'utilisateur créé (sans le mot de passe) avec échappement manuel
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
      role: newUser[0].role,
      date_inscription: newUser[0].date_inscription
    };

    // 📧 ENVOI DE L'EMAIL DE BIENVENUE
    try {
      console.log('📧 Envoi de l\'email de bienvenue...');
      const transporter = createTransporter();
      
      const mailOptions = {
        from: `"Maison d'Actions Solidaires" <${process.env.SMTP_USER}>`,
        to: userCreated.email,
        subject: ' Vos identifiants de connexion',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #8b9467 0%, #a4b070 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Bienvenue dans l'équipe !</h1>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-top: none;">
              <p style="color: #333; font-size: 16px; line-height: 1.6;">Bonjour ${userCreated.prenom} ${userCreated.nom},</p>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                Félicitations ! Votre compte administrateur a été créé avec succès sur la plateforme de Maison d'Actions Solidaires.
              </p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b9467;">
                <h3 style="color: #8b9467; margin-top: 0;"> Vos identifiants de connexion :</h3>
                <p style="margin: 10px 0;"><strong>Email :</strong> ${userCreated.email}</p>
                <p style="margin: 10px 0;"><strong>Mot de passe temporaire :</strong> <span style="font-family: monospace; background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${password}</span></p>
                <p style="margin: 10px 0;"><strong>Rôle :</strong> ${userCreated.role}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login" 
                   style="background: linear-gradient(135deg, #8b9467 0%, #a4b070 100%); 
                          color: white; 
                          text-decoration: none; 
                          padding: 15px 30px; 
                          border-radius: 8px; 
                          font-weight: bold; 
                          display: inline-block;
                          font-size: 16px;">
                  Se connecter à la plateforme
                </a>
              </div>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>⚠️ Important :</strong> Pour votre sécurité, nous vous recommandons vivement de changer ce mot de passe temporaire lors de votre première connexion.
                </p>
              </div>
              
              <h3 style="color: #8b9467;"> Vos prochaines étapes :</h3>
              <ol style="color: #333; line-height: 1.6;">
                <li>Connectez-vous à la plateforme avec vos identifiants</li>
                <li>Modifiez votre mot de passe temporaire</li>
                <li>Complétez votre profil (photo, biographie)</li>
                <li>Explorez l'interface d'administration</li>
                <li>Commencez à créer des actualités !</li>
              </ol>
              
              <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
                <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">
                  Cet email a été envoyé automatiquement par la plateforme Maison d\'Actions Solidaires<br>
                  Si vous avez des questions, contactez-nous à maisondactionsolidaire@gmail.com
                </p>
              </div>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('✅ Email de bienvenue envoyé à:', userCreated.email);

    } catch (emailError) {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', emailError);
      // On ne fait pas échouer la création si l'email ne peut pas être envoyé
      // L'utilisateur est créé, c'est l'essentiel
    }

    console.log('✅ Utilisateur créé avec succès:', userCreated.email);

    return Response.json({
      message: 'Utilisateur créé avec succès',
      user: userCreated,
      emailSent: true // Indique que l'email a été tenté
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