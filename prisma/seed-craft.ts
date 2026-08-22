/**
 * Arbre de fabrication de Skyrim.
 *
 * L'armurerie vanilla suit un schéma régulier : un palier de matériau
 * (fer, acier, nain, elfique…) croisé avec un gabarit de pièce (cuirasse,
 * casque, dague, épée…). Plutôt que de recopier cent quarante recettes à la
 * main, on décrit les deux axes et on engendre le croisement — c'est
 * exactement ainsi que le jeu est construit, et cela reste lisible.
 *
 * Les quantités suivent l'armurerie vanilla. Sur un serveur RP, l'équilibrage
 * peut différer : chaque recette reste modifiable depuis son atelier, sans
 * redéploiement.
 */

// ─────────────────────────────────────────────────────────────
//  Matières supplémentaires
// ─────────────────────────────────────────────────────────────

type MatiereCraft = {
  key: string;
  label: string;
  category: string;
  subcategory?: string;
  state?: string;
  unit?: string;
  isCraftable?: boolean;
};

export const MATIERES_CRAFT: MatiereCraft[] = [
  // ── Peaux nommées
  { key: "peau_cerf", label: "Peau de cerf", category: "Peaux & Cuir", subcategory: "Peaux" },
  { key: "peau_loup", label: "Peau de loup", category: "Peaux & Cuir", subcategory: "Peaux" },
  { key: "peau_ours", label: "Peau d'ours", category: "Peaux & Cuir", subcategory: "Peaux" },
  { key: "peau_sabre", label: "Peau de sabre", category: "Peaux & Cuir", subcategory: "Peaux" },
  { key: "peau_troll", label: "Peau de troll", category: "Peaux & Cuir", subcategory: "Peaux" },

  // ── Matières exotiques
  { key: "coeur_daedra", label: "Cœur de Daedra", category: "Minerais & Métaux", subcategory: "Daedrique", state: "brut" },
  { key: "os_dragon", label: "Os de dragon", category: "Minerais & Métaux", subcategory: "Dragon", state: "brut" },
  { key: "ecaille_dragon", label: "Écaille de dragon", category: "Minerais & Métaux", subcategory: "Dragon", state: "brut" },
  { key: "croc_chaurus", label: "Croc de chaurus", category: "Minerais & Métaux", subcategory: "Chitine", state: "brut" },
  { key: "chitine", label: "Chitine", category: "Minerais & Métaux", subcategory: "Chitine", state: "brut" },

  // ── Gemmes nommées
  { key: "gemme_amethyste", label: "Améthyste", category: "Gemmes & Âmes", subcategory: "Gemmes" },
  { key: "gemme_emeraude", label: "Émeraude", category: "Gemmes & Âmes", subcategory: "Gemmes" },
  { key: "gemme_rubis", label: "Rubis", category: "Gemmes & Âmes", subcategory: "Gemmes" },
  { key: "gemme_saphir", label: "Saphir", category: "Gemmes & Âmes", subcategory: "Gemmes" },
  { key: "gemme_diamant", label: "Diamant", category: "Gemmes & Âmes", subcategory: "Gemmes" },
  { key: "gemme_grenat", label: "Grenat", category: "Gemmes & Âmes", subcategory: "Gemmes" },

  // ── Pierres d'âme
  { key: "ame_petite", label: "Pierre d'âme mineure", category: "Gemmes & Âmes", subcategory: "Pierres d'âme" },
  { key: "ame_commune", label: "Pierre d'âme commune", category: "Gemmes & Âmes", subcategory: "Pierres d'âme" },
  { key: "ame_grande", label: "Grande pierre d'âme", category: "Gemmes & Âmes", subcategory: "Pierres d'âme" },
  { key: "ame_noire", label: "Pierre d'âme noire", category: "Gemmes & Âmes", subcategory: "Pierres d'âme" },

  // ── Ingrédients d'alchimie courants
  { key: "fleur_montagne", label: "Fleur de montagne", category: "Alchimie", subcategory: "Plantes" },
  { key: "chardon", label: "Chardon", category: "Alchimie", subcategory: "Plantes" },
  { key: "lavande", label: "Lavande", category: "Alchimie", subcategory: "Plantes" },
  { key: "ail", label: "Ail", category: "Alchimie", subcategory: "Plantes" },
  { key: "nirnrace", label: "Nirnrace", category: "Alchimie", subcategory: "Plantes" },
  { key: "chrysalis", label: "Aile de papillon", category: "Alchimie", subcategory: "Ingrédients rares" },
  { key: "poudre_os", label: "Poudre d'os", category: "Alchimie", subcategory: "Ingrédients rares" },
  { key: "sels_vides", label: "Sels vides", category: "Alchimie", subcategory: "Ingrédients rares" },
  { key: "oreille_porc", label: "Oreille de porc", category: "Alchimie", subcategory: "Champignons" },
  { key: "chapeau_mort", label: "Chapeau-de-mort", category: "Alchimie", subcategory: "Champignons" },
  { key: "racine_tourbe", label: "Racine de tourbe", category: "Alchimie", subcategory: "Plantes" },
  { key: "sel", label: "Sel", category: "Nourriture", subcategory: "Légumes" },

  // ── Produits d'alchimie
  { key: "potion_soin_majeure", label: "Potion de soin majeure", category: "Alchimie", subcategory: "Potions", state: "fini", unit: "fiole", isCraftable: true },
  { key: "potion_vigueur", label: "Potion de vigueur", category: "Alchimie", subcategory: "Potions", state: "fini", unit: "fiole", isCraftable: true },
  { key: "potion_magie", label: "Potion de magie", category: "Alchimie", subcategory: "Potions", state: "fini", unit: "fiole", isCraftable: true },
  { key: "potion_invisibilite", label: "Potion d'invisibilité", category: "Alchimie", subcategory: "Potions", state: "fini", unit: "fiole", isCraftable: true },
  { key: "poison_paralysie", label: "Poison de paralysie", category: "Alchimie", subcategory: "Poisons", state: "fini", unit: "fiole", isCraftable: true },
  { key: "poison_lent", label: "Poison lent", category: "Alchimie", subcategory: "Poisons", state: "fini", unit: "fiole", isCraftable: true },

  // Les bijoux sont engendrés dans le seed (métal × forme × sertissage).

  // ── Vêtements
  { key: "tenue_voyage", label: "Tenue de voyage", category: "Produits finis", subcategory: "Vêtements", state: "fini", isCraftable: true },
  { key: "robe_mage", label: "Robe de mage", category: "Produits finis", subcategory: "Vêtements", state: "fini", isCraftable: true },
  { key: "cape_fourrure", label: "Cape de fourrure", category: "Produits finis", subcategory: "Vêtements", state: "fini", isCraftable: true },
  { key: "bottes_cuir", label: "Bottes de cuir souple", category: "Produits finis", subcategory: "Vêtements", state: "fini", isCraftable: true },
  { key: "gants_cuir", label: "Gants de cuir", category: "Produits finis", subcategory: "Vêtements", state: "fini", isCraftable: true },
  { key: "livree_maison", label: "Livrée de la Maison", category: "Produits finis", subcategory: "Vêtements", state: "fini", isCraftable: true },

  // ── Cuisine
  { key: "pain", label: "Pain", category: "Nourriture", subcategory: "Rations", state: "fini", unit: "miche", isCraftable: true },
  { key: "tourte_viande", label: "Tourte à la viande", category: "Nourriture", subcategory: "Rations", state: "fini", unit: "part", isCraftable: true },
  { key: "soupe_legumes", label: "Soupe de légumes", category: "Nourriture", subcategory: "Rations", state: "fini", unit: "bol", isCraftable: true },
  { key: "hydromel", label: "Hydromel", category: "Nourriture", subcategory: "Boissons", state: "fini", unit: "chope", isCraftable: true },

  // ── Enchantement
  { key: "arme_enchantee", label: "Arme enchantée", category: "Produits finis", subcategory: "Armes", state: "fini", isCraftable: true },
  { key: "armure_enchantee", label: "Armure enchantée", category: "Produits finis", subcategory: "Armures", state: "fini", isCraftable: true },
  { key: "bijou_enchante", label: "Bijou enchanté", category: "Produits finis", subcategory: "Bijoux", state: "fini", isCraftable: true },
];

// ─────────────────────────────────────────────────────────────
//  Paliers de matériau (l'axe vertical de l'armurerie)
// ─────────────────────────────────────────────────────────────

type Palier = {
  cle: string;
  label: string;
  /** Composant principal, consommé en quantité variable selon la pièce. */
  principal: string;
  /** Composants fixes ajoutés à chaque pièce du palier. */
  fixes?: [string, number][];
  ordre: number;
};

export const PALIERS: Palier[] = [
  { cle: "fer", label: "de fer", principal: "lingot_fer", ordre: 1 },
  { cle: "acier", label: "d'acier", principal: "lingot_acier", fixes: [["lingot_fer", 1]], ordre: 2 },
  { cle: "nain", label: "nain", principal: "lingot_dwemer", fixes: [["lingot_fer", 1], ["lingot_acier", 1]], ordre: 3 },
  { cle: "elfique", label: "elfique", principal: "pierre_lune_raffinee", fixes: [["lingot_fer", 1]], ordre: 4 },
  { cle: "ecailleuse", label: "écailleux", principal: "lingot_corindon", fixes: [["cuir", 2]], ordre: 5 },
  { cle: "orque", label: "orque", principal: "lingot_orichalque", fixes: [["lingot_fer", 1]], ordre: 6 },
  { cle: "verre", label: "en verre", principal: "malachite_raffinee", fixes: [["pierre_lune_raffinee", 2]], ordre: 7 },
  { cle: "ebonite", label: "en ébonite", principal: "lingot_ebonite", ordre: 8 },
  { cle: "daedrique", label: "daedrique", principal: "lingot_ebonite", fixes: [["coeur_daedra", 1]], ordre: 9 },
  { cle: "os_dragon", label: "en os de dragon", principal: "os_dragon", fixes: [["ecaille_dragon", 2]], ordre: 10 },
  { cle: "ecaille_dragon", label: "en écailles de dragon", principal: "ecaille_dragon", fixes: [["lingot_fer", 2]], ordre: 11 },
];

// ─────────────────────────────────────────────────────────────
//  Gabarits de pièce (l'axe horizontal)
// ─────────────────────────────────────────────────────────────

type Gabarit = {
  cle: string;
  /** Libellé au masculin / féminin selon la pièce. */
  label: string;
  genre: "m" | "f";
  principal: number;
  lanieres: number;
  categorie: "Armures" | "Armes";
  /** Bois nécessaire (arcs et flèches). */
  bois?: number;
  produit?: number;
};

export const GABARITS: Gabarit[] = [
  // Armures
  { cle: "cuirasse", label: "Cuirasse", genre: "f", principal: 4, lanieres: 3, categorie: "Armures" },
  { cle: "casque", label: "Casque", genre: "m", principal: 2, lanieres: 2, categorie: "Armures" },
  { cle: "gantelets", label: "Gantelets", genre: "m", principal: 2, lanieres: 2, categorie: "Armures" },
  { cle: "bottes", label: "Bottes", genre: "f", principal: 3, lanieres: 2, categorie: "Armures" },
  { cle: "bouclier", label: "Bouclier", genre: "m", principal: 3, lanieres: 1, categorie: "Armures" },

  // Armes à une main
  { cle: "dague", label: "Dague", genre: "f", principal: 1, lanieres: 1, categorie: "Armes" },
  { cle: "epee", label: "Épée", genre: "f", principal: 1, lanieres: 1, categorie: "Armes" },
  { cle: "hache", label: "Hache de guerre", genre: "f", principal: 1, lanieres: 1, categorie: "Armes" },
  { cle: "masse", label: "Masse", genre: "f", principal: 1, lanieres: 1, categorie: "Armes" },

  // Armes à deux mains
  { cle: "epee_longue", label: "Épée à deux mains", genre: "f", principal: 3, lanieres: 2, categorie: "Armes" },
  { cle: "hache_armes", label: "Hache d'armes", genre: "f", principal: 3, lanieres: 2, categorie: "Armes" },
  { cle: "marteau", label: "Marteau de guerre", genre: "m", principal: 3, lanieres: 2, categorie: "Armes" },

  // Tir
  { cle: "arc", label: "Arc", genre: "m", principal: 1, lanieres: 1, categorie: "Armes", bois: 1 },
  { cle: "fleches", label: "Flèches", genre: "f", principal: 1, lanieres: 0, categorie: "Armes", bois: 1, produit: 24 },
];

/** Le nom complet d'une pièce : « Cuirasse d'acier », « Marteau de guerre nain ». */
export function nomPiece(gabarit: Gabarit, palier: Palier): string {
  return `${gabarit.label} ${palier.label}`;
}

// ─────────────────────────────────────────────────────────────
//  Recettes hors armurerie
// ─────────────────────────────────────────────────────────────

export type RecetteLibre = {
  label: string;
  metierKey: string;
  output: string;
  outputQty?: number;
  station?: string;
  isChain?: boolean;
  notes?: string;
  items: [string, number][];
};

const CALER = "Quantités à confirmer avec le maître du métier — recette modifiable depuis l'atelier.";

export const RECETTES_LIBRES: RecetteLibre[] = [
  // ── Tannage (Chasseur) : chaque peau donne du cuir
  { label: "Tannage : cuir de cerf", metierKey: "chasseur", output: "cuir", outputQty: 2, station: "Chevalet de tannage", isChain: true, items: [["peau_cerf", 1]] },
  { label: "Tannage : cuir de loup", metierKey: "chasseur", output: "cuir", outputQty: 2, station: "Chevalet de tannage", isChain: true, items: [["peau_loup", 1]] },
  { label: "Tannage : cuir d'ours", metierKey: "chasseur", output: "cuir", outputQty: 3, station: "Chevalet de tannage", isChain: true, items: [["peau_ours", 1]] },
  { label: "Tannage : cuir de sabre", metierKey: "chasseur", output: "cuir", outputQty: 3, station: "Chevalet de tannage", isChain: true, items: [["peau_sabre", 1]] },
  { label: "Tannage : fourrure d'ours", metierKey: "chasseur", output: "fourrure", outputQty: 1, station: "Chevalet de tannage", isChain: true, items: [["peau_ours", 1]] },

  // ── Armures de cuir et de peaux (Forgeron, chevalet)
  { label: "Cuirasse de peaux", metierKey: "forgeron", output: "armure_peaux", station: "Chevalet de tannage", items: [["cuir", 2], ["laniere_cuir", 2]] },
  { label: "Cuirasse de cuir", metierKey: "forgeron", output: "armure_cuir", station: "Chevalet de tannage", items: [["cuir", 3], ["laniere_cuir", 4]] },
  { label: "Cuirasse de fourrure", metierKey: "forgeron", output: "armure_fourrure", station: "Chevalet de tannage", items: [["fourrure", 2], ["laniere_cuir", 2]] },

  // La joaillerie est engendrée dans le seed : métal × forme × sertissage.

  // ── Couture (Couturier)
  { label: "Filage : fil d'or", metierKey: "couturier", output: "fil_or", outputQty: 2, station: "Établi de couture", isChain: true, notes: CALER, items: [["lingot_or", 1]] },
  { label: "Tenue simple", metierKey: "couturier", output: "tenue_simple", station: "Établi de couture", notes: CALER, items: [["laine", 2], ["lin", 2], ["laniere_cuir", 2]] },
  { label: "Tenue de voyage", metierKey: "couturier", output: "tenue_voyage", station: "Établi de couture", notes: CALER, items: [["laine", 3], ["cuir", 1], ["laniere_cuir", 3]] },
  { label: "Tenue noble", metierKey: "couturier", output: "tenue_noble", station: "Établi de couture", notes: CALER, items: [["soie", 3], ["fil_or", 1], ["teinture", 2]] },
  { label: "Livrée de la Maison", metierKey: "couturier", output: "livree_maison", station: "Établi de couture", notes: "Aux couleurs de Givrelune : bleu nuit, argent et or discret.", items: [["laine", 2], ["lin", 2], ["teinture", 2], ["fil_or", 1]] },
  { label: "Robe de mage", metierKey: "couturier", output: "robe_mage", station: "Établi de couture", notes: CALER, items: [["soie", 2], ["lin", 2], ["teinture", 1]] },
  { label: "Cape de fourrure", metierKey: "couturier", output: "cape_fourrure", station: "Établi de couture", notes: CALER, items: [["fourrure", 2], ["laniere_cuir", 2]] },
  { label: "Bottes de cuir souple", metierKey: "couturier", output: "bottes_cuir", station: "Établi de couture", notes: CALER, items: [["cuir", 2], ["laniere_cuir", 2]] },
  { label: "Gants de cuir", metierKey: "couturier", output: "gants_cuir", station: "Établi de couture", notes: CALER, items: [["cuir", 1], ["laniere_cuir", 2]] },

  // ── Alchimie
  { label: "Potion de soin", metierKey: "alchimiste", output: "potion_soin", station: "Table d'alchimie", notes: "Fleur de montagne + chardon : l'accord de restauration le plus courant.", items: [["fleur_montagne", 1], ["chardon", 1]] },
  { label: "Potion de soin majeure", metierKey: "alchimiste", output: "potion_soin_majeure", station: "Table d'alchimie", items: [["fleur_montagne", 2], ["ail", 1], ["chardon", 1]] },
  { label: "Potion de vigueur", metierKey: "alchimiste", output: "potion_vigueur", station: "Table d'alchimie", items: [["chardon", 1], ["racine_tourbe", 1]] },
  { label: "Potion de magie", metierKey: "alchimiste", output: "potion_magie", station: "Table d'alchimie", items: [["chrysalis", 1], ["fleur_montagne", 1]] },
  { label: "Potion d'invisibilité", metierKey: "alchimiste", output: "potion_invisibilite", station: "Table d'alchimie", items: [["chapeau_mort", 1], ["sels_vides", 1]] },
  { label: "Poison de paralysie", metierKey: "alchimiste", output: "poison_paralysie", station: "Table d'alchimie", items: [["nirnrace", 1], ["chapeau_mort", 1]] },
  { label: "Poison lent", metierKey: "alchimiste", output: "poison_lent", station: "Table d'alchimie", items: [["oreille_porc", 1], ["poudre_os", 1]] },
  { label: "Poison", metierKey: "alchimiste", output: "poison", station: "Table d'alchimie", items: [["oreille_porc", 1], ["chapeau_mort", 1]] },

  // ── Cuisine
  { label: "Pain", metierKey: "cuisinier", output: "pain", outputQty: 2, station: "Marmite", items: [["ble", 2], ["sel", 1]] },
  { label: "Ragoût de la Maison", metierKey: "cuisinier", output: "ragout", outputQty: 2, station: "Marmite", items: [["viande", 2], ["legume", 2], ["sel", 1]] },
  { label: "Tourte à la viande", metierKey: "cuisinier", output: "tourte_viande", outputQty: 2, station: "Marmite", items: [["viande", 2], ["ble", 1], ["sel", 1]] },
  { label: "Soupe de légumes", metierKey: "cuisinier", output: "soupe_legumes", outputQty: 3, station: "Marmite", items: [["legume", 3], ["sel", 1]] },
  { label: "Ration de campagne", metierKey: "cuisinier", output: "ration", outputQty: 4, station: "Marmite", items: [["viande", 1], ["ble", 1], ["legume", 1], ["sel", 1]] },
  { label: "Hydromel", metierKey: "cuisinier", output: "hydromel", outputQty: 4, station: "Marmite", notes: CALER, items: [["ble", 2], ["fleur_montagne", 1]] },

  // ── Enchantement
  { label: "Enchanter une arme (âme commune)", metierKey: "enchanteur", output: "arme_enchantee", station: "Table d'enchantement", notes: "Consomme la pierre d'âme et l'arme de base. Remplacez l'épée d'acier par l'arme réellement enchantée.", items: [["ame_commune", 1], ["epee_acier", 1]] },
  { label: "Enchanter une armure (âme commune)", metierKey: "enchanteur", output: "armure_enchantee", station: "Table d'enchantement", notes: "Consomme la pierre d'âme et la pièce d'armure de base.", items: [["ame_commune", 1], ["cuirasse_acier", 1]] },
  { label: "Enchanter un bijou (grande âme)", metierKey: "enchanteur", output: "bijou_enchante", station: "Table d'enchantement", items: [["ame_grande", 1], ["bague_or", 1]] },

  // ── Bois (Bûcheron)
  { label: "Sciage : bois scié", metierKey: "bucheron", output: "bois_scie", outputQty: 3, station: "Billot", isChain: true, notes: CALER, items: [["buche", 1]] },
  { label: "Charbonnage : charbon", metierKey: "bucheron", output: "charbon", outputQty: 2, station: "Meule de charbonnier", isChain: true, notes: CALER, items: [["buche", 2]] },
];

/** Armures de cuir / peaux / fourrure : matières produites hors paliers métalliques. */
export const MATIERES_CUIR: MatiereCraft[] = [
  { key: "armure_peaux", label: "Cuirasse de peaux", category: "Produits finis", subcategory: "Armures", state: "fini", isCraftable: true },
  { key: "armure_cuir", label: "Cuirasse de cuir", category: "Produits finis", subcategory: "Armures", state: "fini", isCraftable: true },
  { key: "armure_fourrure", label: "Cuirasse de fourrure", category: "Produits finis", subcategory: "Armures", state: "fini", isCraftable: true },
];
