// src/middleware.js — Auth (vérification de signature JWT) + CSRF (Origin/Referer) + Rate limiting login
// Compatible Edge Runtime (Vercel) : pas de Buffer, pas de setInterval, pas de Node.js APIs
// `jose` est utilisé car `jsonwebtoken` dépend du module crypto de Node, indisponible en Edge.
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const isStateChangingMethod = (m) =>
  m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE';

// Rate limiting simple pour les tentatives de login
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkLoginRateLimit(ip) {
  const now = Date.now();
  const key = `login:${ip}`;
  
  // Nettoyage paresseux à chaque appel (pas de setInterval en Edge Runtime)
  for (const [k, data] of loginAttempts.entries()) {
    if (now - data.firstAttempt > LOGIN_WINDOW_MS) {
      loginAttempts.delete(k);
    }
  }
  
  if (!loginAttempts.has(key)) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
    return true;
  }
  
  const attempts = loginAttempts.get(key);
  
  if (now - attempts.firstAttempt > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
    return true;
  }
  
  attempts.count++;
  
  if (attempts.count > MAX_LOGIN_ATTEMPTS) {
    return false;
  }
  
  return true;
}

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

// Clé de signature encodée une seule fois (Edge : TextEncoder est disponible nativement)
const getJwtKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
};

export async function middleware(request) {
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

  // --- 3) Vérification de la signature du token ---

  // Routes publiques (pas d'auth requise), par méthode.
  // ⚠️ /api/contact est public en POST (formulaire de contact du site) mais PAS en GET :
  // la lecture expose les données personnelles des visiteurs (cf. protectedWriteRoutes).
  const publicRoutes = [
    { pattern: '/api/auth/login', methods: ['POST'] },
    { pattern: '/api/auth/forgot-password', methods: ['POST'] },
    { pattern: '/api/auth/verify-reset-token', methods: ['POST'] },
    { pattern: '/api/auth/reset-password', methods: ['POST'] },
    { pattern: '/api/register', methods: ['GET', 'POST'] },
    { pattern: '/api/contact', methods: ['POST'] },
  ];

  if (publicRoutes.some((r) => r.pattern === pathname && r.methods.includes(method))) {
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

  // ⚠️ POST /api/users n'est PLUS public : cette route crée des comptes avec le rôle
  // "Administrateur" par défaut. L'inscription du grand public passe par /api/register,
  // qui force le rôle "Utilisateur".

  // Routes protégées — le middleware vérifie la signature du token ;
  // le contrôle de RÔLE est fait dans chaque route handler (runtime Node, cf. src/lib/auth.js)
  const protectedWriteRoutes = [
    { pattern: /^\/api\/actualites(?:\/.*)?$/, methods: ['POST', 'PUT', 'DELETE'] },
    // ✅ Protéger aussi GET /api/users (liste) ET /api/users/:id
    { pattern: /^\/api\/users(?:\/.*)?$/, methods: ['GET', 'POST', 'PUT', 'DELETE'] },
    { pattern: /^\/api\/comments(?:\/.*)?$/, methods: ['POST', 'PUT', 'DELETE'] },
    // ✅ GET /api/contact expose les données personnelles des visiteurs (RGPD)
    { pattern: /^\/api\/contact$/, methods: ['GET'] },
    // ✅ Upload réservé aux utilisateurs authentifiés
    { pattern: /^\/api\/upload(?:\/.*)?$/, methods: ['POST', 'DELETE'] },
  ];

  const needsAuth = protectedWriteRoutes.some(
    (route) => route.pattern.test(pathname) && route.methods.includes(method)
  );

  if (!needsAuth) {
    console.log('✅ Route non protégée');
    return NextResponse.next();
  }

  console.log('🔐 Route protégée, vérification de la signature du token...');

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    console.log('❌ Token manquant');
    return NextResponse.json({ error: "Token d'authentification requis" }, { status: 401 });
  }

  const key = getJwtKey();
  if (!key) {
    console.error('❌ JWT_SECRET non défini — refus par défaut');
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 });
  }

  // Vérification cryptographique réelle : signature + expiration (exp) + algorithme imposé.
  // `algorithms` explicite empêche une attaque par confusion d'algorithme (ex. alg:none).
  try {
    await jwtVerify(token, key, { algorithms: ['HS256'] });
  } catch {
    // Pas de log du détail : évite de fuiter de la matière exploitable
    console.log('❌ Token invalide ou expiré');
    return NextResponse.json({ error: 'Token invalide ou expiré' }, { status: 401 });
  }

  console.log('✅ Token vérifié, transmission à la route API');
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};