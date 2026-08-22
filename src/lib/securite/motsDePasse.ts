// Barrière posée par le compilateur : si quelqu'un importe ce module depuis
// un composant client, le build échoue. La liste des mots de passe compromis
// et les règles de refus ne peuvent pas atteindre le navigateur par accident.
import "server-only";

import { createHash } from "node:crypto";
import {
  LONGUEUR_MAX,
  LONGUEUR_MIN,
  classes,
  motifRepete,
  repetition,
  suiteClavier,
} from "./indicateur";

export { LONGUEUR_MIN, LONGUEUR_MAX };

/**
 * Politique de mot de passe de la Maison.
 *
 * Trois lignes de défense, dans cet ordre :
 *   1. des règles structurelles (longueur, variété, suites, répétitions) ;
 *   2. une liste embarquée des mots de passe les plus compromis, comparée
 *      après normalisation « leet » — « P@ssw0rd! » est refusé comme
 *      « password » l'est ;
 *   3. Have I Been Pwned, interrogé par k-anonymat : seuls les cinq premiers
 *      caractères de l'empreinte SHA-1 quittent le serveur, jamais le mot de
 *      passe ni son empreinte complète.
 *
 * Tout est vérifié côté serveur. Le navigateur n'affiche qu'une aide à la
 * saisie : il ne décide rien.
 */

/* ══════════════════════════════════════════════════════════════
   Liste embarquée — les plus vus dans les fuites publiques
   ══════════════════════════════════════════════════════════════ */

const COURANTS = `
123456 password 123456789 12345678 12345 qwerty abc123 111111 123123 1234567890
1234567 iloveyou 000000 dragon monkey letmein login princess qwertyuiop solo
passw0rd starwars master hello freedom whatever qazwsx trustno1 batman zaq1zaq1
football baseball welcome admin admin123 root toor guest test test123 default
sunshine shadow michael superman ninja jordan harley ranger hunter buster soccer
tigger charlie andrew jessica pepper daniel summer ashley bailey thomas hockey
killer george sexy andrea joshua amanda access flower matrix pokemon computer
maggie chelsea diamond yankees silver internet samantha golfer scooter secret
asdfgh cookie nicole jasmine banana orange purple yellow lakers ferrari
azerty azertyuiop motdepasse bonjour soleil chouchou coucou doudou nicolas
camille julien mathieu thomas jonathan alexandre sebastien maxime quentin
loulou chocolat papillon marseille france paris lyon toulouse bordeaux
liverpool arsenal chelsea barcelona madrid juventus milan
1q2w3e4r 1qaz2wsx qwe123 asd123 zxcvbnm poiuytreza a1b2c3 abcd1234
password1 password123 passer123 motdepasse1 azerty123 qwerty123 123qwe
loveme babygirl lovely friends cheese jennifer hannah michelle
starwars1 iloveyou1 princess1 welcome1 monkey123 dragon123
qwertz asdfghjkl 987654321 11111111 22222222 88888888 123321 654321
abcdef abcdefg letmein1 changeme newpassword temp temp123 azerty1
skyrim dovahkiin fusrodah bordeciel tamriel morrowind oblivion
minecraft fortnite pokemon1 zelda mario sonic
`
  .split(/\s+/)
  .filter(Boolean);

const COURANTS_SET = new Set(COURANTS);

/** Mots du contexte : trop devinables pour la Maison, quel que soit l'habillage. */
const MOTS_DU_CONTEXTE = [
  "givrelune",
  "givre",
  "lune",
  "maison",
  "keizaal",
  "skyrim",
  "bordeciel",
  "septim",
  "patriarche",
  "senechal",
  "intendant",
  "champion",
  "varro",
  "varian",
  "discord",
  "admin",
  "administrateur",
  "connexion",
  "motdepasse",
];

/* ══════════════════════════════════════════════════════════════
   Normalisation
   ══════════════════════════════════════════════════════════════ */

const LEET: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "8": "b",
  "9": "g",
  "@": "a",
  $: "s",
  "!": "i",
  "|": "l",
  "+": "t",
  "(": "c",
  "€": "e",
};

/** « P@ssw0rd! » → « password » : on compare ce que le mot veut dire. */
function normaliser(mdp: string): string {
  return mdp
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .split("")
    .map((c) => LEET[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]/g, "");
}

/** Retire les suffixes décoratifs : « soleil2026 » → « soleil ». */
function noyau(motNormalise: string): string {
  return motNormalise.replace(/[0-9]+$/, "").replace(/^[0-9]+/, "");
}

/* ══════════════════════════════════════════════════════════════
   Have I Been Pwned — k-anonymat
   ══════════════════════════════════════════════════════════════ */

/**
 * Interroge HIBP sans jamais lui livrer le mot de passe : on n'envoie que
 * les cinq premiers caractères de l'empreinte SHA-1, et l'on cherche le
 * suffixe dans la réponse. Si le service ne répond pas, on laisse passer :
 * la liste embarquée et les règles structurelles ont déjà filtré le gros.
 */
export async function compteFuites(mdp: string): Promise<number | null> {
  try {
    const empreinte = createHash("sha1").update(mdp, "utf8").digest("hex").toUpperCase();
    const prefixe = empreinte.slice(0, 5);
    const suffixe = empreinte.slice(5);

    const ctrl = new AbortController();
    const minuteur = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefixe}`, {
      signal: ctrl.signal,
      headers: { "Add-Padding": "true", "User-Agent": "MaisonGivrelune-Hub" },
      cache: "no-store",
    });
    clearTimeout(minuteur);
    if (!res.ok) return null;

    const corps = await res.text();
    for (const ligne of corps.split("\n")) {
      const [suf, n] = ligne.trim().split(":");
      if (suf === suffixe) return Number(n) || 0;
    }
    return 0;
  } catch {
    // Hors ligne, service indisponible, délai dépassé : on ne bloque pas.
    return null;
  }
}

/* ══════════════════════════════════════════════════════════════
   Vérification
   ══════════════════════════════════════════════════════════════ */

export type Verdict = {
  ok: boolean;
  erreurs: string[];
  /** Nombre d'apparitions dans les fuites connues, si le service a répondu. */
  fuites: number | null;
};

export type ContexteMdp = {
  /** Identifiant, nom RP, email… : le mot de passe ne doit pas les contenir. */
  personnel?: (string | null | undefined)[];
};

/** Contrôles hors ligne — instantanés, toujours disponibles. */
export function verifierStructure(mdp: string, ctx: ContexteMdp = {}): string[] {
  const erreurs: string[] = [];

  if (mdp.length < LONGUEUR_MIN) {
    erreurs.push(`Le mot de passe doit faire au moins ${LONGUEUR_MIN} caractères.`);
  }
  if (mdp.length > LONGUEUR_MAX) {
    erreurs.push(`Le mot de passe ne peut pas dépasser ${LONGUEUR_MAX} caractères.`);
  }
  if (mdp !== mdp.trim()) {
    erreurs.push("Le mot de passe ne doit ni commencer ni finir par une espace.");
  }

  const n = normaliser(mdp);
  const coeur = noyau(n);

  if (COURANTS_SET.has(n) || COURANTS_SET.has(coeur)) {
    erreurs.push(
      "Ce mot de passe figure parmi les plus utilisés au monde. Ajouter un chiffre ou remplacer un « a » par « @ » n'y change rien : choisissez autre chose.",
    );
  }

  for (const mot of MOTS_DU_CONTEXTE) {
    if (n.includes(mot)) {
      erreurs.push(`Le mot de passe ne doit pas contenir « ${mot} » : c'est le premier essai venu.`);
      break;
    }
  }

  for (const perso of ctx.personnel ?? []) {
    if (!perso) continue;
    const morceau = normaliser(String(perso).split("@")[0]);
    if (morceau.length >= 4 && n.includes(morceau)) {
      erreurs.push("Le mot de passe ne doit pas reprendre votre identifiant, votre nom RP ni votre email.");
      break;
    }
  }

  if (suiteClavier(mdp)) {
    erreurs.push("Évitez les suites de touches ou de lettres (azerty, 1234, abcd).");
  }
  if (repetition(mdp)) {
    erreurs.push("Évitez de répéter quatre fois le même caractère.");
  }
  if (motifRepete(mdp)) {
    erreurs.push("Évitez de répéter un même motif court.");
  }

  const varieté = classes(mdp);
  if (varieté < 3 && mdp.length < 16) {
    erreurs.push(
      "Mélangez au moins trois types de caractères (minuscules, majuscules, chiffres, symboles) — ou faites au moins 16 caractères.",
    );
  }

  return erreurs;
}

/** Vérification complète : structure + liste embarquée + fuites connues. */
export async function verifierMotDePasse(
  mdp: string,
  ctx: ContexteMdp = {},
): Promise<Verdict> {
  const erreurs = verifierStructure(mdp, ctx);

  // Inutile d'interroger un service extérieur si le mot de passe est déjà refusé.
  if (erreurs.length > 0) return { ok: false, erreurs, fuites: null };

  const fuites = await compteFuites(mdp);
  if (fuites !== null && fuites > 0) {
    erreurs.push(
      `Ce mot de passe apparaît dans ${fuites.toLocaleString("fr-FR")} fuite(s) de données connues. Il est à la portée du premier venu : choisissez-en un autre.`,
    );
  }

  return { ok: erreurs.length === 0, erreurs, fuites };
}
