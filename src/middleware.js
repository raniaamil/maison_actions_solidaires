import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Routes publiques - pas d'authentification requise
  const publicRoutes = [
    '/api/test-db',
    '/api/auth/login'
  ];

  // Routes qui nécessitent une authentification pour certaines méthodes
  const protectedWriteRoutes = [
    { pattern: /^\/api\/actualites(?:\/.*)?$/, methods: ['POST', 'PUT', 'DELETE'] },
    { pattern: /^\/api\/users(?:\/.*)?$/, methods: ['POST', 'PUT', 'DELETE'] }
  ];

  // Permettre toutes les routes publiques
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Permettre GET /api/actualites sans authentification (lecture publique)
  if (pathname.startsWith('/api/actualites') && method === 'GET') {
    return NextResponse.next();
  }

  // Vérifier si la route nécessite une authentification
  const needsAuth = protectedWriteRoutes.some(route => 
    route.pattern.test(pathname) && route.methods.includes(method)
  );

  if (!needsAuth) {
    return NextResponse.next();
  }

  // Vérifier le token d'authentification
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  if (!token) {
    return NextResponse.json(
      { error: 'Token d\'authentification requis' }, 
      { status: 401 }
    );
  }

  try {
    // Vérification basique du token (en production, utiliser jsonwebtoken)
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    
    // Décoder le token (version simplifiée)
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Token invalide');
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString()
    );

    // Vérifier l'expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      throw new Error('Token expiré');
    }
    
    // Vérifier les permissions pour les routes utilisateurs
    if (pathname.startsWith('/api/users') && payload.role !== 'Administrateur') {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' }, 
        { status: 403 }
      );
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error.message);
    return NextResponse.json(
      { error: 'Token invalide ou expiré' }, 
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ['/api/:path*']
};