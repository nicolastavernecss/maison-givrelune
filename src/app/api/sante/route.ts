import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Route de diagnostic temporaire.
 *
 * Elle sert à savoir, depuis l'extérieur, ce que le serveur déployé voit
 * réellement de sa configuration : la base est-elle branchée, laquelle, et
 * que répond-elle. Aucun secret n'en sort — ni mot de passe, ni chaîne de
 * connexion complète, ni empreinte d'AUTH_SECRET.
 *
 * À supprimer dès que le déploiement est sain.
 */

/** Retire toute paire identifiant:mot de passe d'un message d'erreur. */
function assainir(texte: string) {
  return texte.replace(/\/\/[^@\s/]+:[^@\s/]+@/g, "//***:***@");
}

/** Décrit une URL de base sans jamais en révéler le secret. */
function silhouette(url: string | undefined) {
  if (!url) return "MANQUANTE";
  try {
    const u = new URL(url);
    return {
      protocole: u.protocol.replace(":", ""),
      // Assez pour reconnaître la base, pas assez pour s'y connecter.
      empreinteHote: u.hostname.split(".")[0],
      base: u.pathname.slice(1).split("?")[0] || null,
      motDePasse: u.password ? "présent" : "ABSENT",
      pooler: u.hostname.includes("-pooler"),
    };
  } catch {
    return { protocole: "ILLISIBLE", empreinteHote: null, base: null };
  }
}

export async function GET() {
  const rapport: Record<string, unknown> = {
    DATABASE_URL: silhouette(process.env.DATABASE_URL),
    AUTH_SECRET: process.env.AUTH_SECRET ? "défini" : "MANQUANT",
    environnement: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? null,
    region: process.env.VERCEL_REGION ?? null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
  };

  try {
    const [matieres, membres, recettes] = await Promise.all([
      prisma.material.count(),
      prisma.user.count(),
      prisma.recipe.count(),
    ]);
    rapport.base = { etat: "OK", matieres, membres, recettes };
  } catch (erreur) {
    const e = erreur as Error & { code?: string; name?: string };
    rapport.base = {
      etat: "ÉCHEC",
      type: e.name ?? null,
      code: e.code ?? null,
      message: assainir(String(e.message ?? ""))
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 5)
        .join(" | ")
        .slice(0, 600),
    };
  }

  return NextResponse.json(rapport, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
