import { cache } from "react";
import { redirect } from "next/navigation";
import { compare, hash } from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { chargeSession, ouvrirSession } from "./session";
import { PERMISSIONS } from "./domain";
import {
  adresseAppelant,
  enregistrerEchec,
  purger,
  reinitialiser,
  verifierBlocage,
  ESSAIS_AVANT_BLOCAGE,
} from "./securite/limitation";

/**
 * Coût bcrypt. 12 tours ≈ 250 ms sur une machine courante : assez lent pour
 * qu'une attaque par force brute sur des empreintes volées soit ruineuse,
 * assez rapide pour une connexion.
 */
export const COUT_BCRYPT = 12;

export function hacherMotDePasse(mdp: string): Promise<string> {
  return hash(mdp, COUT_BCRYPT);
}

/* ── Chargement du membre connecté ───────────────────────── */

const INCLUDE = {
  rank: { include: { permissions: { include: { permission: true } } } },
  branch: { include: { permissions: { include: { permission: true } } } },
  grade: { include: { permissions: { include: { permission: true } }, branch: true } },
  councilRole: { include: { permissions: { include: { permission: true } } } },
  circle: true,
  metiers: { include: { metier: true }, orderBy: { isPrimary: "desc" } },
  permissions: { include: { permission: true } },
  presentedBy: { select: { id: true, nomRp: true } },
} as const;

type MembreBrut = Prisma.UserGetPayload<{ include: typeof INCLUDE }>;

export type Membre = MembreBrut & {
  droits: Set<string>;
  estAdmin: boolean;
};

/**
 * Union rang + branche + grade + fonction de Conseil, corrigée par les
 * octrois individuels.
 *
 * La branche porte les prérogatives qui tiennent au métier et non à
 * l'ancienneté : elles valent pour tous ses membres, même sans grade.
 */
function calculerDroits(u: MembreBrut): Set<string> {
  const droits = new Set<string>();
  for (const rp of u.rank.permissions) droits.add(rp.permission.key);
  for (const bp of u.branch?.permissions ?? []) droits.add(bp.permission.key);
  for (const gp of u.grade?.permissions ?? []) droits.add(gp.permission.key);
  for (const cp of u.councilRole?.permissions ?? []) droits.add(cp.permission.key);
  // Les octrois/retraits individuels priment
  for (const up of u.permissions) {
    if (up.granted) droits.add(up.permission.key);
    else droits.delete(up.permission.key);
  }
  return droits;
}

export const utilisateurCourant = cache(async (): Promise<Membre | null> => {
  const charge = await chargeSession();
  if (!charge) return null;

  const u = await prisma.user.findUnique({ where: { id: charge.uid }, include: INCLUDE });
  if (!u || u.status === "archive") return null;

  // Une session émise avant le dernier changement de mot de passe ne vaut plus rien.
  if (u.sessionsDepuis && charge.iat < u.sessionsDepuis.getTime()) return null;

  const droits = calculerDroits(u);
  return { ...u, droits, estAdmin: droits.has(PERMISSIONS.ADMIN_FULL) };
});

/** Le membre peut-il faire ceci ? `admin.full` ouvre tout. */
export function peut(membre: Membre | null, ...cles: string[]): boolean {
  if (!membre) return false;
  if (membre.estAdmin) return true;
  return cles.some((c) => membre.droits.has(c));
}

/* ── Gardes de route ─────────────────────────────────────── */

export async function exigerMembre(): Promise<Membre> {
  const membre = await utilisateurCourant();
  if (!membre) redirect("/connexion");
  return membre;
}

export async function exigerDroit(...cles: string[]): Promise<Membre> {
  const membre = await exigerMembre();
  if (!peut(membre, ...cles)) redirect("/tableau-de-bord?refus=1");
  return membre;
}

/* ── Connexion classique ─────────────────────────────────── */

export type ResultatConnexion =
  | { ok: true }
  | { ok: false; erreur: string; secondes?: number; essaisRestants?: number };

/**
 * Connexion par identifiant et mot de passe.
 *
 * Tout est décidé ici, côté serveur : le blocage, le décompte des essais et
 * la comparaison du mot de passe. Le navigateur ne fait qu'afficher ce qu'on
 * lui renvoie — il ne peut ni contourner le blocage ni le raccourcir.
 */
export async function connexionClassique(
  login: string,
  motDePasse: string,
): Promise<ResultatConnexion> {
  const identifiant = login.trim().toLowerCase();
  const ip = await adresseAppelant();

  if (!identifiant || !motDePasse) {
    return { ok: false, erreur: "Identifiant et mot de passe sont requis." };
  }

  // 1. Le seuil d'essais est-il déjà atteint ?
  const avant = await verifierBlocage(identifiant, ip);
  if (avant.bloque) {
    return {
      ok: false,
      erreur: `Trop de tentatives. Réessayez dans ${avant.secondes} seconde${avant.secondes > 1 ? "s" : ""}.`,
      secondes: avant.secondes,
    };
  }

  const u = await prisma.user.findFirst({
    where: { login: identifiant },
    select: { id: true, passwordHash: true, status: true },
  });

  // 2. On compare même sans compte, avec une empreinte factice de même coût :
  //    le temps de réponse ne révèle pas si l'identifiant existe.
  const empreinte =
    u?.passwordHash ?? "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinva";
  const bon = await compare(motDePasse, empreinte);

  if (!u || !u.passwordHash || !bon || u.status === "archive") {
    const apres = await enregistrerEchec(identifiant, ip);
    void purger();

    if (apres.bloque) {
      return {
        ok: false,
        erreur: `Trop de tentatives. Réessayez dans ${apres.secondes} seconde${apres.secondes > 1 ? "s" : ""}.`,
        secondes: apres.secondes,
      };
    }
    return {
      // Message identique dans tous les cas : ni l'existence du compte
      // ni son archivage ne doivent transparaître.
      ok: false,
      erreur: "Identifiant ou mot de passe incorrect.",
      essaisRestants: apres.essaisRestants,
    };
  }

  await reinitialiser(identifiant, ip);
  await ouvrirSession(u.id);
  await prisma.user.update({ where: { id: u.id }, data: { lastSeenAt: new Date() } });
  return { ok: true };
}

export { ESSAIS_AVANT_BLOCAGE };

/* ── Discord ─────────────────────────────────────────────── */

export function discordConfigure(): boolean {
  return Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET);
}

export function urlRetourDiscord(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  return `${base}/api/auth/discord/callback`;
}
