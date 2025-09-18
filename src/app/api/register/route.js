// src/app/api/register/route.js - VERSION DEBUG
export const runtime = 'nodejs';

import { query } from '../../../lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  // 🐛 LOGS DE DEBUG DETAILLÉS
  console.log("🔄 === DÉBUT INSCRIPTION ===");
  console.log("ENV Check:", {
    NODE_ENV: process.env.NODE_ENV,
    HAS_DATABASE_URL: !!process.env.DATABASE_URL,
    DATABASE_URL_START: process.env.DATABASE_URL?.substring(0, 20) + '...'
  });

  try {
    // 1. Parsing du body
    let body;
    try {
      body = await request.json();
      console.log("📝 Body reçu:", {
        hasEmail: !!body.email,
        hasPassword: !!body.password,
        hasFirstName: !!(body.firstName || body.prenom),
        hasLastName: !!(body.lastName || body.nom),
        keys: Object.keys(body)
      });
    } catch (parseError) {
      console.error("❌ Erreur parsing JSON:", parseError);
      return Response.json({ 
        success: false, 
        message: 'Erreur de format des données' 
      }, { status: 400 });
    }

    const { email, password, prenom, nom, firstName, lastName } = body;
    
    const first = (prenom || firstName || '').trim();
    const last = (nom || lastName || '').trim();
    const emailNorm = (email || '').toLowerCase().trim();

    console.log("🔍 Données normalisées:", {
      first: first ? '✅' : '❌',
      last: last ? '✅' : '❌',
      emailNorm: emailNorm ? '✅' : '❌',
      password: password ? `✅ (${password.length} chars)` : '❌'
    });

    // 2. Validation
    if (!emailNorm || !password || !first || !last) {
      console.log("❌ Validation échouée - champs manquants");
      return Response.json({ 
        success: false, 
        message: 'Tous les champs sont requis' 
      }, { status: 400 });
    }

    if (!/\S+@\S+\.\S+/.test(emailNorm)) {
      console.log("❌ Email invalide:", emailNorm);
      return Response.json({ 
        success: false, 
        message: 'Veuillez entrer une adresse email valide' 
      }, { status: 400 });
    }

    if (password.length < 8) {
      console.log("❌ Mot de passe trop court");
      return Response.json({ 
        success: false, 
        message: 'Le mot de passe doit contenir au moins 8 caractères' 
      }, { status: 400 });
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      console.log("❌ Mot de passe ne respecte pas les critères");
      return Response.json({ 
        success: false, 
        message: 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre' 
      }, { status: 400 });
    }

    console.log("✅ Validation OK - tentative de connexion DB");

    // 3. Test de connexion DB
    let existing;
    try {
      existing = await query('SELECT id FROM users WHERE email = $1', [emailNorm]);
      console.log("✅ Requête SELECT réussie, résultats:", existing.rows.length);
    } catch (dbError) {
      console.error("❌ Erreur DB SELECT:", {
        code: dbError.code,
        message: dbError.message,
        stack: dbError.stack?.substring(0, 200)
      });
      return Response.json({ 
        success: false, 
        message: 'Erreur de connexion à la base de données' 
      }, { status: 503 });
    }

    if (existing.rows.length > 0) {
      console.log("❌ Email déjà utilisé");
      return Response.json({ 
        success: false, 
        message: 'Cette adresse email est déjà utilisée' 
      }, { status: 409 });
    }

    // 4. Hashage du mot de passe
    console.log("🔐 Hashage du mot de passe...");
    let hashed;
    try {
      hashed = await bcrypt.hash(password, 10);
      console.log("✅ Mot de passe hashé");
    } catch (hashError) {
      console.error("❌ Erreur hashage:", hashError);
      return Response.json({ 
        success: false, 
        message: 'Erreur de traitement du mot de passe' 
      }, { status: 500 });
    }

    // 5. Insertion
    console.log("💾 Insertion en base...");
    let inserted;
    try {
      inserted = await query(
        `INSERT INTO users (prenom, nom, email, mot_de_passe, role, date_inscription)
         VALUES ($1, $2, $3, $4, 'Administrateur', CURRENT_TIMESTAMP)
         RETURNING id`,
        [first, last, emailNorm, hashed]
      );
      console.log("✅ Insertion réussie, ID:", inserted.rows[0]?.id);
    } catch (insertError) {
      console.error("❌ Erreur insertion:", {
        code: insertError.code,
        message: insertError.message,
        detail: insertError.detail
      });
      
      if (insertError.code === '23505') {
        return Response.json({ 
          success: false, 
          message: 'Cette adresse email est déjà utilisée' 
        }, { status: 409 });
      }
      
      return Response.json({ 
        success: false, 
        message: "Erreur lors de l'insertion en base" 
      }, { status: 500 });
    }

    // 6. Récupération des données utilisateur
    const userId = inserted.rows[0].id;
    let userRes;
    try {
      userRes = await query('SELECT id, prenom, nom, email, role FROM users WHERE id = $1', [userId]);
      console.log("✅ Récupération utilisateur OK");
    } catch (selectError) {
      console.error("❌ Erreur récupération utilisateur:", selectError);
      // On continue quand même, l'utilisateur est créé
    }

    const user = userRes?.rows[0];

    console.log("🎉 === INSCRIPTION RÉUSSIE ===");
    return Response.json({
      success: true,
      message: 'Inscription réussie !',
      user: user ? {
        id: user.id,
        firstName: user.prenom,
        lastName: user.nom,
        email: user.email,
        role: user.role
      } : null
    }, { status: 201 });

  } catch (error) {
    console.error('💥 === ERREUR GLOBALE INSCRIPTION ===');
    console.error('Type:', error.constructor.name);
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Stack:', error.stack);

    if (error.code === '23505') {
      return Response.json({ 
        success: false, 
        message: 'Cette adresse email est déjà utilisée' 
      }, { status: 409 });
    }
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return Response.json({ 
        success: false, 
        message: 'Erreur de connexion à la base de données' 
      }, { status: 503 });
    }

    return Response.json({ 
      success: false, 
      message: "Erreur lors de l'inscription",
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  console.log("🔍 Test GET /api/register");
  console.log("ENV:", {
    NODE_ENV: process.env.NODE_ENV,
    HAS_DATABASE_URL: !!process.env.DATABASE_URL
  });
  
  return Response.json({
    message: 'Route d'inscription active',
    timestamp: new Date().toISOString(),
    path: '/api/register',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      HAS_DATABASE_URL: !!process.env.DATABASE_URL
    }
  });
}

