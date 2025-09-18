// // src/app/api/register/route.js - Route d'inscription alternative
// export const runtime = 'nodejs';
// import db from '../../../lib/db';
// import bcrypt from 'bcryptjs';

// // POST - Inscription utilisateur (route alternative)
// export async function POST(request) {
//   console.log('🔄 Tentative d\'inscription...');
  
//   try {
//     const body = await request.json();
//     console.log('📝 Données reçues:', { ...body, password: '[MASQUÉ]' });
    
//     const { 
//       email, 
//       password,
//       prenom,
//       nom,
//       firstName, 
//       lastName
//     } = body;

//     // Support des deux formats de noms
//     const finalPrenom = prenom || firstName;
//     const finalNom = nom || lastName;

//     // Validation basique
//     if (!email || !password || !finalPrenom || !finalNom) {
//       console.log('❌ Données manquantes');
//       return Response.json({ 
//         success: false,
//         message: 'Tous les champs sont requis',
//         missing: {
//           email: !email,
//           password: !password,
//           prenom: !finalPrenom,
//           nom: !finalNom
//         }
//       }, { status: 400 });
//     }

//     // Vérifier si utilisateur existe
//     console.log('🔍 Vérification email existant...');
//     const existingResult = await db.query(
//       'SELECT id FROM users WHERE email = $1',
//       [email.toLowerCase()]
//     );

//     if (existingResult.rows.length > 0) {
//       console.log('❌ Email déjà utilisé');
//       return Response.json({ 
//         success: false,
//         message: 'Cette adresse email est déjà utilisée'
//       }, { status: 409 });
//     }

//     // Hacher le mot de passe
//     console.log('🔐 Hachage du mot de passe...');
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Insérer l'utilisateur (PostgreSQL avec RETURNING)
//     console.log('💾 Insertion en base...');
//     const insertResult = await db.query(
//       `INSERT INTO users (prenom, nom, email, mot_de_passe, role, date_inscription) 
//        VALUES ($1, $2, $3, $4, 'Administrateur', CURRENT_TIMESTAMP)
//        RETURNING id`,
//       [finalPrenom, finalNom, email.toLowerCase(), hashedPassword]
//     );

//     const userId = insertResult.rows[0].id;
//     console.log('✅ Utilisateur créé avec ID:', userId);

//     // Récupérer l'utilisateur créé
//     const userResult = await db.query(
//       'SELECT id, prenom, nom, email, role FROM users WHERE id = $1',
//       [userId]
//     );

//     const newUser = userResult.rows[0];

//     return Response.json({
//       success: true,
//       message: 'Inscription réussie !',
//       user: {
//         id: newUser.id,
//         prenom: newUser.prenom,
//         nom: newUser.nom,
//         email: newUser.email,
//         role: newUser.role
//       }
//     }, { status: 201 });

//   } catch (error) {
//     console.error('💥 Erreur inscription:', error);
    
//     // Gestion des erreurs spécifiques PostgreSQL
//     if (error.code === '23505') { // unique_violation
//       return Response.json({ 
//         success: false,
//         message: 'Cette adresse email est déjà utilisée'
//       }, { status: 409 });
//     }
    
//     return Response.json({ 
//       success: false,
//       message: 'Erreur lors de l\'inscription',
//       error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
//     }, { status: 500 });
//   }
// }

// // GET - Test de la route
// export async function GET() {
//   return Response.json({ 
//     message: 'Route d\'inscription active',
//     timestamp: new Date().toISOString()
//   });
// }