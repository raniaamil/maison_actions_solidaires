// next.config.ts
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// CSP "non bloquante" (Report-Only) — assez permissive pour éviter les cassements,
// tout en vous montrant ce qui violerait une CSP stricte dans la console du navigateur.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' https: blob:",
  "font-src 'self' data: https:",
  // Next en dev a parfois besoin d'unsafe-eval ; on le limite au dev
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  // API / websockets
  `connect-src 'self' https:${isProd ? "" : " ws:"}`,
  // iframes YouTube (classique + nocookie)
  "frame-src 'self' https://*.youtube.com https://*.youtube-nocookie.com",
  // empêcher que VOTRE site soit embarqué ailleurs
  "frame-ancestors 'none'",
  // workers (éditeur, upload, etc.)
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  // en prod : forcer https sur les sous-requêtes (non bloquant pour vous)
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
  // ⚠️ CSP en mode Report-Only pour commencer (non bloquant)
  { key: "Content-Security-Policy-Report-Only", value: csp },
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

