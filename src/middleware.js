// src/middleware.js - VERSION SIMPLIFIÉE SANS RÔLES
import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  console.log(`🔒 Middleware: ${method} ${pathname}`);

  // Routes publiques - pas d'authentification requise
  const publicRoutes = [
    '/api/test-db',
    '/api/auth/login',
    '/api/auth/forgot-password',
    '/api/auth/verify-reset-token',
    '/api/auth/reset-password',
    '/api/register',
    '/api/contact'
  ];

  // Permettre toutes les routes publiques
  if (publicRoutes.includes(pathname)) {
    console.log('✅ Route publique autorisée');
    return NextResponse.next();
  }

  // Permettre GET /api/actualites sans authentification (lecture publique)
  if (pathname.startsWith('/api/actualites') && method === 'GET') {
    console.log('✅ Lecture actualités publique autorisée');
    return NextResponse.next();
  }

  // Permettre POST /api/users pour l'inscription (création de compte)
  if (pathname === '/api/users' && method === 'POST') {
    console.log('✅ Inscription utilisateur autorisée sans token');
    return NextResponse.next();
  }

  // Routes qui nécessitent une authentification pour certaines méthodes
  const protectedWriteRoutes = [
    { pattern: /^\/api\/actualites(?:\/.*)?$/, methods: ['POST', 'PUT', 'DELETE'] },
    { pattern: /^\/api\/users\/.*$/, methods: ['GET', 'PUT', 'DELETE'] }
  ];

  // Vérifier si la route nécessite une authentification
  const needsAuth = protectedWriteRoutes.some(route => 
    route.pattern.test(pathname) && route.methods.includes(method)
  );

  if (!needsAuth) {
    console.log('✅ Route non protégée');
    return NextResponse.next();
  }

  console.log('🔐 Route protégée, vérification du token...');

  // Vérifier le token d'authentification
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  if (!token) {
    console.log('❌ Token manquant');
    return NextResponse.json(
      { error: 'Token d\'authentification requis' }, 
      { status: 401 }
    );
  }

  try {
    // Vérification basique du token
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
    
    // SIMPLIFIÉ : Plus de vérification de rôle
    // Tous les utilisateurs connectés peuvent tout faire
    console.log('✅ Token valide, accès autorisé');
    return NextResponse.next();
  } catch (error) {
    console.error('❌ Erreur d\'authentification:', error.message);
    return NextResponse.json(
      { error: 'Token invalide ou expiré' }, 
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ['/api/:path*']
};