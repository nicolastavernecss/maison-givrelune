import { prisma } from "./db";
import { DEFAULT_MARGIN } from "./domain";

/* ══════════════════════════════════════════════════════════════
   Cours du marché
   ══════════════════════════════════════════════════════════════ */

export type Cours = {
  materialId: string;
  dernier: number;
  precedent: number | null;
  moyenne: number;
  min: number;
  max: number;
  nb: number;
  date: Date;
  historique: { t: number; v: number }[];
};

/**
 * Cours de toutes les matières, calculé à partir des relevés des membres.
 * Une seule requête : l'économie de la Maison tient largement en mémoire.
 */
export async function coursDuMarche(): Promise<Map<string, Cours>> {
  const releves = await prisma.marketPrice.findMany({
    orderBy: { date: "asc" },
    select: { materialId: true, price: true, date: true },
  });

  const parMatiere = new Map<string, { price: number; date: Date }[]>();
  for (const r of releves) {
    const liste = parMatiere.get(r.materialId);
    if (liste) liste.push(r);
    else parMatiere.set(r.materialId, [r]);
  }

  const cours = new Map<string, Cours>();
  for (const [materialId, liste] of parMatiere) {
    const prix = liste.map((r) => r.price);
    const dernierReleve = liste[liste.length - 1];
    cours.set(materialId, {
      materialId,
      dernier: dernierReleve.price,
      precedent: liste.length > 1 ? liste[liste.length - 2].price : null,
      moyenne: prix.reduce((a, b) => a + b, 0) / prix.length,
      min: Math.min(...prix),
      max: Math.max(...prix),
      nb: liste.length,
      date: dernierReleve.date,
      historique: liste.map((r) => ({ t: r.date.getTime(), v: r.price })),
    });
  }
  return cours;
}

/** Table simple materialId → dernier prix connu. */
export function prixCourants(cours: Map<string, Cours>): Map<string, number> {
  return new Map([...cours].map(([id, c]) => [id, c.dernier]));
}

/* ══════════════════════════════════════════════════════════════
   Calcul du coût de fabrication
   ══════════════════════════════════════════════════════════════ */

export type RecetteCalcul = {
  id: string;
  outputMaterialId: string;
  outputQty: number;
  items: { materialId: string; quantity: number }[];
};

export type LigneCout = {
  materialId: string;
  label: string;
  quantite: number;
  prixUnitaire: number | null;
  cout: number | null;
  /** D'où vient le prix retenu. */
  source: "marche" | "fabrication" | "inconnu";
  /** Décomposition si la matière est elle-même fabriquée. */
  sous?: LigneCout[];
};

export type Chiffrage = {
  /** Coût des composants directs, au cours du marché. */
  coutMarche: number | null;
  /** Coût en remontant chaque palier jusqu'à la matière brute. */
  coutChaine: number | null;
  /** Coût retenu (chaîne si calculable, sinon marché). */
  cout: number | null;
  lignes: LigneCout[];
  /** Matières dont le prix est inconnu — le chiffrage est alors partiel. */
  manquantes: string[];
  prixConseille: number | null;
  marge: number;
};

type Contexte = {
  prix: Map<string, number>;
  recettesParSortie: Map<string, RecetteCalcul>;
  labels: Map<string, string>;
};

/** Coût d'une unité de matière, en remontant les paliers de transformation. */
function coutUnitaire(
  materialId: string,
  ctx: Contexte,
  vus: Set<string>,
): { cout: number | null; source: LigneCout["source"]; sous?: LigneCout[] } {
  const recette = ctx.recettesParSortie.get(materialId);

  // Cycle (A fabrique B qui fabrique A) : on retombe sur le marché.
  if (recette && !vus.has(materialId)) {
    vus.add(materialId);
    const sous: LigneCout[] = [];
    let total = 0;
    let complet = true;

    for (const item of recette.items) {
      const r = coutUnitaire(item.materialId, ctx, vus);
      const cout = r.cout === null ? null : r.cout * item.quantity;
      if (cout === null) complet = false;
      else total += cout;
      sous.push({
        materialId: item.materialId,
        label: ctx.labels.get(item.materialId) ?? "?",
        quantite: item.quantity,
        prixUnitaire: r.cout,
        cout,
        source: r.source,
        sous: r.sous,
      });
    }
    vus.delete(materialId);

    if (complet) {
      return { cout: total / Math.max(1, recette.outputQty), source: "fabrication", sous };
    }
  }

  const marche = ctx.prix.get(materialId);
  if (marche !== undefined) return { cout: marche, source: "marche" };
  return { cout: null, source: "inconnu" };
}

/**
 * Chiffre une recette : coût au marché, coût en chaîne complète,
 * prix conseillé et marge. C'est le calculateur demandé au §5.3.
 */
export function chiffrerRecette(
  recette: RecetteCalcul,
  ctx: Contexte,
  marge: number = DEFAULT_MARGIN,
): Chiffrage {
  const lignes: LigneCout[] = [];
  const manquantes: string[] = [];
  let coutMarche = 0;
  let coutChaine = 0;
  let marcheComplet = true;
  let chaineComplete = true;

  for (const item of recette.items) {
    const label = ctx.labels.get(item.materialId) ?? "?";
    const prixMarche = ctx.prix.get(item.materialId);
    const chaine = coutUnitaire(item.materialId, ctx, new Set());

    if (prixMarche === undefined) marcheComplet = false;
    else coutMarche += prixMarche * item.quantity;

    if (chaine.cout === null) {
      chaineComplete = false;
      if (!manquantes.includes(label)) manquantes.push(label);
    } else {
      coutChaine += chaine.cout * item.quantity;
    }

    lignes.push({
      materialId: item.materialId,
      label,
      quantite: item.quantity,
      prixUnitaire: chaine.cout ?? prixMarche ?? null,
      cout: chaine.cout !== null ? chaine.cout * item.quantity : prixMarche !== undefined ? prixMarche * item.quantity : null,
      source: chaine.source,
      sous: chaine.sous,
    });
  }

  const q = Math.max(1, recette.outputQty);
  const cm = marcheComplet ? coutMarche / q : null;
  const cc = chaineComplete ? coutChaine / q : null;
  const retenu = cc ?? cm;

  return {
    coutMarche: cm,
    coutChaine: cc,
    cout: retenu,
    lignes,
    manquantes,
    prixConseille: retenu === null ? null : Math.round(retenu * (1 + marge)),
    marge,
  };
}

/** Prépare le contexte de calcul : prix, recettes et libellés. */
export async function contexteChiffrage(): Promise<Contexte> {
  const [cours, recettes, matieres] = await Promise.all([
    coursDuMarche(),
    prisma.recipe.findMany({
      select: {
        id: true,
        outputMaterialId: true,
        outputQty: true,
        items: { select: { materialId: true, quantity: true } },
      },
    }),
    prisma.material.findMany({ select: { id: true, label: true } }),
  ]);

  // Si plusieurs recettes produisent la même matière, on retient la première :
  // les maîtres de métier peuvent réordonner en éditant leurs recettes.
  const recettesParSortie = new Map<string, RecetteCalcul>();
  for (const r of recettes) {
    if (!recettesParSortie.has(r.outputMaterialId)) recettesParSortie.set(r.outputMaterialId, r);
  }

  return {
    prix: prixCourants(cours),
    recettesParSortie,
    labels: new Map(matieres.map((m) => [m.id, m.label])),
  };
}

/* ══════════════════════════════════════════════════════════════
   Faisabilité : que peut-on produire avec ce qu'on a ?
   ══════════════════════════════════════════════════════════════ */

/** Nombre d'exemplaires fabricables avec un inventaire donné (composants directs). */
export function fabricablesAvec(
  recette: RecetteCalcul,
  stock: Map<string, number>,
): { possible: number; limitant: string | null } {
  let possible = Infinity;
  let limitant: string | null = null;

  for (const item of recette.items) {
    if (item.quantity <= 0) continue;
    const dispo = stock.get(item.materialId) ?? 0;
    const n = Math.floor(dispo / item.quantity);
    if (n < possible) {
      possible = n;
      limitant = item.materialId;
    }
  }
  if (possible === Infinity) return { possible: 0, limitant: null };
  return { possible: possible * Math.max(1, recette.outputQty), limitant };
}

/* ══════════════════════════════════════════════════════════════
   Valorisation d'inventaire
   ══════════════════════════════════════════════════════════════ */

export function valoriser(
  lignes: { materialId: string | null; quantity: number; unitValue: number | null }[],
  prix: Map<string, number>,
): number {
  return lignes.reduce((total, l) => {
    const pu = (l.materialId ? prix.get(l.materialId) : undefined) ?? l.unitValue ?? 0;
    return total + l.quantity * pu;
  }, 0);
}
