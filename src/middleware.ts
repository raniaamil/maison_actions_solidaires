import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Exclure GET des routes protégées pour permettre la lecture publique
const PROTECTED_API_WRITE = [
  { pattern: /^\/api\/actualites(?:\/.*)?$/i, methods: ['POST', 'PUT', 'DELETE'] },
  { pattern: /^\/api\/users(?:\/.*)?$/i, methods: ['POST', 'PUT', 'DELETE'] }
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;

  // Permettre GET /api/actualites sans auth (lecture publique)
  if (pathname.startsWith('/api/actualites') && method === 'GET') {
    return NextResponse.next();
  }

  const needsAuth = PROTECTED_API_WRITE.some(route => 
    route.pattern.test(pathname) && route.methods.includes(method)
  );

  if (!needsAuth) return NextResponse.next();

  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  
  if (!token) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const payload = jwt.verify(token, secret) as { role?: string };
    
    // Seuls les admins peuvent gérer les utilisateurs
    if (pathname.startsWith('/api/users') && payload.role !== 'Administrateur') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    
    return NextResponse.next();
  } catch {
    return NextResponse.json({ error: 'Token invalide/expiré' }, { status: 401 });
  }
}

export const config = {
  matcher: ['/api/:path*'],
};