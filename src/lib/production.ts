import { prisma } from "./db";
import { TAUX_TAXE } from "./domain";
import { chiffrerRecette, contexteChiffrage, coursDuMarche } from "./economie";

/* ══════════════════════════════════════════════════════════════
   Prix d'achat par métier
   ══════════════════════════════════════════════════════════════ */

/**
 * Les prix que ce métier paie réellement ses matières. Ils priment sur le
 * cours du marché : le forgeron qui achète son minerai moins cher que le
 * cours doit voir sa marge réelle, pas une marge théorique.
 */
export async function prixMetier(metierId: string): Promise<Map<string, number>> {
  const lignes = await prisma.metierPrice.findMany({
    where: { metierId },
    select: { materialId: true, prixAchat: true },
  });
  return new Map(lignes.map((l) => [l.materialId, l.prixAchat]));
}

/** Contexte de chiffrage où les prix du métier écrasent le cours du marché. */
export async function contexteMetier(metierId: string) {
  const [ctx, propres] = await Promise.all([contexteChiffrage(), prixMetier(metierId)]);
  const prix = new Map(ctx.prix);
  for (const [materialId, p] of propres) prix.set(materialId, p);
  return { ...ctx, prix, prixPropres: propres };
}

/* ══════════════════════════════════════════════════════════════
   Revenu, taxe, net
   ══════════════════════════════════════════════════════════════ */

export type Revenu = {
  brut: number;
  taux: number;
  taxe: number;
  net: number;
};

export function calculerRevenu(
  quantite: number,
  prixUnitaire: number,
  taux: number = TAUX_TAXE,
): Revenu {
  const brut = Math.round(quantite * prixUnitaire);
  const taxe = Math.round(brut * taux);
  return { brut, taux, taxe, net: brut - taxe };
}

/* ══════════════════════════════════════════════════════════════
   Agrégats de revenus
   ══════════════════════════════════════════════════════════════ */

export type Totaux = {
  nbCrafts: number;
  quantite: number;
  brut: number;
  taxe: number;
  net: number;
  cout: number;
  benefice: number;
};

const ZERO: Totaux = { nbCrafts: 0, quantite: 0, brut: 0, taxe: 0, net: 0, cout: 0, benefice: 0 };

export function totaliser(
  lignes: {
    quantite: number;
    revenuBrut: number;
    taxe: number;
    revenuNet: number;
    coutMatiere: number;
    benefice: number;
  }[],
): Totaux {
  return lignes.reduce(
    (t, l) => ({
      nbCrafts: t.nbCrafts + 1,
      quantite: t.quantite + l.quantite,
      brut: t.brut + l.revenuBrut,
      taxe: t.taxe + l.taxe,
      net: t.net + l.revenuNet,
      cout: t.cout + l.coutMatiere,
      benefice: t.benefice + l.benefice,
    }),
    { ...ZERO },
  );
}

/* ══════════════════════════════════════════════════════════════
   Comptes rendus journaliers et hebdomadaires
   ══════════════════════════════════════════════════════════════ */

const JOUR = 86_400_000;

function minuit(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Lundi de la semaine contenant `d`. */
function lundi(d: Date): Date {
  const x = minuit(d);
  const jour = (x.getDay() + 6) % 7; // 0 = lundi
  x.setDate(x.getDate() - jour);
  return x;
}

/** Numéro de semaine ISO, pour nommer les comptes rendus hebdomadaires. */
function semaineIso(d: Date): { annee: number; semaine: number } {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const jour = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - jour);
  const debutAnnee = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  const semaine = Math.ceil(((x.getTime() - debutAnnee.getTime()) / JOUR + 1) / 7);
  return { annee: x.getUTCFullYear(), semaine };
}

export function cleRapport(
  periode: "jour" | "semaine",
  debut: Date,
  metierCle: string | null,
): string {
  const suffixe = metierCle ?? "maison";
  if (periode === "jour") {
    return `jour-${debut.toISOString().slice(0, 10)}-${suffixe}`;
  }
  const { annee, semaine } = semaineIso(debut);
  return `semaine-${annee}-S${String(semaine).padStart(2, "0")}-${suffixe}`;
}

type Detail = {
  parMembre: { nom: string; nbCrafts: number; brut: number; taxe: number; net: number; benefice: number }[];
  parObjet: { label: string; quantite: number; brut: number }[];
};

type LigneProd = {
  userId: string;
  metierId: string;
  materialId: string;
  createdAt: Date;
  quantite: number;
  revenuBrut: number;
  taxe: number;
  revenuNet: number;
  coutMatiere: number;
  benefice: number;
  user: { nomRp: string };
  material: { label: string };
};

/** Additionne un lot de productions et en tire la ventilation. */
function composer(lignes: LigneProd[]) {
  const t = totaliser(lignes);

  const parMembre = new Map<string, Detail["parMembre"][number]>();
  const parObjet = new Map<string, Detail["parObjet"][number]>();
  for (const l of lignes) {
    const m = parMembre.get(l.userId) ?? {
      nom: l.user.nomRp,
      nbCrafts: 0,
      brut: 0,
      taxe: 0,
      net: 0,
      benefice: 0,
    };
    m.nbCrafts++;
    m.brut += l.revenuBrut;
    m.taxe += l.taxe;
    m.net += l.revenuNet;
    m.benefice += l.benefice;
    parMembre.set(l.userId, m);

    const o = parObjet.get(l.materialId) ?? { label: l.material.label, quantite: 0, brut: 0 };
    o.quantite += l.quantite;
    o.brut += l.revenuBrut;
    parObjet.set(l.materialId, o);
  }

  return {
    totaux: t,
    nbArtisans: parMembre.size,
    details: {
      parMembre: [...parMembre.values()].sort((a, b) => b.brut - a.brut),
      parObjet: [...parObjet.values()].sort((a, b) => b.brut - a.brut),
    } satisfies Detail,
  };
}

/** Ajoute n jours à une date sans dériver aux changements d'heure. */
function plusJours(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/**
 * Fige les comptes rendus manquants des jours et semaines écoulés.
 *
 * Aucune tâche planifiée n'est nécessaire : le rattrapage se fait à la
 * consultation. C'est ce qui permet au hub de tourner sur n'importe quel
 * hébergement gratuit, sans cron ni service en arrière-plan.
 *
 * Tout tient en trois lectures et une écriture groupée : on ne repasse pas
 * une requête par jour et par métier. Les périodes sans production ne sont
 * pas écrites — un jour sans forge n'a pas de compte rendu, et c'est plus
 * honnête qu'une ligne à zéro.
 */
export async function assurerRapports(joursEnArriere = 30) {
  const premiere = await prisma.productionEntry.findFirst({
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });
  if (!premiere) return; // rien n'a jamais été fabriqué

  const metiers = await prisma.metier.findMany({
    where: { isProducer: true },
    select: { id: true, key: true },
  });
  const cibles: ({ id: string; key: string } | null)[] = [null, ...metiers];

  const aujourdhui = minuit(new Date());
  const plancher = plusJours(aujourdhui, -joursEnArriere);
  const debutFenetre = new Date(
    Math.max(minuit(premiere.createdAt).getTime(), plancher.getTime()),
  );

  const [cles, prods] = await Promise.all([
    prisma.rapport
      .findMany({ where: { debut: { gte: debutFenetre } }, select: { cle: true } })
      .then((r) => new Set(r.map((x) => x.cle))),
    prisma.productionEntry.findMany({
      where: { createdAt: { gte: debutFenetre } },
      include: { user: { select: { nomRp: true } }, material: { select: { label: true } } },
    }) as Promise<LigneProd[]>,
  ]);

  const periodes: { periode: "jour" | "semaine"; debut: Date; fin: Date }[] = [];
  for (let d = new Date(debutFenetre); d < aujourdhui; d = plusJours(d, 1)) {
    periodes.push({ periode: "jour", debut: new Date(d), fin: plusJours(d, 1) });
  }
  const lundiCourant = lundi(new Date());
  for (let d = lundi(debutFenetre); d < lundiCourant; d = plusJours(d, 7)) {
    periodes.push({ periode: "semaine", debut: new Date(d), fin: plusJours(d, 7) });
  }

  const aCreer = [];
  for (const p of periodes) {
    const duLot = prods.filter((x) => x.createdAt >= p.debut && x.createdAt < p.fin);
    if (duLot.length === 0) continue;

    for (const cible of cibles) {
      const cle = cleRapport(p.periode, p.debut, cible?.key ?? null);
      if (cles.has(cle)) continue;

      const lignes = cible ? duLot.filter((x) => x.metierId === cible.id) : duLot;
      if (lignes.length === 0) continue;

      const { totaux, nbArtisans, details } = composer(lignes);
      aCreer.push({
        cle,
        periode: p.periode,
        debut: p.debut,
        fin: p.fin,
        metierId: cible?.id ?? null,
        nbCrafts: totaux.nbCrafts,
        nbArtisans,
        quantite: totaux.quantite,
        revenuBrut: totaux.brut,
        taxe: totaux.taxe,
        revenuNet: totaux.net,
        coutMatiere: Math.round(totaux.cout),
        benefice: totaux.benefice,
        details: JSON.stringify(details),
      });
    }
  }

  if (aCreer.length > 0) await prisma.rapport.createMany({ data: aCreer });
}

/** Chiffres de la journée en cours, calculés à la volée (pas encore figés). */
export async function journeeEnCours(metierId?: string) {
  const debut = minuit(new Date());
  const lignes = await prisma.productionEntry.findMany({
    where: { createdAt: { gte: debut }, ...(metierId ? { metierId } : {}) },
    select: {
      quantite: true,
      revenuBrut: true,
      taxe: true,
      revenuNet: true,
      coutMatiere: true,
      benefice: true,
    },
  });
  return totaliser(lignes);
}

export { chiffrerRecette, coursDuMarche };
