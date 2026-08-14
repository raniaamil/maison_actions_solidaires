// next.config.ts
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Origine Supabase (Storage) — dérivée de la variable d'env pour ne pas coder en dur
// un identifiant de projet. Fallback vide si non définie (les directives restent valides).
const supabaseOrigin = (() => {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return "";
  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
})();

// CSP BLOQUANTE (Content-Security-Policy, plus Report-Only).
//
// Choix documentés, établis en analysant ce que les pages chargent réellement :
//
// - script-src 'unsafe-inline' : Next.js émet ~17 <script> inline par page pour le
//   streaming RSC et l'hydratation (self.__next_f.push(...)), SANS nonce. Les supprimer
//   est impossible ; générer des nonces imposerait au middleware de les injecter à chaque
//   requête, ce qui force le rendu 100% dynamique et supprime la génération statique du
//   site. Compromis retenu : garder 'unsafe-inline' sur script-src, mais verrouiller tout
//   le reste (object-src 'none', base-uri 'self', form-action 'self'), ce qui neutralise
//   les vecteurs d'exploitation les plus courants. Aucun handler inline (onclick=) ni URL
//   javascript: n'est présent dans le rendu, donc rien d'autre n'en dépend.
//
// - style-src 'unsafe-inline' : React/Tailwind injectent des attributs style="" (34 relevés).
//
// - img-src https: : le contenu déjà publié référence des images hébergées sur plusieurs
//   origines (Supabase Storage, images.unsplash.com, imgix.bustle.com). Restreindre à la
//   seule origine Supabase casserait des articles existants ; une image ne s'exécutant pas,
//   le risque résiduel est faible.
//
// - connect-src : restreint à 'self' + Supabase (au lieu de tout https:), car les appels
//   XHR/fetch sont le vecteur d'exfiltration de données le plus direct.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  // next/font/google auto-héberge les polices au build : pas d'origine externe nécessaire
  "font-src 'self' data:",
  // Next en dev a besoin d'unsafe-eval (react-refresh) ; strictement limité au dev
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  // Resserré : API interne + Supabase uniquement (websockets HMR en dev)
  `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ""}${isProd ? "" : " ws: http://localhost:* http://127.0.0.1:*"}`,
  // iframes YouTube (extension Tiptap disponible, classique + nocookie)
  "frame-src 'self' https://*.youtube.com https://*.youtube-nocookie.com",
  // empêcher que le site soit embarqué ailleurs (clickjacking)
  "frame-ancestors 'none'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  // en prod : forcer https sur les sous-requêtes
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

// En-têtes de sécurité (raisonnables et non bloquants)
const securityHeaders = [
  // Clickjacking (redondant avec frame-ancestors: 'none', mais ok)
  { key: "X-Frame-Options", value: "DENY" },
  // MIME sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Politique de referrer
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Permissions (désactiver ce qu'on n'utilise pas)
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // HSTS (prod uniquement)
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
  // ✅ CSP ACTIVE (bloquante). Voir les choix documentés au-dessus de `csp`.
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

