/**
 * Aide à la saisie d'un mot de passe — la seule partie qui a le droit
 * d'atteindre le navigateur.
 *
 * Volontairement structurelle et rien de plus : longueur, variété, suites,
 * répétitions. Ni la liste des mots de passe compromis, ni les règles de
 * refus, ni la vérification des fuites ne descendent côté client — elles
 * vivent dans `motsDePasse.ts`, marqué `server-only`.
 *
 * Cet indicateur n'autorise ni ne refuse rien. Il indique.
 */

export const LONGUEUR_MIN = 12;
export const LONGUEUR_MAX = 200;

const RANGEES = [
  "azertyuiop",
  "qwertyuiop",
  "qsdfghjklm",
  "asdfghjkl",
  "wxcvbn",
  "zxcvbnm",
  "1234567890",
  "abcdefghijklmnopqrstuvwxyz",
];

/** Suite de touches ou d'alphabet d'au moins `min` caractères, dans un sens ou l'autre. */
export function suiteClavier(mdp: string, min = 4): boolean {
  const bas = mdp.toLowerCase();
  for (const rangee of RANGEES) {
    const envers = [...rangee].reverse().join("");
    for (let i = 0; i + min <= rangee.length; i++) {
      if (bas.includes(rangee.slice(i, i + min))) return true;
      if (bas.includes(envers.slice(i, i + min))) return true;
    }
  }
  return false;
}

/** « aaaa », « 1111 » : au moins `min` fois le même caractère d'affilée. */
export function repetition(mdp: string, min = 4): boolean {
  return new RegExp(`(.)\\1{${min - 1},}`).test(mdp);
}

/** Un motif court répété : « abcabcabc », « 123123123 ». */
export function motifRepete(mdp: string): boolean {
  return /^(.{1,4}?)\1{2,}$/.test(mdp.toLowerCase());
}

/** Nombre de familles de caractères présentes (minuscule, majuscule, chiffre, symbole). */
export function classes(mdp: string): number {
  return (
    (/[a-z]/.test(mdp) ? 1 : 0) +
    (/[A-Z]/.test(mdp) ? 1 : 0) +
    (/[0-9]/.test(mdp) ? 1 : 0) +
    (/[^a-zA-Z0-9]/.test(mdp) ? 1 : 0)
  );
}

export type Force = { score: 0 | 1 | 2 | 3 | 4; label: string };

export function forceIndicative(mdp: string): Force {
  if (!mdp) return { score: 0, label: "vide" };

  let s = 0;
  if (mdp.length >= LONGUEUR_MIN) s++;
  if (mdp.length >= 16) s++;
  if (classes(mdp) >= 3) s++;
  if (classes(mdp) === 4) s++;
  if (suiteClavier(mdp) || repetition(mdp) || motifRepete(mdp)) s = 0;

  const labels = ["à refaire", "faible", "correct", "solide", "excellent"] as const;
  const score = Math.min(4, s) as 0 | 1 | 2 | 3 | 4;
  return { score, label: labels[score] };
}
