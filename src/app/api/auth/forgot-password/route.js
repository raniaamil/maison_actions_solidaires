// src/app/api/auth/forgot-password/route.js
export const runtime = 'nodejs';
import db from '../../../../lib/db';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Configuration du transporteur email
const createTransport = () => {
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

export async function POST(request) {
  try {
    const { email } = await request.json();

    // Validation de l'email
    if (!email || !email.trim()) {
      return Response.json(
        { error: 'L\'adresse e-mail est requise' },
        { status: 400 }
      );
    }

    const emailTrimmed = email.toLowerCase().trim();
    
    // Validation basique du format email
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(emailTrimmed)) {
      return Response.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe
    const [users] = await db.execute(
      'SELECT id, prenom, nom, email FROM users WHERE email = ? AND actif = TRUE',
      [emailTrimmed]
    );

    // Pour des raisons de sécurité, on renvoie toujours le même message
    // même si l'email n'existe pas
    if (users.length === 0) {
      console.log(`⚠️ Tentative de réinitialisation pour email inexistant: ${emailTrimmed}`);
      return Response.json(
        { message: 'Si cette adresse e-mail existe, vous recevrez un lien de réinitialisation' },
        { status: 200 }
      );
    }

    const user = users[0];

    // Générer un token de réinitialisation sécurisé
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 heure

    // Stocker le token dans la base de données
    // Créer la table si elle n'existe pas
    await db.execute(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_token (token),
        INDEX idx_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Supprimer les anciens tokens pour cet utilisateur
    await db.execute(
      'DELETE FROM password_reset_tokens WHERE user_id = ? OR expires_at < NOW()',
      [user.id]
    );

    // Insérer le nouveau token
    await db.execute(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, resetToken, resetTokenExpiry]
    );

    // Créer le lien de réinitialisation
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    // Envoyer l'email de réinitialisation
    try {
      const transport = createTransport();
      
      const mailOptions = {
        from: `"Maison d'Actions Solidaires" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: ' Réinitialisation de votre mot de passe - Maison d\'Actions Solidaires',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #8b9467 0%, #a4b070 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Réinitialisation de mot de passe</h1>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-top: none;">
              <p style="color: #333; font-size: 16px; line-height: 1.6;">Bonjour ${user.prenom},</p>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte.
                Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: linear-gradient(135deg, #8b9467 0%, #a4b070 100%); 
                          color: white; 
                          text-decoration: none; 
                          padding: 15px 30px; 
                          border-radius: 8px; 
                          font-weight: bold; 
                          display: inline-block;
                          font-size: 16px;">
                  Réinitialiser mon mot de passe
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; line-height: 1.6;">
                <strong>Ce lien est valide pendant 1 heure.</strong><br>
                Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br>
                <span style="word-break: break-all; color: #8b9467;">${resetUrl}</span>
              </p>
              
              <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
                <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">
                  Cet email a été envoyé par Maison d'Actions Solidaires<br>
                  Si vous n'avez pas demandé cette réinitialisation, veuillez nous contacter immédiatement.
                </p>
              </div>
            </div>
          </div>
        `
      };

      await transport.sendMail(mailOptions);
      console.log(`✅ Email de réinitialisation envoyé à: ${user.email}`);

    } catch (emailError) {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', emailError);
      
      // Supprimer le token si l'email n'a pas pu être envoyé
      await db.execute(
        'DELETE FROM password_reset_tokens WHERE token = ?',
        [resetToken]
      );
      
      return Response.json(
        { error: 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.' },
        { status: 500 }
      );
    }

    return Response.json(
      { message: 'Si cette adresse e-mail existe, vous recevrez un lien de réinitialisation' },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Erreur lors de la demande de réinitialisation:', error);
    return Response.json(
      { 
        error: 'Erreur serveur lors de la demande de réinitialisation',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}