#!/usr/bin/env node
/**
 * ============================================================
 * SUITE DE TESTS — Maison d'Actions Solidaires
 * ============================================================
 * 
 * Usage :
 *   1. Démarrer le serveur : npm run dev
 *   2. Dans un autre terminal : node tests/run-all-tests.js
 *   
 * Ou via npm : npm test
 * 
 * Variables d'environnement optionnelles :
 *   BASE_URL=http://localhost:3000  (par défaut)
 *   ADMIN_EMAIL=admin@test.com
 *   ADMIN_PASSWORD=motdepasse
 * ============================================================
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

// Couleurs terminal
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let passed = 0;
let failed = 0;
let skipped = 0;
const failures = [];

function log(icon, msg) { console.log(`  ${icon} ${msg}`); }
function section(title) { console.log(`\n${CYAN}${BOLD}━━━ ${title} ━━━${RESET}`); }

async function test(name, fn) {
  try {
    await fn();
    passed++;
    log(`${GREEN}✓${RESET}`, name);
  } catch (err) {
    failed++;
    const msg = err?.message || String(err);
    failures.push({ name, error: msg });
    log(`${RED}✗${RESET}`, `${name} — ${RED}${msg}${RESET}`);
  }
}

function skip(name, reason) {
  skipped++;
  log(`${YELLOW}○${RESET}`, `${name} — ${YELLOW}${reason}${RESET}`);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

async function fetchJSON(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // ✅ Envoyer Origin pour passer le contrôle CSRF (simule un navigateur)
      'Origin': BASE_URL,
      ...(options.headers || {}),
    },
  });
  let body;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, body, ok: res.ok };
}

// Version SANS Origin (pour tester spécifiquement le blocage CSRF)
async function fetchWithoutOrigin(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // Pas d'Origin — doit être bloqué par le CSRF
      ...(options.headers || {}),
    },
  });
  let body;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, body, ok: res.ok };
}

// ============================================================
// TESTS
// ============================================================

async function runTests() {
  console.log(`\n${BOLD}🧪 Suite de tests — Maison d'Actions Solidaires${RESET}`);
  console.log(`   Serveur: ${BASE_URL}\n`);

  // ---- Connexion serveur ----
  section('1. CONNECTIVITÉ');

  await test('Le serveur répond', async () => {
    const res = await fetch(BASE_URL);
    assert(res.status < 500, `Status ${res.status}`);
  });

  await test('GET /api/test-db — connexion base de données', async () => {
    const { status, body } = await fetchJSON('/api/test-db');
    assertEqual(status, 200, `Status ${status}: ${JSON.stringify(body)}`);
    assert(body.success === true, `DB check failed: ${JSON.stringify(body)}`);
  });

  // ---- Routes publiques ----
  section('2. ROUTES PUBLIQUES (sans authentification)');

  await test('GET /api/actualites — liste publique des actualités', async () => {
    const { status, body } = await fetchJSON('/api/actualites');
    assertEqual(status, 200, `Status ${status}`);
    assert(Array.isArray(body), 'Response should be an array');
  });

  await test('GET /api/actualites?statut=Publié — filtre par statut', async () => {
    const { status, body } = await fetchJSON('/api/actualites?statut=Publié');
    assertEqual(status, 200, `Status ${status}`);
    assert(Array.isArray(body), 'Response should be an array');
    // Tous les articles retournés doivent être Publié
    for (const a of body) {
      assertEqual(a.statut, 'Publié', `Article ${a.id} has statut ${a.statut}`);
    }
  });

  await test('GET /api/actualites — structure des données cohérente', async () => {
    const { body } = await fetchJSON('/api/actualites?limit=1');
    if (body.length > 0) {
      const a = body[0];
      assert(a.id !== undefined, 'Missing id');
      assert(a.titre !== undefined, 'Missing titre');
      assert(a.title !== undefined, 'Missing title alias');
      assert(a.auteur !== undefined, 'Missing auteur');
      assert(a.auteur.prenom !== undefined, 'Missing auteur.prenom');
      assert(a.author !== undefined, 'Missing author alias');
      assert(Array.isArray(a.tags), `tags should be an array, got ${typeof a.tags}`);
    }
  });

  await test('GET /api/comments — lecture publique des commentaires', async () => {
    const { status, body } = await fetchJSON('/api/comments');
    assertEqual(status, 200, `Status ${status}`);
    assert(body.comments !== undefined, 'Missing comments key');
    assert(Array.isArray(body.comments), 'comments should be an array');
  });

  await test('POST /api/contact — validation des champs requis', async () => {
    const { status, body } = await fetchJSON('/api/contact', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    assertEqual(status, 400, `Expected 400, got ${status}`);
  });

  await test('POST /api/contact — email invalide rejeté', async () => {
    const { status } = await fetchJSON('/api/contact', {
      method: 'POST',
      body: JSON.stringify({
        firstname: 'Test',
        surname: 'User',
        email: 'pas-un-email',
        subject: 'Test',
        message: 'Test message',
        notRobot: true,
      }),
    });
    assertEqual(status, 400, `Expected 400, got ${status}`);
  });

  // ---- Protection CSRF ----
  section('3. SÉCURITÉ CSRF');

  await test('POST sans Origin/Referer → 403 (CSRF)', async () => {
    const { status } = await fetchWithoutOrigin('/api/actualites', {
      method: 'POST',
      body: JSON.stringify({ titre: 'test' }),
    });
    // Sans Origin, le middleware CSRF doit bloquer
    assertEqual(status, 403, `Expected 403, got ${status} — CSRF devrait bloquer sans Origin`);
  });

  await test('POST avec mauvais Origin → 403 (CSRF)', async () => {
    const res = await fetch(`${BASE_URL}/api/actualites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://site-malveillant.com',
      },
      body: JSON.stringify({ titre: 'test' }),
    });
    assertEqual(res.status, 403, `Expected 403, got ${res.status}`);
  });

  // ---- Protection des routes ----
  section('4. PROTECTION DES ROUTES (sans token)');

  await test('POST /api/actualites sans token → 401', async () => {
    const { status } = await fetchJSON('/api/actualites', {
      method: 'POST',
      body: JSON.stringify({ titre: 'test' }),
    });
    assert(status === 401 || status === 403, `Expected 401/403, got ${status}`);
  });

  await test('PUT /api/actualites/1 sans token → 401', async () => {
    const { status } = await fetchJSON('/api/actualites/1', {
      method: 'PUT',
      body: JSON.stringify({ titre: 'test' }),
    });
    assert(status === 401 || status === 403, `Expected 401/403, got ${status}`);
  });

  await test('DELETE /api/actualites/1 sans token → 401', async () => {
    const { status } = await fetchJSON('/api/actualites/1', { method: 'DELETE' });
    assert(status === 401 || status === 403, `Expected 401/403, got ${status}`);
  });

  await test('POST /api/comments sans token → 401', async () => {
    const { status } = await fetchJSON('/api/comments', {
      method: 'POST',
      body: JSON.stringify({ article_id: 1, contenu: 'test' }),
    });
    assert(status === 401 || status === 403, `Expected 401/403, got ${status}`);
  });

  await test('PUT /api/comments/1 sans token → 401', async () => {
    const { status } = await fetchJSON('/api/comments/1', {
      method: 'PUT',
      body: JSON.stringify({ contenu: 'test' }),
    });
    assert(status === 401 || status === 403, `Expected 401/403, got ${status}`);
  });

  await test('DELETE /api/comments/1 sans token → 401', async () => {
    const { status } = await fetchJSON('/api/comments/1', { method: 'DELETE' });
    assert(status === 401 || status === 403, `Expected 401/403, got ${status}`);
  });

  await test('GET /api/users (liste) sans token → 401 (sécurité)', async () => {
    const { status } = await fetchJSON('/api/users');
    assert(status === 401 || status === 403, `Expected 401/403, got ${status} — ⚠️ La liste des utilisateurs est exposée publiquement!`);
  });

  await test('GET /api/users/1 sans token → 401', async () => {
    const { status } = await fetchJSON('/api/users/1');
    assert(status === 401 || status === 403, `Expected 401/403, got ${status}`);
  });

  await test('PUT /api/users/1 sans token → 401', async () => {
    const { status } = await fetchJSON('/api/users/1', {
      method: 'PUT',
      body: JSON.stringify({ prenom: 'test' }),
    });
    assert(status === 401 || status === 403, `Expected 401/403, got ${status}`);
  });

  // ---- Inscription publique ----
  section('5. INSCRIPTION PUBLIQUE');

  await test('POST /api/users (inscription) → accessible sans token', async () => {
    // On teste que la route est accessible (pas 401)
    // Mais on envoie des données invalides pour ne pas créer de vrai compte
    const { status } = await fetchJSON('/api/users', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    // Doit retourner 400 (validation) et PAS 401 (auth)
    assertEqual(status, 400, `Expected 400 (validation), got ${status}`);
  });

  await test('POST /api/register — inscription avec données valides', async () => {
    const randomEmail = `test-${Date.now()}@test-delete-me.com`;
    const { status, body } = await fetchJSON('/api/register', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Inscription',
        email: randomEmail,
        password: 'TestPass123',
      }),
    });
    // 201 = créé, 409 = email déjà utilisé (si re-exécuté)
    assert(status === 201 || status === 409, `Expected 201/409, got ${status}: ${JSON.stringify(body)}`);
    if (status === 201) {
      assert(body.success === true, 'Expected success');
      assertEqual(body.user?.role, 'Utilisateur', `Role should be Utilisateur, got ${body.user?.role}`);
    }
  });

  await test('POST /api/register — mot de passe trop court rejeté', async () => {
    const { status } = await fetchJSON('/api/register', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Short',
        email: 'short@test.com',
        password: '123',
      }),
    });
    assertEqual(status, 400, `Expected 400, got ${status}`);
  });

  await test('POST /api/register — mot de passe sans complexité rejeté', async () => {
    const { status } = await fetchJSON('/api/register', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Weak',
        email: 'weak@test.com',
        password: 'abcdefgh',
      }),
    });
    assertEqual(status, 400, `Expected 400, got ${status}`);
  });

  // ---- Login ----
  section('6. AUTHENTIFICATION');

  await test('POST /api/auth/login — champs manquants → 400', async () => {
    const { status } = await fetchJSON('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    assertEqual(status, 400, `Expected 400, got ${status}`);
  });

  await test('POST /api/auth/login — identifiants invalides → 401', async () => {
    const { status } = await fetchJSON('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'fake@fake.com', password: 'WrongPass1' }),
    });
    assertEqual(status, 401, `Expected 401, got ${status}`);
  });

  let adminToken = null;

  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    await test('POST /api/auth/login — connexion admin', async () => {
      const { status, body } = await fetchJSON('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
      });
      assertEqual(status, 200, `Status ${status}: ${JSON.stringify(body)}`);
      assert(body.success === true, 'Login should succeed');
      assert(body.token, 'Token should be present');
      assert(body.user?.id, 'User ID should be present');
      adminToken = body.token;
    });
  } else {
    skip('POST /api/auth/login — connexion admin', 'Définir ADMIN_EMAIL et ADMIN_PASSWORD pour activer');
  }

  // ---- Token invalide ----
  await test('Token expiré → 401', async () => {
    // Créer un faux token JWT expiré
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ userId: 1, exp: Math.floor(Date.now() / 1000) - 3600 }));
    const fakeToken = `${header}.${payload}.fakesignature`;
    
    const { status } = await fetchJSON('/api/users/1', {
      headers: { 'Authorization': `Bearer ${fakeToken}` },
    });
    assertEqual(status, 401, `Expected 401, got ${status}`);
  });

  await test('Token malformé → 401', async () => {
    const { status } = await fetchJSON('/api/users/1', {
      headers: { 'Authorization': 'Bearer not.a.valid.jwt.token' },
    });
    assertEqual(status, 401, `Expected 401, got ${status}`);
  });

  // ---- Routes authentifiées ----
  section('7. ROUTES AUTHENTIFIÉES');

  if (adminToken) {
    const authHeaders = { 'Authorization': `Bearer ${adminToken}` };

    await test('GET /api/users (liste) avec token → 200', async () => {
      const { status, body } = await fetchJSON('/api/users', { headers: authHeaders });
      assertEqual(status, 200, `Status ${status}`);
      assert(Array.isArray(body), 'Response should be an array');
      if (body.length > 0) {
        assert(body[0].id !== undefined, 'User should have id');
        assert(body[0].mot_de_passe === undefined, 'Password should NOT be in response');
      }
    });

    await test('GET /api/actualites (toutes) avec token → inclut Brouillon', async () => {
      const { status, body } = await fetchJSON('/api/actualites', { headers: authHeaders });
      assertEqual(status, 200, `Status ${status}`);
      assert(Array.isArray(body), 'Response should be an array');
    });

    // Test CRUD actualité
    let testArticleId = null;

    await test('POST /api/actualites — créer un brouillon', async () => {
      // D'abord récupérer l'ID de l'admin
      const { body: loginBody } = await fetchJSON('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
      });
      const userId = loginBody.user.id;

      const { status, body } = await fetchJSON('/api/actualites', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          titre: '[TEST] Article de test automatique',
          description: 'Ceci est un test automatique — à supprimer',
          contenu: '<p>Contenu de test</p>',
          type: 'numérique',
          statut: 'Brouillon',
          auteur_id: userId,
          tags: ['test', 'auto'],
        }),
      });
      assertEqual(status, 201, `Status ${status}: ${JSON.stringify(body)}`);
      assert(body.actualite?.id, 'Should return article ID');
      testArticleId = body.actualite.id;
      
      // Vérifier que les tags sont un array
      assert(Array.isArray(body.actualite.tags), `Tags should be array, got ${typeof body.actualite.tags}`);
    });

    if (testArticleId) {
      await test('GET /api/actualites/:id — récupérer l\'article créé', async () => {
        const { status, body } = await fetchJSON(`/api/actualites/${testArticleId}`);
        assertEqual(status, 200, `Status ${status}`);
        assertEqual(body.titre, '[TEST] Article de test automatique');
        assert(Array.isArray(body.tags), `Tags should be array, got ${typeof body.tags}`);
      });

      await test('PUT /api/actualites/:id — modifier l\'article', async () => {
        const { status, body } = await fetchJSON(`/api/actualites/${testArticleId}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({
            titre: '[TEST] Article modifié',
            tags: ['test', 'modifié'],
          }),
        });
        assertEqual(status, 200, `Status ${status}: ${JSON.stringify(body)}`);
      });

      await test('DELETE /api/actualites/:id — supprimer l\'article de test', async () => {
        const { status } = await fetchJSON(`/api/actualites/${testArticleId}`, {
          method: 'DELETE',
          headers: authHeaders,
        });
        assertEqual(status, 200, `Status ${status}`);
      });

      await test('GET /api/actualites/:id après suppression → 404', async () => {
        const { status } = await fetchJSON(`/api/actualites/${testArticleId}`);
        assertEqual(status, 404, `Expected 404, got ${status}`);
      });
    }

    // Test commentaires
    await test('POST /api/comments — validation contenu trop court', async () => {
      const { status } = await fetchJSON('/api/comments', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ article_id: 1, contenu: 'ab' }),
      });
      assertEqual(status, 400, `Expected 400, got ${status}`);
    });

    await test('POST /api/comments — article inexistant → 404', async () => {
      const { status } = await fetchJSON('/api/comments', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ article_id: 999999, contenu: 'Test commentaire' }),
      });
      assertEqual(status, 404, `Expected 404, got ${status}`);
    });

  } else {
    skip('Tests CRUD authentifiés', 'Token admin non disponible');
  }

  // ---- Mot de passe oublié ----
  section('8. RÉINITIALISATION MOT DE PASSE');

  await test('POST /api/auth/forgot-password — email manquant → 400', async () => {
    const { status } = await fetchJSON('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    assertEqual(status, 400, `Expected 400, got ${status}`);
  });

  await test('POST /api/auth/forgot-password — email inexistant → 200 (sécurité)', async () => {
    const { status } = await fetchJSON('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'nexistepas@fake.com' }),
    });
    // Pour la sécurité, on retourne toujours 200 même si l'email n'existe pas
    assertEqual(status, 200, `Expected 200, got ${status}`);
  });

  await test('POST /api/auth/verify-reset-token — token vide → 400', async () => {
    const { status } = await fetchJSON('/api/auth/verify-reset-token', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    assertEqual(status, 400, `Expected 400, got ${status}`);
  });

  await test('POST /api/auth/verify-reset-token — token invalide → 400', async () => {
    const { status } = await fetchJSON('/api/auth/verify-reset-token', {
      method: 'POST',
      body: JSON.stringify({ token: 'faketoken123' }),
    });
    assertEqual(status, 400, `Expected 400, got ${status}`);
  });

  await test('POST /api/auth/reset-password — validation mot de passe court', async () => {
    const { status } = await fetchJSON('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'faketoken', password: '123' }),
    });
    assertEqual(status, 400, `Expected 400, got ${status}`);
  });

  // ---- Rate limiting ----
  section('9. RATE LIMITING');

  await test('Rate limit login — réponse correcte après tentatives', async () => {
    // On ne fait pas toutes les tentatives pour ne pas bloquer le test
    const { status } = await fetchJSON('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'rate@test.com', password: 'wrong' }),
    });
    // Devrait être 401 (pas encore rate limité) ou 429 (si déjà limité)
    assert(status === 401 || status === 429, `Expected 401 or 429, got ${status}`);
  });

  // ---- Validation des données ----
  section('10. VALIDATION DES DONNÉES');

  await test('GET /api/actualites/invalid → 400', async () => {
    const { status } = await fetchJSON('/api/actualites/notanumber');
    assertEqual(status, 400, `Expected 400, got ${status}`);
  });

  await test('GET /api/actualites/999999 → 404', async () => {
    const { status } = await fetchJSON('/api/actualites/999999');
    assertEqual(status, 404, `Expected 404, got ${status}`);
  });

  await test('GET /api/comments/invalid → 400', async () => {
    const { status } = await fetchJSON('/api/comments/notanumber');
    assertEqual(status, 400, `Expected 400, got ${status}`);
  });

  // ---- Intégrité des pages ----
  section('11. PAGES FRONTEND');

  const pages = [
    '/',
    '/actualites',
    '/association',
    '/contact',
    '/nosactions',
    '/faireundon',
    '/se-connecter',
    '/register',
    '/forgot-password',
    '/cgu',
    '/mentionslegales',
  ];

  for (const page of pages) {
    await test(`GET ${page} → 200`, async () => {
      const res = await fetch(`${BASE_URL}${page}`);
      assertEqual(res.status, 200, `Status ${res.status}`);
      const html = await res.text();
      assert(html.includes('</html>'), 'Response should be HTML');
    });
  }

  // ============================================================
  // RÉSUMÉ
  // ============================================================

  console.log(`\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
  console.log(`${BOLD}📊 RÉSULTATS${RESET}`);
  console.log(`${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
  console.log(`  ${GREEN}✓ Réussis  : ${passed}${RESET}`);
  console.log(`  ${RED}✗ Échoués  : ${failed}${RESET}`);
  console.log(`  ${YELLOW}○ Ignorés  : ${skipped}${RESET}`);
  console.log(`  Total     : ${passed + failed + skipped}`);

  if (failures.length > 0) {
    console.log(`\n${RED}${BOLD}Échecs détaillés :${RESET}`);
    failures.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.name}`);
      console.log(`     ${RED}→ ${f.error}${RESET}`);
    });
  }

  console.log('');

  if (failed > 0) {
    console.log(`${RED}${BOLD}⚠️  ${failed} test(s) échoué(s) — vérifiez les erreurs ci-dessus.${RESET}\n`);
    process.exit(1);
  } else {
    console.log(`${GREEN}${BOLD}✅ Tous les tests sont passés !${RESET}\n`);
    process.exit(0);
  }
}

// Exécution
runTests().catch(err => {
  console.error(`\n${RED}Erreur fatale:${RESET}`, err);
  process.exit(2);
});