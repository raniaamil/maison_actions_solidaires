// src/app/api/contact/route.js
export const runtime = 'nodejs';
import db from '../../../lib/db';
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

// POST - Traiter le formulaire de contact
export async function POST(request) {
  try {
    console.log('📧 Réception d\'un message de contact...');
    
    const body = await request.json();
    const { 
      firstname, 
      surname, 
      email, 
      subject, 
      message, 
      notRobot 
    } = body;

    console.log('📝 Données reçues:', { firstname, surname, email, subject });

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
      console.log('❌ Erreurs de validation:', errors);
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

    // Insérer le message en base
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

    console.log('✅ Message sauvegardé en base avec l\'ID:', result.insertId);

    // Envoi de l'email de notification
    try {
      const transporter = createTransporter();
      
      // Email de notification à l'association
      const mailOptions = {
        from: `"Site Web MAACSO" <${process.env.SMTP_USER}>`,
        to: process.env.CONTACT_EMAIL,
        subject: `🆕 Nouveau message de contact: ${subject.trim()}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #838C58; border-bottom: 2px solid #838C58; padding-bottom: 10px;">
              Nouveau message de contact
            </h2>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Informations de contact</h3>
              <p><strong>Nom :</strong> ${firstname} ${surname}</p>
              <p><strong>Email :</strong> <a href="mailto:${email}">${email}</a></p>
              <p><strong>Sujet :</strong> ${subject}</p>
              <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</p>
            </div>
            
            <div style="background-color: #fff; padding: 20px; border-left: 4px solid #838C58; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Message</h3>
              <p style="line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
            
            <div style="font-size: 12px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p>ID du message : ${result.insertId}</p>
              <p>IP : ${ipAddress}</p>
              <p>Ce message a été envoyé via le formulaire de contact du site web de MAACSO.</p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('✅ Email de notification envoyé à l\'association');

      // Email de confirmation à l'expéditeur
      const confirmationOptions = {
        from: `"Maison d'Actions Solidaires" <${process.env.SMTP_USER}>`,
        to: email,
        subject: '✅ Confirmation de réception de votre message - MAACSO',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #838C58; border-bottom: 2px solid #838C58; padding-bottom: 10px;">
              Merci pour votre message !
            </h2>
            
            <p>Bonjour ${firstname},</p>
            
            <p>Nous avons bien reçu votre message concernant "<strong>${subject}</strong>" et nous vous en remercions.</p>
            
            <div style="background-color: #f0f9f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #2d5a2d;">
                <strong>Notre équipe vous répondra dans les plus brefs délais, généralement sous 48h ouvrées.</strong>
              </p>
            </div>
            
            <p>Voici un récapitulatif de votre message :</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #838C58; margin: 15px 0;">
              <p style="margin: 0; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
            
            <hr style="border: none; height: 1px; background-color: #eee; margin: 30px 0;">
            
            <div style="font-size: 14px; color: #666;">
              <p><strong>Maison d'Actions Solidaires</strong></p>
              <p>📧 Email : maisondactionsolidaire@gmail.com</p>
              <p>📞 Téléphone : 07 82 16 90 08</p>
              <p>📍 Adresse : 12 rue de la Corne de Bœuf, 94500 Champigny-sur-Marne</p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(confirmationOptions);
      console.log('✅ Email de confirmation envoyé à l\'expéditeur');

    } catch (emailError) {
      console.error('❌ Erreur lors de l\'envoi des emails:', emailError);
      // Ne pas faire échouer la requête si l'email échoue
    }

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