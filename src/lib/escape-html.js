// src/lib/escape-html.js — Échappement HTML des valeurs insérées dans les e-mails
//
// Sans échappement, une valeur saisie (prénom, message, etc.) peut injecter du HTML,
// par exemple des liens de hameçonnage, dans un e-mail envoyé au nom de l'association.
export const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');
