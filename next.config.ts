import type { NextConfig } from "next";

const enProduction = process.env.NODE_ENV === "production";

/**
 * En-têtes de sécurité appliqués à toutes les réponses.
 *
 * La politique de contenu autorise le strict nécessaire : les scripts et
 * les styles viennent du site, les images du site, des données embarquées
 * (les pièces jointes sont servies en base64 depuis notre propre route) et
 * du CDN Discord pour les avatars. Rien d'autre ne peut être chargé, ce qui
 * limite fortement l'effet d'une éventuelle injection.
 */
const CSP = [
  "default-src 'self'",
  // Next.js injecte du script en ligne pour l'hydratation ; en développement
  // il lui faut en plus l'évaluation dynamique pour le rechargement à chaud.
  `script-src 'self' 'unsafe-inline'${enProduction ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://cdn.discordapp.com",
  "font-src 'self' data:",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  ...(enProduction ? ["upgrade-insecure-requests"] : []),
].join("; ");

const EN_TETES = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  ...(enProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  // Permet de lancer une vérification de build sans écraser le cache du
  // serveur de développement : NEXT_DIST_DIR=.next-verif next build
  distDir: process.env.NEXT_DIST_DIR || ".next",
  serverExternalPackages: ["@prisma/client", "bcryptjs"],

  // Ne pas annoncer le moteur : autant ne pas faciliter le ciblage.
  poweredByHeader: false,

  experimental: {
    serverActions: {
      // Les captures RP et photos d'ateliers peuvent être lourdes.
      bodySizeLimit: "12mb",
    },
  },

  async headers() {
    return [{ source: "/:chemin*", headers: EN_TETES }];
  },
};

export default nextConfig;
