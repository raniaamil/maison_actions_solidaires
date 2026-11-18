// src/app/api/auth/forgot-password/route.js
export const runtime = 'nodejs';
import { query } from '../../../../lib/db';
import { createMailTransport, MAIL_FROM } from '../../../../lib/mailer';
import { createResetToken, hashResetToken } from '../../../../lib/reset-token';

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
    
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(emailTrimmed)) {
      return Response.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe
    const result = await query(
      'SELECT id, prenom, nom, email FROM users WHERE email = $1 AND actif = true',
      [emailTrimmed]
    );

    // Pour des raisons de sécurité, on renvoie toujours le même message
    if (result.rows.length === 0) {
      console.log('⚠️ Demande de réinitialisation pour une adresse inconnue');
      return Response.json(
        { message: 'Si cette adresse e-mail existe, vous recevrez un lien de réinitialisation' },
        { status: 200 }
      );
    }

    const user = result.rows[0];

    // Générer un token (1 heure) : seule son empreinte SHA-256 est stockée en base
    const resetToken = await createResetToken(user.id);

    // Créer le lien de réinitialisation
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://maison-dactions-solidaires.fr';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    // Envoyer l'email de réinitialisation
    try {
      const transport = createMailTransport();
      
      const mailOptions = {
        from: MAIL_FROM,
        to: user.email,
        subject: 'Réinitialisation de votre mot de passe - Maison d\'Actions Solidaires',
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
      console.log('✅ Email de réinitialisation envoyé');

    } catch (emailError) {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', emailError?.message);
      
      // Supprimer le token si l'email n'a pas pu être envoyé
      await query(
        'DELETE FROM password_reset_tokens WHERE token = $1',
        [hashResetToken(resetToken)]
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
    console.error('❌ Erreur lors de la demande de réinitialisation:', error?.message);
    return Response.json(
      { 
        error: 'Erreur serveur lors de la demande de réinitialisation',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}