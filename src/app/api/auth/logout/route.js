// src/app/api/auth/logout/route.js
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { AUTH_COOKIE, authCookieOptions } from '../../../../lib/auth';

// POST - Déconnexion : expire le cookie de session côté serveur.
//
// Le cookie étant HttpOnly, le JavaScript de la page ne peut pas le supprimer
// lui-même : la déconnexion DOIT passer par le serveur.
export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Déconnexion réussie',
  });

  // maxAge: 0 + valeur vide => le navigateur supprime immédiatement le cookie.
  // Les autres attributs (path, sameSite, secure...) doivent correspondre à ceux
  // posés au login, sinon le navigateur ne remplacerait pas le bon cookie.
  response.cookies.set(AUTH_COOKIE, '', authCookieOptions(0));

  return response;
}
