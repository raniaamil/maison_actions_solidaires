// src/app/api/register/route.js - Route d'inscription alternative
export const runtime = 'nodejs';
import db from '../../../lib/db';
import bcrypt from 'bcryptjs';

// POST - Inscription utilisateur (route alternative)
export async function POST(request) {
  console.log('🔄 Tentative d\'inscription...');
  
  try {
    const body = await request.json();
    console.log('📝 Données reçues:', { ...body, password: '[MASQUÉ]' });
    
    const { 
      email, 
      password,
      prenom,
      nom,
      firstName, 
      lastName
    } = body;

    // Support des deux formats de noms
    const finalPrenom = prenom || firstName;
    const finalNom = nom || lastName;

    // Validation basique
    if (!email || !password || !finalPrenom || !finalNom) {
      console.log('❌ Données manquantes');
      return Response.json({ 
        success: false,
        message: 'Tous les champs sont requis',
        missing: {
          email: !email,
          password: !password,
          prenom: !finalPrenom,
          nom: !finalNom
        }
      }, { status: 400 });
    }

    // Vérifier si utilisateur existe
    console.log('🔍 Vérification email existant...');
    const [existing] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (existing.length > 0) {
      console.log('❌ Email déjà utilisé');
      return Response.json({ 
        success: false,
        message: 'Cette adresse email est déjà utilisée'
      }, { status: 409 });
    }

    // Hacher le mot de passe
    console.log('🔐 Hachage du mot de passe...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insérer l'utilisateur
    console.log('💾 Insertion en base...');
    const [result] = await db.execute(
      `INSERT INTO users (prenom, nom, email, mot_de_passe, role, date_inscription) 
       VALUES (?, ?, ?, ?, 'Administrateur', NOW())`,
      [finalPrenom, finalNom, email.toLowerCase(), hashedPassword]
    );

    console.log('✅ Utilisateur créé avec ID:', result.insertId);

    // Récupérer l'utilisateur créé
    const [newUser] = await db.execute(
      'SELECT id, prenom, nom, email, role FROM users WHERE id = ?',
      [result.insertId]
    );

    return Response.json({
      success: true,
      message: 'Inscription réussie !',
      user: {
        id: newUser[0].id,
        prenom: newUser[0].prenom,
        nom: newUser[0].nom,
        email: newUser[0].email,
        role: newUser[0].role
      }
    }, { status: 201 });

  } catch (error) {
    console.error('💥 Erreur inscription:', error);
    
    return Response.json({ 
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
    }, { status: 500 });
  }
}

// GET - Test de la route
export async function GET() {
  return Response.json({ 
    message: 'Route d\'inscription active',
    timestamp: new Date().toISOString()
  });
}