import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Session maison : cookie signé (HMAC-SHA256), sans dépendance externe.
 * Suffisant et lisible pour un hub de guilde ; remplaçable par un
 * fournisseur tiers sans toucher au reste de l'application.
 */

const NOM_COOKIE = "givrelune_session";
const DUREE_JOURS = 30;

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "AUTH_SECRET manquant ou trop court. Générez-en un : node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"",
      );
    }
    return "givrelune-secret-de-developpement-uniquement";
  }
  return s;
}

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function signer(charge: string): string {
  return base64url(createHmac("sha256", secret()).update(charge).digest());
}

export type Charge = { uid: string; exp: number; iat: number };

export function creerJeton(uid: string): string {
  const maintenant = Date.now();
  const charge: Charge = {
    uid,
    iat: maintenant,
    exp: maintenant + DUREE_JOURS * 86_400_000,
  };
  const corps = base64url(Buffer.from(JSON.stringify(charge)));
  return `${corps}.${signer(corps)}`;
}

export function lireJeton(jeton: string | undefined): Charge | null {
  if (!jeton) return null;
  const [corps, signature] = jeton.split(".");
  if (!corps || !signature) return null;

  const attendue = signer(corps);
  const a = Buffer.from(signature);
  const b = Buffer.from(attendue);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const charge = JSON.parse(
      Buffer.from(corps.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(),
    ) as Charge;
    if (!charge.uid || typeof charge.exp !== "number" || charge.exp < Date.now()) return null;
    return charge;
  } catch {
    return null;
  }
}

export async function ouvrirSession(uid: string) {
  const jar = await cookies();
  jar.set(NOM_COOKIE, creerJeton(uid), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DUREE_JOURS * 86_400,
  });
}

export async function fermerSession() {
  const jar = await cookies();
  jar.delete(NOM_COOKIE);
}

export async function idSession(): Promise<string | null> {
  const jar = await cookies();
  return lireJeton(jar.get(NOM_COOKIE)?.value)?.uid ?? null;
}

/** Charge complète de la session courante — sert à vérifier son ancienneté. */
export async function chargeSession(): Promise<Charge | null> {
  const jar = await cookies();
  return lireJeton(jar.get(NOM_COOKIE)?.value);
}

/** État anti-CSRF pour le tour OAuth Discord. */
export async function poserEtatOAuth(): Promise<string> {
  const etat = randomBytes(16).toString("hex");
  const jar = await cookies();
  jar.set("givrelune_oauth", etat, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return etat;
}

export async function verifierEtatOAuth(etat: string | null): Promise<boolean> {
  const jar = await cookies();
  const attendu = jar.get("givrelune_oauth")?.value;
  jar.delete("givrelune_oauth");
  return Boolean(etat && attendu && etat === attendu);
}
