import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const PROTECTED_API = [
  /^\/api\/actualites(?:\/.*)?$/i,
  /^\/api\/users(?:\/.*)?$/i,
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const needsAuth = PROTECTED_API.some(rx => rx.test(pathname));
  if (!needsAuth) return NextResponse.next();

  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    const secret = process.env.JWT_SECRET!;
    const payload = jwt.verify(token, secret) as { role?: string };
    // Règles d’accès plus fines pour /api/users
    if (pathname.startsWith('/api/users') && payload.role !== 'Administrateur') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    // Pour /api/actualites, tu peux laisser Rédacteur + Admin
    return NextResponse.next();
  } catch {
    return NextResponse.json({ error: 'Token invalide/expiré' }, { status: 401 });
  }
}

export const config = {
  matcher: ['/api/:path*'],
};
