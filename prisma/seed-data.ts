/**
 * Référentiels de départ de la Maison Givrelune.
 * Tout ce qui est ici est éditable depuis le site après installation :
 * ce fichier ne sert qu'à amorcer une base vide.
 */

// ─── Rangs ───────────────────────────────────────────────────

export const RANKS = [
  {
    key: "patriarche",
    label: "Patriarche",
    level: 1,
    color: "#e0c98a",
    description:
      "Fondateur et seigneur de la Maison. Autorité pleine et entière sur toutes les branches, les biens et les alliances.",
  },
  {
    key: "haut_pere",
    label: "Haut-Père",
    level: 2,
    color: "#c8b273",
    description:
      "Peut diriger une branche, valider les registres et engager la Maison sur les décisions courantes.",
  },
  {
    key: "pere",
    label: "Père",
    level: 3,
    color: "#a8bed4",
    description: "Encadre les membres, crée les entrées de registre et forme les Fils.",
  },
  {
    key: "fils",
    label: "Fils",
    level: 4,
    color: "#8fa3b8",
    description: "Membre de la Maison : lecture des registres de sa branche et soumission de demandes.",
  },
];

// ─── Conseil de la Maison ────────────────────────────────────

export const COUNCIL_ROLES = [
  {
    key: "senechal",
    label: "Sénéchal",
    position: 1,
    icon: "senechal",
    description:
      "Co-administrateur de la Maison. Supervise les branches, l'admission des membres et la bonne tenue des registres.",
  },
  {
    key: "champion",
    label: "Champion",
    position: 2,
    icon: "champion",
    description: "Bras armé de la Maison. Conduit les missions, les opérations martiales et les droits de passage.",
  },
  {
    key: "intendant",
    label: "Intendant",
    position: 3,
    icon: "intendant",
    description:
      "Gardien des ressources et des biens communs : stocks, trésorerie, commerce et cours du marché.",
  },
  {
    key: "pretre",
    label: "Prêtre",
    position: 4,
    icon: "pretre",
    description: "Veille aux rites, aux cérémonies et à la mémoire de la Maison.",
  },
  {
    key: "mage",
    label: "Mage",
    position: 5,
    icon: "mage",
    description: "Étudie la magie, les artefacts et les enchantements au service de la Maison.",
  },
];

// ─── Branches & grades ───────────────────────────────────────

export const BRANCHES = [
  {
    key: "militaire",
    label: "Militaire",
    position: 1,
    icon: "militaire",
    color: "#b5563f",
    motto: "La lame veille quand la Maison dort.",
    description:
      "Défense de la Maison, opérations armées, escortes et droits de passage. Toute action de force passe par elle.",
    grades: [
      { key: "maitre_de_guerre", label: "Maître de Guerre", level: 1 },
      { key: "capitaine", label: "Capitaine", level: 2 },
      { key: "guerrier", label: "Guerrier", level: 3 },
      { key: "recrue", label: "Recrue", level: 4 },
    ],
  },
  {
    key: "garde_chasse",
    label: "Garde-Chasse",
    position: 2,
    icon: "garde_chasse",
    color: "#5f8f6a",
    motto: "Nul sentier ne nous est étranger.",
    description:
      "Patrouilles, surveillance des terres, traque et délivrance des permis de récolte. Gardienne des ressources sauvages.",
    grades: [
      { key: "capitaine_garde", label: "Capitaine de la Garde", level: 1 },
      { key: "garde_chasse", label: "Garde-Chasse", level: 2 },
      { key: "apprenti_garde_chasse", label: "Apprenti Garde-Chasse", level: 3 },
      { key: "pisteur", label: "Pisteur", level: 4 },
    ],
  },
  {
    key: "commerciale",
    label: "Commerciale",
    position: 3,
    icon: "commerciale",
    color: "#c8a04a",
    motto: "Le Septim bien placé vaut mille lames.",
    description:
      "Négoce, contrats, cours du marché et trésorerie. Elle transforme le travail de la Maison en richesse.",
    grades: [
      { key: "argentier", label: "Argentier", level: 1 },
      { key: "negociant", label: "Négociant", level: 2 },
      { key: "marchand", label: "Marchand", level: 3 },
      { key: "apprenti_commerce", label: "Apprenti", level: 4 },
    ],
  },
  {
    key: "artisanat",
    label: "Artisanat",
    position: 4,
    icon: "artisanat",
    color: "#7f8fb0",
    motto: "Ce que nos mains façonnent, nul ne peut nous l'ôter.",
    description:
      "Ateliers, commandes, recettes et stocks. Le cœur productif de la Maison, de la fonte au vêtement de cour.",
    grades: [
      { key: "maitre_artisan", label: "Maître Artisan", level: 1 },
      { key: "artisan", label: "Artisan", level: 2 },
      { key: "compagnon", label: "Compagnon", level: 3 },
      { key: "apprenti_artisanat", label: "Apprenti", level: 4 },
    ],
  },
];

export const CIRCLES = [
  {
    key: "grande_ramure",
    label: "La Grande Ramure",
    branchKey: "garde_chasse",
    description:
      "Cercle d'élite du Garde-Chasse. Ses membres connaissent les bois, les cols et les bêtes mieux que quiconque en Bordeciel.",
  },
];

// ─── Métiers ─────────────────────────────────────────────────

export const METIERS = [
  // Extraction & récolte
  { key: "mineur", label: "Mineur", category: "extraction", position: 1, isProducer: false, station: "Filon", description: "Extrait les minerais des filons et des mines." },
  { key: "bucheron", label: "Bûcheron", category: "extraction", position: 2, isProducer: true, station: "Billot", description: "Abat le bois, produit bûches, charbon et briquettes." },
  { key: "chasseur", label: "Chasseur", category: "extraction", position: 3, isProducer: true, station: "Chevalet de tannage", description: "Traque le gibier ; fournit peaux, cuir, lanières, fourrures et viandes." },
  { key: "pecheur", label: "Pêcheur", category: "extraction", position: 4, isProducer: false, station: "Rive", description: "Ramène les poissons des lacs et des rivières." },
  { key: "fermier", label: "Fermier", category: "extraction", position: 5, isProducer: false, station: "Champ", description: "Cultive blé, légumes et plantes domestiques." },
  { key: "herboriste", label: "Herboriste", category: "extraction", position: 6, isProducer: false, station: "Cueillette", description: "Récolte plantes, champignons et ingrédients rares." },

  // Transformation & production
  { key: "forgeron", label: "Forgeron", category: "transformation", position: 10, isProducer: true, station: "Forge & Fourneau", description: "Fond les minerais en lingots, forge armes et armures." },
  { key: "couturier", label: "Couturier", category: "transformation", position: 11, isProducer: true, station: "Établi de couture", description: "Travaille tissus et cuirs : vêtements, tenues de cour, livrées." },
  { key: "bijoutier", label: "Bijoutier", category: "transformation", position: 12, isProducer: true, station: "Établi de joaillerie", description: "Sertit gemmes et travaille or et argent en parures." },
  { key: "alchimiste", label: "Alchimiste", category: "transformation", position: 13, isProducer: true, station: "Table d'alchimie", description: "Distille potions et poisons à partir des ingrédients." },
  { key: "cuisinier", label: "Cuisinier", category: "transformation", position: 14, isProducer: true, station: "Marmite", description: "Prépare plats, rations et boissons de la Maison." },
  { key: "enchanteur", label: "Enchanteur", category: "transformation", position: 15, isProducer: true, station: "Table d'enchantement", description: "Grave les effets magiques sur armes, armures et bijoux." },

  // Services & protection
  { key: "marchand", label: "Marchand / Négociant", category: "service", position: 20, isProducer: false, station: "Comptoir", description: "Achète, vend, troque et tient le cours du marché." },
  { key: "mercenaire", label: "Guerrier / Mercenaire", category: "service", position: 21, isProducer: false, station: "", description: "Loue sa lame pour les missions et les escortes." },
  { key: "garde", label: "Garde", category: "service", position: 22, isProducer: false, station: "", description: "Assure la protection des biens, des convois et des membres." },
  { key: "pretre_metier", label: "Prêtre", category: "service", position: 23, isProducer: false, station: "Autel", description: "Conduit les rites et les cérémonies de la Maison." },
  { key: "mage_metier", label: "Mage", category: "service", position: 24, isProducer: false, station: "", description: "Étudie les arcanes et les artefacts." },
  { key: "barde", label: "Barde", category: "service", position: 25, isProducer: false, station: "", description: "Porte le nom de la Maison par le chant et le récit." },
];

// ─── Matières ────────────────────────────────────────────────
// state : brut | minerai | lingot | raffine | transforme | fini

type MaterialSeed = {
  key: string;
  label: string;
  category: string;
  subcategory?: string;
  state?: string;
  unit?: string;
  isCraftable?: boolean;
};

export const MATERIALS: MaterialSeed[] = [
  // ── Minerais & Métaux
  { key: "minerai_fer", label: "Minerai de fer", category: "Minerais & Métaux", subcategory: "Fer", state: "minerai" },
  { key: "lingot_fer", label: "Lingot de fer", category: "Minerais & Métaux", subcategory: "Fer", state: "lingot", unit: "lingot", isCraftable: true },
  { key: "lingot_acier", label: "Lingot d'acier", category: "Minerais & Métaux", subcategory: "Acier", state: "lingot", unit: "lingot", isCraftable: true },
  { key: "minerai_corindon", label: "Minerai de corindon", category: "Minerais & Métaux", subcategory: "Corindon", state: "minerai" },
  { key: "lingot_corindon", label: "Lingot de corindon", category: "Minerais & Métaux", subcategory: "Corindon", state: "lingot", unit: "lingot", isCraftable: true },
  { key: "minerai_or", label: "Minerai d'or", category: "Minerais & Métaux", subcategory: "Or", state: "minerai" },
  { key: "lingot_or", label: "Lingot d'or", category: "Minerais & Métaux", subcategory: "Or", state: "lingot", unit: "lingot", isCraftable: true },
  { key: "minerai_argent", label: "Minerai d'argent", category: "Minerais & Métaux", subcategory: "Argent", state: "minerai" },
  { key: "lingot_argent", label: "Lingot d'argent", category: "Minerais & Métaux", subcategory: "Argent", state: "lingot", unit: "lingot", isCraftable: true },
  { key: "minerai_orichalque", label: "Minerai d'orichalque", category: "Minerais & Métaux", subcategory: "Orichalque", state: "minerai" },
  { key: "lingot_orichalque", label: "Lingot d'orichalque", category: "Minerais & Métaux", subcategory: "Orichalque", state: "lingot", unit: "lingot", isCraftable: true },
  { key: "minerai_ebonite", label: "Minerai d'ébonite", category: "Minerais & Métaux", subcategory: "Ébonite", state: "minerai" },
  { key: "lingot_ebonite", label: "Lingot d'ébonite", category: "Minerais & Métaux", subcategory: "Ébonite", state: "lingot", unit: "lingot", isCraftable: true },
  { key: "minerai_malachite", label: "Minerai de malachite", category: "Minerais & Métaux", subcategory: "Verre", state: "minerai" },
  { key: "malachite_raffinee", label: "Malachite raffinée (verre)", category: "Minerais & Métaux", subcategory: "Verre", state: "raffine", unit: "lingot", isCraftable: true },
  { key: "minerai_pierre_lune", label: "Pierre de lune brute", category: "Minerais & Métaux", subcategory: "Pierre de lune", state: "minerai" },
  { key: "pierre_lune_raffinee", label: "Pierre de lune raffinée", category: "Minerais & Métaux", subcategory: "Pierre de lune", state: "raffine", unit: "lingot", isCraftable: true },
  { key: "minerai_vif_argent", label: "Minerai de vif-argent", category: "Minerais & Métaux", subcategory: "Vif-argent", state: "minerai" },
  { key: "lingot_vif_argent", label: "Lingot de vif-argent", category: "Minerais & Métaux", subcategory: "Vif-argent", state: "lingot", unit: "lingot", isCraftable: true },
  { key: "ferraille_dwemer", label: "Ferraille dwemer", category: "Minerais & Métaux", subcategory: "Dwemer", state: "brut" },
  { key: "lingot_dwemer", label: "Lingot dwemer", category: "Minerais & Métaux", subcategory: "Dwemer", state: "lingot", unit: "lingot", isCraftable: true },

  // ── Gemmes & Âmes
  { key: "gemme", label: "Gemme", category: "Gemmes & Âmes", subcategory: "Gemmes", state: "brut" },
  { key: "pierre_ame", label: "Pierre d'âme", category: "Gemmes & Âmes", subcategory: "Pierres d'âme", state: "brut" },

  // ── Bois
  { key: "buche", label: "Bûche", category: "Bois", subcategory: "Bûches", state: "brut" },
  { key: "bois_scie", label: "Bois scié", category: "Bois", subcategory: "Bois scié", state: "transforme", isCraftable: true },
  { key: "charbon", label: "Charbon", category: "Bois", subcategory: "Charbon", state: "transforme", isCraftable: true },
  { key: "briquette", label: "Briquette", category: "Bois", subcategory: "Briquettes", state: "transforme" },
  { key: "coke", label: "Coke", category: "Bois", subcategory: "Coke", state: "transforme" },

  // ── Peaux & Cuir
  { key: "peau", label: "Peau", category: "Peaux & Cuir", subcategory: "Peaux", state: "brut" },
  { key: "cuir", label: "Cuir", category: "Peaux & Cuir", subcategory: "Cuir", state: "transforme", isCraftable: true },
  { key: "laniere_cuir", label: "Lanière de cuir", category: "Peaux & Cuir", subcategory: "Lanières", state: "transforme", unit: "lanière", isCraftable: true },
  { key: "fourrure", label: "Fourrure", category: "Peaux & Cuir", subcategory: "Fourrures", state: "brut" },

  // ── Tissus
  { key: "lin", label: "Lin", category: "Tissus", subcategory: "Lin", state: "brut", unit: "pièce" },
  { key: "coton", label: "Coton", category: "Tissus", subcategory: "Coton", state: "brut", unit: "pièce" },
  { key: "laine", label: "Laine", category: "Tissus", subcategory: "Laine", state: "brut", unit: "pièce" },
  { key: "soie", label: "Soie", category: "Tissus", subcategory: "Soie", state: "brut", unit: "pièce" },
  { key: "teinture", label: "Teinture", category: "Tissus", subcategory: "Teintures", state: "brut", unit: "fiole" },
  { key: "fil_or", label: "Fil d'or", category: "Tissus", subcategory: "Fil d'or", state: "transforme", unit: "bobine", isCraftable: true },

  // ── Alchimie
  { key: "plante", label: "Plante", category: "Alchimie", subcategory: "Plantes", state: "brut" },
  { key: "champignon", label: "Champignon", category: "Alchimie", subcategory: "Champignons", state: "brut" },
  { key: "ingredient_rare", label: "Ingrédient rare", category: "Alchimie", subcategory: "Ingrédients rares", state: "brut" },
  { key: "potion_soin", label: "Potion de soin", category: "Alchimie", subcategory: "Potions", state: "fini", unit: "fiole", isCraftable: true },
  { key: "poison", label: "Poison", category: "Alchimie", subcategory: "Poisons", state: "fini", unit: "fiole", isCraftable: true },

  // ── Nourriture
  { key: "viande", label: "Viande", category: "Nourriture", subcategory: "Viandes", state: "brut" },
  { key: "poisson", label: "Poisson", category: "Nourriture", subcategory: "Poissons", state: "brut" },
  { key: "legume", label: "Légume", category: "Nourriture", subcategory: "Légumes", state: "brut" },
  { key: "ble", label: "Blé", category: "Nourriture", subcategory: "Légumes", state: "brut", unit: "gerbe" },
  { key: "boisson", label: "Boisson", category: "Nourriture", subcategory: "Boissons", state: "brut", unit: "chope" },
  { key: "ragout", label: "Ragoût de la Maison", category: "Nourriture", subcategory: "Rations", state: "fini", unit: "portion", isCraftable: true },
  { key: "ration", label: "Ration de campagne", category: "Nourriture", subcategory: "Rations", state: "fini", unit: "ration", isCraftable: true },

  // ── Produits finis
  // Les armes et armures des paliers (fer → écailles de dragon) sont
  // engendrées automatiquement : voir prisma/seed-craft.ts.
  { key: "tenue_simple", label: "Tenue simple", category: "Produits finis", subcategory: "Vêtements", state: "fini", isCraftable: true },
  { key: "tenue_noble", label: "Tenue noble", category: "Produits finis", subcategory: "Vêtements", state: "fini", isCraftable: true },
];

// ─── Recettes ────────────────────────────────────────────────

type RecipeSeed = {
  label: string;
  metierKey: string;
  output: string;
  outputQty?: number;
  station?: string;
  isChain?: boolean;
  notes?: string;
  items: [string, number][];
};

const A_CALER = "Quantités à caler avec le maître du métier — recette modifiable depuis l'atelier.";

export const RECIPES: RecipeSeed[] = [
  // ── Fonte (Forgeron, fourneau)
  { label: "Fonte : lingot de fer", metierKey: "forgeron", output: "lingot_fer", station: "Fourneau", isChain: true, items: [["minerai_fer", 1]] },
  { label: "Fonte : lingot d'acier", metierKey: "forgeron", output: "lingot_acier", station: "Fourneau", isChain: true, items: [["minerai_fer", 1], ["minerai_corindon", 1]] },
  { label: "Fonte : lingot d'or", metierKey: "forgeron", output: "lingot_or", station: "Fourneau", isChain: true, items: [["minerai_or", 2]] },
  { label: "Fonte : lingot d'argent", metierKey: "forgeron", output: "lingot_argent", station: "Fourneau", isChain: true, items: [["minerai_argent", 2]] },
  { label: "Fonte : lingot de corindon", metierKey: "forgeron", output: "lingot_corindon", station: "Fourneau", isChain: true, items: [["minerai_corindon", 2]] },
  { label: "Fonte : lingot d'orichalque", metierKey: "forgeron", output: "lingot_orichalque", station: "Fourneau", isChain: true, items: [["minerai_orichalque", 2]] },
  { label: "Fonte : lingot d'ébonite", metierKey: "forgeron", output: "lingot_ebonite", station: "Fourneau", isChain: true, items: [["minerai_ebonite", 2]] },
  { label: "Fonte : lingot de vif-argent", metierKey: "forgeron", output: "lingot_vif_argent", station: "Fourneau", isChain: true, items: [["minerai_vif_argent", 2]] },
  { label: "Fonte : malachite raffinée", metierKey: "forgeron", output: "malachite_raffinee", station: "Fourneau", isChain: true, items: [["minerai_malachite", 2]] },
  { label: "Fonte : pierre de lune raffinée", metierKey: "forgeron", output: "pierre_lune_raffinee", station: "Fourneau", isChain: true, items: [["minerai_pierre_lune", 2]] },
  { label: "Fonte : lingot dwemer", metierKey: "forgeron", output: "lingot_dwemer", station: "Fourneau", isChain: true, notes: "Obtenu à partir de ferraille dwemer récupérée dans les ruines.", items: [["ferraille_dwemer", 2]] },

  // ── Tannage (Chasseur, chevalet)
  { label: "Tannage : cuir", metierKey: "chasseur", output: "cuir", station: "Chevalet de tannage", isChain: true, items: [["peau", 1]] },
  { label: "Découpe : lanières de cuir", metierKey: "chasseur", output: "laniere_cuir", outputQty: 4, station: "Chevalet de tannage", isChain: true, items: [["cuir", 1]] },

];
// Le reste de l'arbre — armurerie complète, couture, alchimie, cuisine,
// enchantement, bois — est décrit dans prisma/seed-craft.ts.
void A_CALER;

// ─── Prix indicatifs de départ (Septims) ─────────────────────
// Amorce du cours du marché : les membres corrigent ensuite au fil de l'eau.

export const PRIX_DEPART: Record<string, number> = {
  minerai_fer: 8,
  lingot_fer: 20,
  lingot_acier: 45,
  minerai_corindon: 25,
  lingot_corindon: 60,
  minerai_or: 60,
  lingot_or: 140,
  minerai_argent: 35,
  lingot_argent: 85,
  minerai_orichalque: 30,
  lingot_orichalque: 75,
  minerai_ebonite: 120,
  lingot_ebonite: 280,
  minerai_malachite: 90,
  malachite_raffinee: 210,
  minerai_pierre_lune: 45,
  pierre_lune_raffinee: 110,
  minerai_vif_argent: 30,
  lingot_vif_argent: 70,
  ferraille_dwemer: 40,
  lingot_dwemer: 95,
  gemme: 150,
  pierre_ame: 90,
  buche: 4,
  bois_scie: 3,
  charbon: 6,
  briquette: 5,
  coke: 9,
  peau: 12,
  cuir: 18,
  laniere_cuir: 6,
  fourrure: 30,
  lin: 10,
  coton: 12,
  laine: 9,
  soie: 55,
  teinture: 22,
  fil_or: 80,
  plante: 7,
  champignon: 9,
  ingredient_rare: 65,
  viande: 8,
  poisson: 7,
  legume: 5,
  ble: 6,
  boisson: 10,
};

// ─── Pages institutionnelles ─────────────────────────────────

export const REGLEMENT = `## I. Respect

Tout membre doit le respect à ses frères de Maison comme aux étrangers reçus sous notre toit. Les insultes, le harcèlement et les provocations gratuites n'ont pas leur place chez Givrelune. Un différend se règle en privé ; s'il persiste, il remonte à un Père, puis au Conseil.

## II. Roleplay et Hors-Roleplay

La distinction entre RP et HRP doit rester nette. Ce qui est dit en jeu appartient au personnage, non au joueur. Le metagaming — utiliser en RP une information obtenue en HRP — et le powergaming sont proscrits. Les salons HRP existent pour cela : servez-vous-en.

## III. Hiérarchie

Les ordres d'un supérieur se suivent. Un Fils obéit à un Père, un Père à un Haut-Père, un Haut-Père aux Patriarches. Le désaccord se dit, mais après l'exécution, et par les voies prévues. Contester un ordre devant des étrangers est une faute.

## IV. Loyauté

La Maison passe avant l'intérêt personnel. Nul ne signe de contrat, ne noue d'alliance ni n'engage le nom de Givrelune sans mandat d'un Patriarche ou d'un membre expressément autorisé. La trahison est la seule faute qui ne se rachète pas.

## V. Usage de la force

Aucune opération armée ne s'engage sans autorisation de la hiérarchie. On ne dégaine ni par humeur, ni par profit personnel. Les représailles se décident au Conseil, jamais dans l'instant.

## VI. Biens communs

Les stocks, la trésorerie et les ateliers appartiennent à la Maison. Tout prélèvement se déclare et se consigne au registre. Servir aux communs sans l'inscrire est un vol, quel que soit le rang de celui qui prend.

## VII. Absences

Une absence prolongée se déclare à l'avance au registre de présence. Un membre absent sans avis pendant une longue période voit son rang gelé, puis son dossier versé aux archives.

## VIII. Sanctions

Les manquements sont sanctionnés par avertissement, rétrogradation, exclusion temporaire ou bannissement, selon la gravité et la récidive. La décision revient aux Patriarches, assistés du Sénéchal. Toute sanction est motivée et consignée.`;

export const HISTOIRE = `## Deux hommes sans nom

La Maison Givrelune ne descend d'aucun sang noble. Elle naît de deux hommes qui n'avaient rien à hériter : **Marcus Varro**, maître couturier impérial dont l'aiguille habillait les cours sans jamais y être invitée, et **Nicolas Imperium Varian**, qui refusa qu'un titre absent décide de sa vie.

Ils firent le même constat : en Bordeciel, on ne vous demande pas d'où vous venez si votre travail est irréprochable et votre parole tenue.

## Le givre et la lune

Le nom vint d'une nuit d'hiver. Le **givre**, parce qu'il ne conquiert rien par la force : il avance lentement, sans bruit, et au matin tout lui appartient. C'est notre patience, notre discipline, notre manière de bâtir. La **lune**, parce qu'elle ne demande à personne la permission d'être vue. C'est notre ambition : une élévation que nul ne pourra ignorer.

> « Le givre forge notre patience. La lune éclaire notre destinée. Nos actes écriront notre nom. »

## Bâtir par les actes

Les premiers Septims vinrent de l'artisanat : des lingots fondus, des lanières taillées, des tenues livrées à l'heure. Puis vinrent les contrats, les escortes, les alliances. Chaque branche fut créée le jour où le besoin s'en fit sentir — le Militaire pour tenir les routes, le Garde-Chasse pour tenir les terres, la Commerciale pour tenir les comptes, l'Artisanat pour tenir la promesse.

## Ce que nous cherchons

Richesse, terres, réputation, pouvoir. Nous ne nous en cachons pas. Mais rien de tout cela ne se prend : cela se **mérite**, contrat après contrat, patrouille après patrouille, commande après commande.

Chez Givrelune, le rang ne se reçoit pas par la naissance. **Les actes forgent le nom.**`;
