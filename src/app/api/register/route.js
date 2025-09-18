// src/app/api/register/route.js
export const runtime = 'nodejs';

import { query } from '../../../lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  console.log("🔄 === DÉBUT INSCRIPTION ===");
  
  try {
    const body = await request.json();
    console.log("📝 Body reçu:", Object.keys(body));
    
    // 🚨 CORRECTION: Mapping correct des champs
    const { email, password, firstName, lastName, phone } = body;
    
    // Normalisation des données
    const prenom = (firstName || '').trim();  // firstName -> prenom
    const nom = (lastName || '').trim();      // lastName -> nom
    const emailNorm = (email || '').toLowerCase().trim();
    const telephone = phone?.trim() || null;

    console.log("🔍 Données mappées:", {
      prenom: prenom ? '✅' : '❌',
      nom: nom ? '✅' : '❌',
      email: emailNorm ? '✅' : '❌',
      password: password ? `✅ (${password.length} chars)` : '❌'
    });

    // Validation
    if (!emailNorm || !password || !prenom || !nom) {
      console.log("❌ Validation échouée - champs manquants");
      return Response.json({ 
        success: false, 
        message: 'Tous les champs sont requis' 
      }, { status: 400 });
    }

    if (!/\S+@\S+\.\S+/.test(emailNorm)) {
      return Response.json({ 
        success: false, 
        message: 'Veuillez entrer une adresse email valide' 
      }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json({ 
        success: false, 
        message: 'Le mot de passe doit contenir au moins 8 caractères' 
      }, { status: 400 });
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return Response.json({ 
        success: false, 
        message: 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre' 
      }, { status: 400 });
    }

    console.log("✅ Validation OK");

    // Vérification email existant
    const existing = await query('SELECT id FROM users WHERE email = $1', [emailNorm]);
    console.log(`🔍 Email check: ${existing.rows.length} résultats`);
    
    if (existing.rows.length > 0) {
      return Response.json({ 
        success: false, 
        message: 'Cette adresse email est déjà utilisée' 
      }, { status: 409 });
    }

    // Hashage du mot de passe
    console.log("🔐 Hashage du mot de passe...");
    const hashed = await bcrypt.hash(password, 10);

    // 🎯 INSERTION CORRIGÉE selon votre schéma Supabase
    console.log("💾 Insertion avec les bons champs...");
    const inserted = await query(
      `INSERT INTO users (prenom, nom, email, mot_de_passe, role, date_inscription, actif)
       VALUES ($1, $2, $3, $4, 'Administrateur', CURRENT_TIMESTAMP, true)
       RETURNING id`,
      [prenom, nom, emailNorm, hashed]
    );

    console.log("✅ Insertion réussie, ID:", inserted.rows[0]?.id);

    // Récupération des données utilisateur
    const userId = inserted.rows[0].id;
    const userRes = await query(
      'SELECT id, prenom, nom, email, role, actif FROM users WHERE id = $1', 
      [userId]
    );
    const user = userRes.rows[0];

    console.log("🎉 === INSCRIPTION RÉUSSIE ===");
    
    return Response.json({
      success: true,
      message: 'Inscription réussie !',
      user: {
        id: user.id,
        firstName: user.prenom,  // prenom -> firstName pour le frontend
        lastName: user.nom,      // nom -> lastName pour le frontend
        email: user.email,
        role: user.role,
        actif: user.actif
      }
    }, { status: 201 });

  } catch (error) {
    console.error('💥 === ERREUR GLOBALE INSCRIPTION ===');
    console.error('Type:', error.constructor.name);
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === '23505') { // unique_violation
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
  
  return Response.json({
    message: 'Route d\'inscription active',
    timestamp: new Date().toISOString(),
    path: '/api/register',
    schema: {
      expected_fields: ['firstName', 'lastName', 'email', 'password', 'phone?'],
      db_mapping: {
        firstName: 'prenom',
        lastName: 'nom',
        email: 'email',
        password: 'mot_de_passe'
      }
    }
  });
}

