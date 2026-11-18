// src/app/api/contact/route.js
export const runtime = 'nodejs';
import { query } from '../../../lib/db';
import { requireEditor } from '../../../lib/auth';
import { createMailTransport, MAIL_FROM } from '../../../lib/mailer';
import { createHash, randomBytes } from 'crypto';

// 🛡️ Anti-spam sans service tiers (remplace la fausse case « Je ne suis pas un robot »).
// 1) Champ piège `website` : invisible pour un humain, souvent rempli par les robots.
// 2) Limitation des envois, sans jamais écrire d'adresse IP en base :
//    - par client : empreinte salée de l'IP, gardée UNIQUEMENT en mémoire du processus
//      (sel aléatoire régénéré à chaque démarrage, entrée oubliée après la fenêtre) ;
//    - par adresse e-mail et au total : comptage dans contact_messages (données déjà stockées).
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 heure
const MAX_PER_CLIENT = 3;   // messages par client et par heure (par instance serveur)
const MAX_PER_EMAIL = 3;    // messages par adresse e-mail et par heure
const MAX_GLOBAL = 30;      // messages par heure, tous expéditeurs confondus
const CLIENT_SALT = randomBytes(16);
const recentByClient = new Map(); // empreinte -> horodatages des envois acceptés

function clientKey(request) {
  const forwarded = request.headers.get('x-forwarded-for') || '';
  const ip = forwarded.split(',')[0].trim() || request.headers.get('x-real-ip') || 'inconnu';
  return createHash('sha256').update(CLIENT_SALT).update(ip).digest('hex');
}

function clientOverLimit(key, now) {
  // Nettoyage paresseux : on oublie les envois sortis de la fenêtre
  for (const [k, stamps] of recentByClient) {
    const kept = stamps.filter((t) => now - t < RATE_WINDOW_MS);
    if (kept.length) recentByClient.set(k, kept); else recentByClient.delete(k);
  }
  return (recentByClient.get(key) || []).length >= MAX_PER_CLIENT;
}

// 🔐 Échappement HTML des saisies du visiteur avant insertion dans les e-mails : sans cela,
// n'importe qui peut injecter du HTML (liens de hameçonnage) dans l'e-mail de confirmation,
// envoyé depuis l'adresse de l'association à l'adresse saisie dans le formulaire.
const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const tooManyRequests = () => Response.json({
  success: false,
  message: "Trop de messages envoyés. Réessayez plus tard ou écrivez-nous à maisondactionsolidaire@gmail.com."
}, { status: 429 });

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
      website
    } = body;

    // Champ piège rempli : on répond comme un succès sans rien enregistrer ni envoyer,
    // pour ne pas indiquer au robot qu'il a été détecté.
    if (website) {
      return Response.json({
        success: true,
        message: 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.'
      }, { status: 201 });
    }

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

    if (Object.keys(errors).length > 0) {
      console.log('❌ Erreurs de validation:', errors);
      return Response.json({ 
        success: false,
        message: 'Données manquantes ou invalides',
        errors
      }, { status: 400 });
    }

    // Limitation par client (mémoire du processus uniquement)
    const now = Date.now();
    const key = clientKey(request);
    if (clientOverLimit(key, now)) {
      return tooManyRequests();
    }

    // Création de la table des messages si elle n'existe pas (PostgreSQL)
    await query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        prenom VARCHAR(100) NOT NULL,
        nom VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        sujet VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        statut VARCHAR(10) DEFAULT 'nouveau' CHECK (statut IN ('nouveau', 'lu', 'traite'))
      )
    `);

    // Créer les index s'ils n'existent pas
    await query(`CREATE INDEX IF NOT EXISTS idx_contact_email ON contact_messages (email)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_contact_date ON contact_messages (date_creation)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_contact_statut ON contact_messages (statut)`);

    // Limitation par adresse e-mail et globale (comptage sur la dernière heure)
    const recent = await query(
      `SELECT COUNT(*) FILTER (WHERE email = $1)::int AS par_email, COUNT(*)::int AS total
       FROM contact_messages
       WHERE date_creation > NOW() - INTERVAL '1 hour'`,
      [email.toLowerCase().trim()]
    );
    if (recent.rows[0].par_email >= MAX_PER_EMAIL || recent.rows[0].total >= MAX_GLOBAL) {
      return tooManyRequests();
    }
    recentByClient.set(key, [...(recentByClient.get(key) || []), now]);

    // Insérer le message en base (PostgreSQL avec RETURNING).
    // 🔐 Minimisation (RGPD) : ni l'adresse IP ni le user-agent ne sont conservés,
    // aucun traitement du site n'en a besoin.
    const result = await query(
      `INSERT INTO contact_messages
       (prenom, nom, email, sujet, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        firstname.trim(),
        surname.trim(),
        email.toLowerCase().trim(),
        subject.trim(),
        message.trim()
      ]
    );

    const messageId = result.rows[0].id;
    console.log('✅ Message sauvegardé en base avec l\'ID:', messageId);

    // Envoi de l'email de notification
    try {
      const safe = {
        firstname: escapeHtml(firstname.trim()),
        surname: escapeHtml(surname.trim()),
        email: escapeHtml(email.trim()),
        subject: escapeHtml(subject.trim()),
        message: escapeHtml(message.trim()),
      };
      const transport = createMailTransport();
      
      // Email de notification à l'association
      const mailOptions = {
        from: MAIL_FROM,
        to: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
        subject: `Nouveau message: ${subject.trim()}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto;">
            <h2 style="color: #838C58; border-bottom: 2px solid #838C58; padding-bottom: 10px;">
              Nouveau message de contact
            </h2>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Informations de contact</h3>
              <p><strong>Nom :</strong> ${safe.firstname} ${safe.surname}</p>
              <p><strong>Email :</strong> <a href="mailto:${safe.email}">${safe.email}</a></p>
              <p><strong>Sujet :</strong> ${safe.subject}</p>
              <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}</p>
            </div>
            
            <div style="background-color: #fff; padding: 20px; border-left: 4px solid #838C58; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Message</h3>
              <p style="line-height: 1.6; white-space: pre-wrap;">${safe.message}</p>
            </div>
            
            <div style="font-size: 12px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p>Ce message a été envoyé via le formulaire de contact du site web.</p>
            </div>
          </div>
        `
      };

      await transport.sendMail(mailOptions);
      console.log('✅ Email de notification envoyé à l\'association');

      // Email de confirmation à l'expéditeur
      const confirmationOptions = {
        from: MAIL_FROM,
        to: email,
        subject: 'Confirmation de réception de votre message - Maison d\'Actions Solidaires',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto;">
            <h2 style="color: #838C58; border-bottom: 2px solid #838C58; padding-bottom: 10px;">
              Merci pour votre message !
            </h2>
            
            <p>Bonjour ${safe.firstname},</p>
            
            <p>Nous avons bien reçu votre message concernant "<strong>${safe.subject}</strong>" et nous vous en remercions.</p>
            
            <div style="background-color: #f0f9f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #2d5a2d;">
                <strong>Notre équipe vous répondra dans les plus brefs délais, généralement sous 48h ouvrées.</strong>
              </p>
            </div>
            
            <p>Voici un récapitulatif de votre message :</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #838C58; margin: 15px 0;">
              <p style="margin: 0; line-height: 1.6; white-space: pre-wrap;">${safe.message}</p>
            </div>
            
            <hr style="border: none; height: 1px; background-color: #eee; margin: 30px 0;">
          </div>
        `,
      };

      await transport.sendMail(confirmationOptions);
      console.log('✅ Email de confirmation envoyé à l\'expéditeur');

    } catch (emailError) {
      console.error('❌ Erreur lors de l\'envoi des emails:', emailError?.message);
      // Ne pas faire échouer la requête si l'email échoue
      // Le message est bien sauvegardé en base
    }

    return Response.json({
      success: true,
      message: 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
      messageId: messageId
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Erreur lors du traitement du formulaire de contact:', error?.message);
    
    if (error.code === '22001') {
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
    // 🔐 Ces messages contiennent des données personnelles de visiteurs (nom, email,
    // contenu du message) : accès réservé aux rôles Administrateur / Rédacteur (RGPD).
    const { error } = requireEditor(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    // Vérifier que la table existe
    try {
      await query('SELECT 1 FROM contact_messages LIMIT 1');
    } catch (tableError) {
      if (tableError.code === '42P01') {
        return Response.json([]);
      }
      throw tableError;
    }

    let queryText = `
      SELECT 
        id, prenom, nom, email, sujet, message, 
        date_creation, statut,
        SUBSTRING(message, 1, 150) as apercu_message
      FROM contact_messages
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (statut && ['nouveau', 'lu', 'traite'].includes(statut)) {
      queryText += ` AND statut = $${paramIndex}`;
      params.push(statut);
      paramIndex++;
    }

    queryText += ` ORDER BY date_creation DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);
    const messages = result.rows;

    const formattedMessages = messages.map(msg => ({
      ...msg,
      date_creation: msg.date_creation ? new Date(msg.date_creation).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' }) : '',
      apercu_message: msg.apercu_message + (msg.message && msg.message.length > 150 ? '...' : '')
    }));

    return Response.json(formattedMessages);

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des messages:', error?.message);
    return Response.json(
      { 
        error: 'Erreur serveur lors de la récupération des messages',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}