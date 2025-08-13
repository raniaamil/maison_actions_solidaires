// src/app/api/auth/login/route.js
export const runtime = 'nodejs';
import db from '../../../../lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Validation des entrées
    if (!email || !password) {
      return Response.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return Response.json(
        { error: 'Format des données invalide' },
        { status: 400 }
      );
    }

    const emailTrimmed = email.toLowerCase().trim();
    
    if (emailTrimmed === '' || password.trim() === '') {
      return Response.json(
        { error: 'Email et mot de passe ne peuvent pas être vides' },
        { status: 400 }
      );
    }

    // Validation basique du format email
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(emailTrimmed)) {
      return Response.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      );
    }

    // Chercher l'utilisateur
    const [users] = await db.execute(
      'SELECT id, prenom, nom, email, mot_de_passe, role, photo, bio FROM users WHERE email = ? AND actif = TRUE',
      [emailTrimmed]
    );

    if (users.length === 0) {
      // Utiliser un délai pour éviter les attaques par timing
      await new Promise(resolve => setTimeout(resolve, 100));
      return Response.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    const user = users[0];

    // Vérifier le mot de passe
    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(password, user.mot_de_passe);
    } catch (error) {
      console.error('Erreur lors de la vérification du mot de passe:', error);
      return Response.json(
        { error: 'Erreur lors de la vérification du mot de passe' },
        { status: 500 }
      );
    }

    if (!isValidPassword) {
      // Utiliser un délai pour éviter les attaques par timing
      await new Promise(resolve => setTimeout(resolve, 100));
      return Response.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    // Créer le token JWT avec gestion d'erreur améliorée
    let token;
    try {
      // Vérifier que JWT_SECRET existe
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        console.error('❌ JWT_SECRET n\'est pas défini dans les variables d\'environnement');
        return Response.json(
          { error: 'Configuration serveur manquante' },
          { status: 500 }
        );
      }

      // Vérifier que la clé secrète est assez longue
      if (secret.length < 32) {
        console.error('❌ JWT_SECRET est trop court (minimum 32 caractères)');
        return Response.json(
          { error: 'Configuration serveur invalide' },
          { status: 500 }
        );
      }

      const tokenPayload = { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        iat: Math.floor(Date.now() / 1000)
      };

      console.log('🔑 Création du token pour utilisateur:', user.id);
      
      token = jwt.sign(
        tokenPayload, 
        secret, 
        { 
          expiresIn: '7d',
          algorithm: 'HS256'
        }
      );

      console.log('✅ Token créé avec succès');

    } catch (jwtError) {
      console.error('❌ Erreur lors de la création du token JWT:', jwtError);
      
      // Gestion spécifique des erreurs JWT
      if (jwtError.message.includes('secretOrPrivateKey')) {
        console.error('❌ Problème avec la clé secrète JWT');
        return Response.json(
          { error: 'Erreur de configuration serveur' },
          { status: 500 }
        );
      }
      
      return Response.json(
        { error: 'Erreur lors de la création du token' },
        { status: 500 }
      );
    }

    // Préparer les données utilisateur (sans mot de passe)
    const userData = {
      id: user.id,
      prenom: user.prenom,
      nom: user.nom,
      email: user.email,
      role: user.role,
      photo: user.photo || '/images/default-avatar.jpg',
      bio: user.bio || ''
    };

    // Log de connexion réussie (sans données sensibles)
    console.log(`✅ Connexion réussie pour l'utilisateur: ${user.email} (${user.role})`);

    return Response.json({
      success: true,
      user: userData,
      token: token
    });

  } catch (error) {
    console.error('❌ Erreur générale lors de la connexion:', error);
    
    // Gestion des erreurs spécifiques
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      return Response.json(
        { error: 'Erreur de connexion à la base de données' },
        { status: 500 }
      );
    }

    if (error.name === 'JsonWebTokenError') {
      console.error('❌ Erreur JsonWebToken:', error.message);
      return Response.json(
        { error: 'Erreur lors de la génération du token' },
        { status: 500 }
      );
    }

    if (error.message && error.message.includes('JSON')) {
      return Response.json(
        { error: 'Format de données invalide' },
        { status: 400 }
      );
    }

    return Response.json(
      { 
        error: 'Erreur serveur lors de la connexion',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}