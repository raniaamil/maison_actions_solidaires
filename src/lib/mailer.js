// src/lib/mailer.js — Transporteur SMTP partagé (runtime Node.js)
//
// Centralise la configuration jusque-là dupliquée à l'identique dans
// /api/contact, /api/auth/forgot-password et /api/users.
import nodemailer from 'nodemailer';

/**
 * Crée un transporteur SMTP à partir des variables d'environnement.
 *
 * ⚠️ La validation du certificat TLS est volontairement laissée ACTIVE (défaut de
 * nodemailer 9). Le code précédent forçait `tls: { rejectUnauthorized: false }`,
 * ce qui acceptait n'importe quel certificat et exposait les identifiants SMTP à
 * une interception active. Le serveur utilisé (smtp.gmail.com) présente un
 * certificat valide : ce contournement n'avait aucune utilité.
 */
export function createMailTransport() {
  const port = parseInt(process.env.SMTP_PORT || '587', 10);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 = TLS implicite ; 587 = STARTTLS (secure doit valoir false)
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/** Expéditeur affiché, commun à tous les envois. */
export const MAIL_FROM = `"Maison d'Actions Solidaires" <${process.env.SMTP_USER}>`;
