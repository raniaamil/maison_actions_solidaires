// src/app/api/contact/route.js
export const runtime = 'nodejs';
import db from '../../../lib/db';

// POST - Traiter le formulaire de contact
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      firstname, 
      surname, 
      email, 
      subject, 
      message, 
      notRobot 
    } = body;

    // Validation des données
    const errors = {};
    
    if (!firstname || !firstname.trim()) {
      errors.firstname = 'Le prénom est requis';
    }
    
    if (!surname || !surname.trim()) {
      errors.surname = 'Le nom est requis';
    }
    
    if (!email || !email.trim()) {
      errors.email = 'L\'email est requis';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.email = 'L\'adresse e-mail n\'est pas valide';
      }
    }
    
    if (!subject || !subject.trim()) {
      errors.subject = 'Le sujet est requis';
    }
    
    if (!message || !message.trim()) {
      errors.message = 'Le message est requis';
    }
    
    if (!notRobot) {
      errors.notRobot = 'Veuillez confirmer que vous n\'êtes pas un robot';
    }

    if (Object.keys(errors).length > 0) {
      return Response.json({ 
        success: false,
        message: 'Données manquantes ou invalides',
        errors
      }, { status: 400 });
    }

    // Création de la table des messages si elle n'existe pas
    await db.execute(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        prenom VARCHAR(100) NOT NULL,
        nom VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        sujet VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        user_agent TEXT DEFAULT NULL,
        date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
        statut ENUM('nouveau', 'lu', 'traite') DEFAULT 'nouveau',
        INDEX idx_email (email),
        INDEX idx_date (date_creation),
        INDEX idx_statut (statut)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Récupérer l'IP et user agent
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Insérer le message
    const [result] = await db.execute(
      `INSERT INTO contact_messages 
       (prenom, nom, email, sujet, message, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        firstname.trim(),
        surname.trim(),
        email.toLowerCase().trim(),
        subject.trim(),
        message.trim(),
        ipAddress,
        userAgent
      ]
    );

    console.log('✅ Message de contact reçu:', {
      id: result.insertId,
      email: email.trim(),
      sujet: subject.trim()
    });

    // Ici on pourrait ajouter :
    // 1. Envoi d'email de notification à l'admin
    // 2. Envoi d'email de confirmation à l'utilisateur
    // 3. Intégration avec un service de ticketing

    return Response.json({
      success: true,
      message: 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
      messageId: result.insertId
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Erreur lors du traitement du formulaire de contact:', error);
    
    // Gestion des erreurs spécifiques
    if (error.code === 'ER_DATA_TOO_LONG') {
      return Response.json({ 
        success: false,
        message: 'Données trop longues',
        errors: { general: 'Un ou plusieurs champs contiennent trop de caractères' }
      }, { status: 400 });
    }

    return Response.json({ 
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue lors de l\'envoi de votre message'
    }, { status: 500 });
  }
}

// GET - Récupérer les messages de contact (pour l'admin)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    // Vérifier que la table existe
    try {
      await db.execute('SELECT 1 FROM contact_messages LIMIT 1');
    } catch (tableError) {
      if (tableError.code === 'ER_NO_SUCH_TABLE') {
        return Response.json([]);
      }
      throw tableError;
    }

    let query = `
      SELECT 
        id, prenom, nom, email, sujet, message, 
        date_creation, statut,
        SUBSTRING(message, 1, 150) as apercu_message
      FROM contact_messages
      WHERE 1=1
    `;
    
    const params = [];

    if (statut && ['nouveau', 'lu', 'traite'].includes(statut)) {
      query += ' AND statut = ?';
      params.push(statut);
    }

    query += ' ORDER BY date_creation DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [messages] = await db.execute(query, params);

    // Formater les données
    const formattedMessages = messages.map(msg => ({
      ...msg,
      date_creation: msg.date_creation ? new Date(msg.date_creation).toLocaleDateString('fr-FR') : '',
      apercu_message: msg.apercu_message + (msg.message.length > 150 ? '...' : '')
    }));

    return Response.json(formattedMessages);

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des messages:', error);
    return Response.json(
      { 
        error: 'Erreur serveur lors de la récupération des messages',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}