// src/middleware.js
import { NextResponse } from 'next/server';

const isStateChangingMethod = (m) =>
  m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE';

// Rate limiting simple pour les tentatives de login
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkLoginRateLimit(ip) {
  const now = Date.now();
  const key = `login:${ip}`;
  
  if (!loginAttempts.has(key)) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
    return true;
  }
  
  const attempts = loginAttempts.get(key);
  
  // Reset si la fenêtre de temps est dépassée
  if (now - attempts.firstAttempt > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
    return true;
  }
  
  // Incrémenter les tentatives
  attempts.count++;
  
  // Bloquer si trop de tentatives
  if (attempts.count > MAX_LOGIN_ATTEMPTS) {
    return false;
  }
  
  return true;
}

// Nettoyage périodique du cache
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of loginAttempts.entries()) {
    if (now - data.firstAttempt > LOGIN_WINDOW_MS) {
      loginAttempts.delete(key);
    }
  }
}, LOGIN_WINDOW_MS);

// Récupère l'origine du navigateur
function getRequestOrigin(request) {
  const origin = request.headers.get('origin');
  if (origin) return origin;
  const referer = request.headers.get('referer');
  try {
    if (referer) return new URL(referer).origin;
  } catch { /* ignore */ }
  return null;
}

const norm = (s) => (s ? s.replace(/\/+$/, '') : s);

// Origines autorisées
function getAllowedOrigins(request) {
  const set = new Set();
  set.add(norm(request.nextUrl.origin));
  set.add('https://maison-dactions-solidaires.fr');
  set.add('https://www.maison-dactions-solidaires.fr');
  
  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (envOrigin) set.add(norm(envOrigin));
  
  set.add('http://localhost:3000');
  set.add('http://127.0.0.1:3000');
  
  return set;
}

const CSRF_EXCLUDE_PATHS = [];
const ALLOW_NO_ORIGIN = process.env.CSRF_ALLOW_NO_ORIGIN === 'true';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Laisser passer les pré-vols CORS
  if (method === 'OPTIONS') {
    return NextResponse.next();
  }

  console.log(`🔒 Middleware: ${method} ${pathname}`);

  // --- 1) Rate limiting pour login ---
  if (pathname === '/api/auth/login' && method === 'POST') {
    const ip = request.ip || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    
    if (!checkLoginRateLimit(ip)) {
      console.warn(`❌ Rate limit dépassé pour IP: ${ip}`);
      return NextResponse.json({ 
        error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' 
      }, { status: 429 });
    }
  }

  // --- 2) CSRF (Origin/Referer) pour toutes les écritures vers /api ---
  if (pathname.startsWith('/api/') && isStateChangingMethod(method)) {
    const skip = CSRF_EXCLUDE_PATHS.some((p) => pathname.startsWith(p));
    if (!skip) {
      const requestOrigin = getRequestOrigin(request);
      const allowed = getAllowedOrigins(request);

      if (!requestOrigin) {
        if (!ALLOW_NO_ORIGIN) {
          console.warn('❌ CSRF: Origin/Referer manquant');
          return NextResponse.json({ error: 'Forbidden – CSRF check failed' }, { status: 403 });
        }
      } else if (!allowed.has(norm(requestOrigin))) {
        console.warn(`❌ CSRF: Origin refusé ${requestOrigin}`);
        return NextResponse.json({ error: 'Forbidden – CSRF check failed' }, { status: 403 });
      }
    }
  }

  // --- 3) Vérification basique de la présence du token (pas de vérification JWT) ---
  
  // Routes publiques (pas d'auth requise)
  const publicRoutes = [
    '/api/test-db',
    '/api/auth/login',
    '/api/auth/forgot-password',
    '/api/auth/verify-reset-token',
    '/api/auth/reset-password',
    '/api/register',
    '/api/contact',
  ];

  if (publicRoutes.includes(pathname)) {
    console.log('✅ Route publique autorisée');
    return NextResponse.next();
  }

  // Lecture publique des actualités
  if (pathname.startsWith('/api/actualites') && method === 'GET') {
    console.log('✅ Lecture actualités publique autorisée');
    return NextResponse.next();
  }

  // Lecture publique des commentaires
  if (pathname.startsWith('/api/comments') && method === 'GET') {
    console.log('✅ Lecture commentaires publique autorisée');
    return NextResponse.next();
  }

  // Inscription autorisée sans token
  if (pathname === '/api/users' && method === 'POST') {
    console.log('✅ Inscription utilisateur autorisée sans token');
    return NextResponse.next();
  }

  // Routes protégées - vérifier uniquement la PRÉSENCE du token
  const protectedWriteRoutes = [
    { pattern: /^\/api\/actualites(?:\/.*)?$/, methods: ['POST', 'PUT', 'DELETE'] },
    { pattern: /^\/api\/users\/.*$/, methods: ['GET', 'PUT', 'DELETE'] },
    { pattern: /^\/api\/comments(?:\/.*)?$/, methods: ['POST', 'PUT', 'DELETE'] },
  ];

  const needsAuth = protectedWriteRoutes.some(
    (route) => route.pattern.test(pathname) && route.methods.includes(method)
  );

  if (!needsAuth) {
    console.log('✅ Route non protégée');
    return NextResponse.next();
  }

  console.log('🔐 Route protégée, vérification de la présence du token...');

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    console.log('❌ Token manquant');
    return NextResponse.json({ error: "Token d'authentification requis" }, { status: 401 });
  }

  // ✅ Token présent - la vérification JWT sera faite dans chaque route API avec Node.js runtime
  console.log('✅ Token présent, redirection vers la route API pour vérification complète');
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
