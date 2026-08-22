import { headers } from "next/headers";
import { prisma } from "../db";

/**
 * Blocage temporaire après échecs de connexion.
 *
 * Le compteur vit en base, pas en mémoire : il survit à un redémarrage et
 * fonctionne même si le site tourne sur plusieurs instances. Rien n'est
 * décidé côté navigateur — le client ne fait qu'afficher le décompte que
 * le serveur lui renvoie.
 */

/** Nombre d'essais tolérés avant le premier blocage. */
export const ESSAIS_AVANT_BLOCAGE = 5;

/** Durées de blocage successives, en secondes. La dernière se répète. */
const PALIERS = [30, 60, 120, 300, 900];

/** Au bout de ce délai sans échec, le compteur repart de zéro. */
const OUBLI_MINUTES = 30;

export type EtatLimitation = {
  bloque: boolean;
  /** Secondes restantes avant de pouvoir réessayer. */
  secondes: number;
  /** Essais restants avant blocage, quand rien ne bloque encore. */
  essaisRestants: number;
};

/** Adresse de l'appelant, telle que la voit le serveur. */
export async function adresseAppelant(): Promise<string> {
  const h = await headers();
  const chaine =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    h.get("cf-connecting-ip")?.trim() ||
    "";
  return chaine.slice(0, 64) || "inconnue";
}

function dureeBlocage(echecs: number): number {
  if (echecs < ESSAIS_AVANT_BLOCAGE) return 0;
  const rang = echecs - ESSAIS_AVANT_BLOCAGE;
  return PALIERS[Math.min(rang, PALIERS.length - 1)];
}

async function lire(type: string, cle: string) {
  if (!cle) return null;
  return prisma.loginAttempt.findUnique({ where: { type_cle: { type, cle } } });
}

/**
 * Le couple identifiant/adresse a-t-il le droit d'essayer maintenant ?
 * On retient le blocage le plus long des deux.
 */
export async function verifierBlocage(login: string, ip: string): Promise<EtatLimitation> {
  const [parLogin, parIp] = await Promise.all([
    lire("login", login.toLowerCase()),
    lire("ip", ip),
  ]);

  const maintenant = Date.now();
  let restant = 0;
  let echecs = 0;

  for (const e of [parLogin, parIp]) {
    if (!e) continue;
    // Un compteur oublié depuis longtemps ne compte plus.
    const perime = maintenant - e.dernierEchec.getTime() > OUBLI_MINUTES * 60_000;
    if (!perime) echecs = Math.max(echecs, e.echecs);
    if (e.bloqueJusqua && e.bloqueJusqua.getTime() > maintenant) {
      restant = Math.max(restant, Math.ceil((e.bloqueJusqua.getTime() - maintenant) / 1000));
    }
  }

  return {
    bloque: restant > 0,
    secondes: restant,
    essaisRestants: Math.max(0, ESSAIS_AVANT_BLOCAGE - echecs),
  };
}

/** Consigne un échec et renvoie l'état qui en découle. */
export async function enregistrerEchec(login: string, ip: string): Promise<EtatLimitation> {
  const maintenant = new Date();

  const majUn = async (type: string, cle: string) => {
    if (!cle) return 0;
    const existant = await prisma.loginAttempt.findUnique({ where: { type_cle: { type, cle } } });

    const perime =
      existant && maintenant.getTime() - existant.dernierEchec.getTime() > OUBLI_MINUTES * 60_000;
    const echecs = perime || !existant ? 1 : existant.echecs + 1;

    const secondes = dureeBlocage(echecs);
    const bloqueJusqua = secondes > 0 ? new Date(maintenant.getTime() + secondes * 1000) : null;

    await prisma.loginAttempt.upsert({
      where: { type_cle: { type, cle } },
      update: { echecs, bloqueJusqua, dernierEchec: maintenant },
      create: { type, cle, echecs, bloqueJusqua, dernierEchec: maintenant },
    });
    return secondes;
  };

  const [sLogin, sIp] = await Promise.all([
    majUn("login", login.toLowerCase()),
    majUn("ip", ip),
  ]);

  const secondes = Math.max(sLogin, sIp);
  return verifierBlocage(login, ip).then((e) => ({
    ...e,
    bloque: e.bloque || secondes > 0,
    secondes: Math.max(e.secondes, secondes),
  }));
}

/** Connexion réussie : on efface l'ardoise. */
export async function reinitialiser(login: string, ip: string) {
  await prisma.loginAttempt.deleteMany({
    where: {
      OR: [
        { type: "login", cle: login.toLowerCase() },
        { type: "ip", cle: ip },
      ],
    },
  });
}

/**
 * Limiteur générique, pour les actions publiques autres que la connexion
 * (demande de rôle, par exemple). Renvoie `true` si l'action est permise.
 */
export async function limiterAction(
  action: string,
  cle: string,
  max: number,
  fenetreMinutes: number,
): Promise<boolean> {
  if (!cle) return true;
  const type = `action:${action}`;
  const maintenant = new Date();
  const existant = await prisma.loginAttempt.findUnique({ where: { type_cle: { type, cle } } });

  const perime =
    !existant ||
    maintenant.getTime() - existant.dernierEchec.getTime() > fenetreMinutes * 60_000;
  const compte = perime ? 1 : existant.echecs + 1;

  await prisma.loginAttempt.upsert({
    where: { type_cle: { type, cle } },
    update: { echecs: compte, dernierEchec: maintenant },
    create: { type, cle, echecs: compte, dernierEchec: maintenant },
  });

  return compte <= max;
}

/** Ménage des compteurs oubliés — appelé de temps en temps, sans bloquer. */
export async function purger() {
  const seuil = new Date(Date.now() - OUBLI_MINUTES * 60_000 * 4);
  await prisma.loginAttempt
    .deleteMany({ where: { dernierEchec: { lt: seuil }, bloqueJusqua: null } })
    .catch(() => undefined);
}
