/**
 * Le reste de l'arbre de fabrication : tannage, joaillerie, alchimie,
 * cuisine, couture, enchantement et bois.
 *
 * La forge est engendrée par paliers (voir seed-craft.ts) ; ces métiers-là
 * demandent des recettes nommées. Les noms d'ingrédients et de produits
 * suivent Skyrim ; les quantités et les associations d'effets sont celles
 * de l'alchimie vanilla lorsqu'elles sont sûres, et un point de départ
 * raisonnable sinon — chaque recette reste modifiable depuis son atelier.
 */

type Matiere = {
  key: string;
  label: string;
  category: string;
  subcategory?: string;
  state?: string;
  unit?: string;
  isCraftable?: boolean;
};

type Recette = {
  label: string;
  metierKey: string;
  output: string;
  outputQty?: number;
  station?: string;
  isChain?: boolean;
  notes?: string;
  items: [string, number][];
};

const AJUSTER = "Associations d'effets à ajuster selon l'équilibrage de Keizaal.";

/* ══════════════════════════════════════════════════════════════
   TANNAGE — toutes les peaux de Bordeciel
   ══════════════════════════════════════════════════════════════ */

/** [clé, libellé, cuir obtenu, fourrure obtenue] */
const PEAUX: [string, string, number, number][] = [
  ["peau_chevre", "Peau de chèvre", 2, 0],
  ["peau_renard", "Peau de renard", 1, 1],
  ["peau_renard_neiges", "Peau de renard des neiges", 1, 1],
  ["peau_sabre_neiges", "Peau de sabre des neiges", 3, 2],
  ["peau_ours_cavernes", "Peau d'ours des cavernes", 3, 2],
  ["peau_ours_neiges", "Peau d'ours des neiges", 4, 2],
  ["peau_vache", "Peau de vache", 2, 0],
  ["peau_cheval", "Peau de cheval", 3, 0],
  ["peau_horker", "Peau de horker", 3, 1],
  ["peau_mammouth", "Peau de mammouth", 5, 3],
  ["peau_daim", "Peau de daim", 2, 0],
  ["peau_elan", "Peau d'élan", 2, 0],
];

/* ══════════════════════════════════════════════════════════════
   JOAILLERIE — métal × forme × sertissage
   ══════════════════════════════════════════════════════════════ */

export const METAUX_BIJOUX: { cle: string; label: string; lingot: string }[] = [
  { cle: "argent", label: "d'argent", lingot: "lingot_argent" },
  { cle: "or", label: "d'or", lingot: "lingot_or" },
];

export const FORMES_BIJOUX: {
  cle: string;
  label: string;
  genre: "m" | "f";
  lingots: number;
}[] = [
  { cle: "bague", label: "Bague", genre: "f", lingots: 1 },
  { cle: "collier", label: "Collier", genre: "m", lingots: 1 },
  { cle: "diademe", label: "Diadème", genre: "m", lingots: 2 },
  { cle: "bracelet", label: "Bracelet", genre: "m", lingots: 1 },
];

/** La première entrée est la pièce nue, sans pierre. */
export const GEMMES_BIJOUX: { cle: string; label: string; materiau: string }[] = [
  { cle: "", label: "", materiau: "" },
  { cle: "grenat", label: "de grenat", materiau: "gemme_grenat" },
  { cle: "amethyste", label: "d'améthyste", materiau: "gemme_amethyste" },
  { cle: "emeraude", label: "d'émeraude", materiau: "gemme_emeraude" },
  { cle: "rubis", label: "de rubis", materiau: "gemme_rubis" },
  { cle: "saphir", label: "de saphir", materiau: "gemme_saphir" },
  { cle: "diamant", label: "de diamant", materiau: "gemme_diamant" },
];

/** « Bague d'or sertie de rubis », « Collier d'argent serti de saphir ». */
export function nomBijou(
  forme: (typeof FORMES_BIJOUX)[number],
  metal: (typeof METAUX_BIJOUX)[number],
  gemme: (typeof GEMMES_BIJOUX)[number],
): string {
  const base = `${forme.label} ${metal.label}`;
  if (!gemme.cle) return base;
  return `${base} ${forme.genre === "f" ? "sertie" : "serti"} ${gemme.label}`;
}

/* ══════════════════════════════════════════════════════════════
   ENCHANTEMENT — effet × support
   ══════════════════════════════════════════════════════════════ */

export const ENCHANTEMENTS_ARME: { cle: string; label: string }[] = [
  { cle: "feu", label: "Dégâts de feu" },
  { cle: "froid", label: "Dégâts de froid" },
  { cle: "foudre", label: "Dégâts de foudre" },
  { cle: "absorption_sante", label: "Absorption de santé" },
  { cle: "absorption_magie", label: "Absorption de magie" },
  { cle: "absorption_vigueur", label: "Absorption de vigueur" },
  { cle: "piege_ame", label: "Piégeage d'âme" },
  { cle: "paralysie", label: "Paralysie" },
  { cle: "peur", label: "Terreur" },
  { cle: "bannissement", label: "Bannissement" },
];

export const ENCHANTEMENTS_ARMURE: { cle: string; label: string }[] = [
  { cle: "resist_feu", label: "Résistance au feu" },
  { cle: "resist_froid", label: "Résistance au froid" },
  { cle: "resist_foudre", label: "Résistance à la foudre" },
  { cle: "resist_magie", label: "Résistance à la magie" },
  { cle: "sante", label: "Fortification de santé" },
  { cle: "vigueur", label: "Fortification de vigueur" },
  { cle: "magie", label: "Fortification de magie" },
  { cle: "discretion", label: "Discrétion" },
  { cle: "portage", label: "Fortification du portage" },
  { cle: "respiration", label: "Respiration aquatique" },
];

export const ENCHANTEMENTS_BIJOU: { cle: string; label: string }[] = [
  { cle: "forge", label: "Fortification de forge" },
  { cle: "alchimie", label: "Fortification d'alchimie" },
  { cle: "marchandage", label: "Fortification de marchandage" },
  { cle: "une_main", label: "Fortification à une main" },
  { cle: "deux_mains", label: "Fortification à deux mains" },
  { cle: "archerie", label: "Fortification d'archerie" },
  { cle: "destruction", label: "Fortification de destruction" },
  { cle: "restauration", label: "Fortification de restauration" },
];

/* ══════════════════════════════════════════════════════════════
   MATIÈRES
   ══════════════════════════════════════════════════════════════ */

const ING = (key: string, label: string, sous = "Plantes"): Matiere => ({
  key,
  label,
  category: "Alchimie",
  subcategory: sous,
});

export const MATIERES_METIERS: Matiere[] = [
  // ── Peaux
  ...PEAUX.map(([key, label]) => ({
    key,
    label,
    category: "Peaux & Cuir",
    subcategory: "Peaux",
  })),

  // ── Ingrédients d'alchimie (plantes)
  ING("fleur_montagne_bleue", "Fleur de montagne bleue"),
  ING("fleur_montagne_rouge", "Fleur de montagne rouge"),
  ING("fleur_montagne_violette", "Fleur de montagne violette"),
  ING("clochette_mort", "Clochette de mort"),
  ING("belladone", "Belladone"),
  ING("grappe_rampante", "Grappe rampante"),
  ING("raisin_jazbay", "Raisin de Jazbay"),
  ING("baie_genievre", "Baie de genièvre"),
  ING("baie_neige", "Baie de neige"),
  ING("langue_dragon", "Langue de dragon"),
  ING("racine_canis", "Racine de canis"),
  ING("oreille_elfe", "Oreille d'elfe"),
  ING("mirriam_givre", "Mirriam de givre"),
  ING("ortie", "Ortie"),
  ING("tourbe_marais", "Tourbe de marais"),

  // ── Ingrédients d'alchimie (champignons)
  ING("pustulente", "Pustulente", "Champignons"),
  ING("amanite_mouche", "Amanite tue-mouche", "Champignons"),
  ING("couronne_sanglante", "Couronne sanglante", "Champignons"),
  ING("chapeau_blanc", "Chapeau blanc", "Champignons"),
  ING("tabouret_lutin", "Tabouret de lutin", "Champignons"),
  ING("pholiote_ecailleuse", "Pholiote écailleuse", "Champignons"),
  ING("mora_tapinella", "Mora tapinella", "Champignons"),
  ING("gousse_marais", "Gousse fongique des marais", "Champignons"),

  // ── Ingrédients d'alchimie (animaux & rares)
  ING("plume_faucon", "Plume de faucon", "Ingrédients rares"),
  ING("griffe_ours", "Griffes d'ours", "Ingrédients rares"),
  ING("orteil_geant", "Orteil de géant", "Ingrédients rares"),
  ING("oeuf_chaurus", "Œuf de chaurus", "Ingrédients rares"),
  ING("thorax_luciole", "Thorax de luciole", "Ingrédients rares"),
  ING("aile_phalene", "Aile de phalène lunaire", "Ingrédients rares"),
  ING("ectoplasme", "Ectoplasme", "Ingrédients rares"),
  ING("poussiere_vampire", "Poussière de vampire", "Ingrédients rares"),
  ING("sels_feu", "Sels de feu", "Ingrédients rares"),
  ING("sels_givre", "Sels de givre", "Ingrédients rares"),
  ING("peau_skeever", "Peau de skeever calcinée", "Ingrédients rares"),
  ING("glande_venin", "Glande à venin", "Ingrédients rares"),

  // ── Potions & poisons
  ...[
    ["potion_soin_mineure", "Potion de soin mineure"],
    ["potion_soin_abondante", "Potion de soin abondante"],
    ["potion_soin_supreme", "Potion de soin suprême"],
    ["potion_magie_mineure", "Potion de magie mineure"],
    ["potion_magie_abondante", "Potion de magie abondante"],
    ["potion_vigueur_abondante", "Potion de vigueur abondante"],
    ["potion_regen_sante", "Philtre de régénération"],
    ["potion_resist_feu", "Potion de résistance au feu"],
    ["potion_resist_froid", "Potion de résistance au froid"],
    ["potion_resist_foudre", "Potion de résistance à la foudre"],
    ["potion_resist_magie", "Potion de résistance à la magie"],
    ["potion_respiration", "Potion de respiration aquatique"],
    ["potion_soigne_maladie", "Potion de guérison"],
    ["potion_force", "Élixir de force"],
    ["potion_forge", "Élixir de forge"],
    ["potion_marchandage", "Élixir de marchandage"],
    ["potion_discretion", "Élixir de discrétion"],
    ["potion_portage", "Élixir de portage"],
  ].map(([key, label]) => ({
    key,
    label,
    category: "Alchimie",
    subcategory: "Potions",
    state: "fini",
    unit: "fiole",
    isCraftable: true,
  })),
  ...[
    ["poison_degats_sante", "Poison de dégâts de santé"],
    ["poison_lent_persistant", "Poison persistant"],
    ["poison_frenesie", "Poison de frénésie"],
    ["poison_terreur", "Poison de terreur"],
    ["poison_faiblesse_feu", "Poison de faiblesse au feu"],
    ["poison_faiblesse_froid", "Poison de faiblesse au froid"],
    ["poison_ravage_vigueur", "Poison de ravage de vigueur"],
    ["poison_silence", "Poison de silence"],
  ].map(([key, label]) => ({
    key,
    label,
    category: "Alchimie",
    subcategory: "Poisons",
    state: "fini",
    unit: "fiole",
    isCraftable: true,
  })),

  // ── Ingrédients de cuisine
  { key: "pomme", label: "Pomme", category: "Nourriture", subcategory: "Légumes" },
  { key: "chou", label: "Chou", category: "Nourriture", subcategory: "Légumes" },
  { key: "pomme_terre", label: "Pomme de terre", category: "Nourriture", subcategory: "Légumes" },
  { key: "poireau", label: "Poireau", category: "Nourriture", subcategory: "Légumes" },
  { key: "carotte", label: "Carotte", category: "Nourriture", subcategory: "Légumes" },
  { key: "tomate", label: "Tomate", category: "Nourriture", subcategory: "Légumes" },
  { key: "farine", label: "Farine", category: "Nourriture", subcategory: "Légumes", state: "transforme", isCraftable: true },
  { key: "beurre", label: "Beurre", category: "Nourriture", subcategory: "Boissons" },
  { key: "lait", label: "Lait", category: "Nourriture", subcategory: "Boissons", unit: "pichet" },
  { key: "fromage", label: "Fromage", category: "Nourriture", subcategory: "Rations" },
  { key: "oeuf", label: "Œuf", category: "Nourriture", subcategory: "Rations" },
  { key: "miel", label: "Miel", category: "Nourriture", subcategory: "Boissons", unit: "pot" },
  { key: "viande_cerf", label: "Venaison", category: "Nourriture", subcategory: "Viandes" },
  { key: "viande_boeuf", label: "Bœuf", category: "Nourriture", subcategory: "Viandes" },
  { key: "poulet", label: "Blanc de poulet", category: "Nourriture", subcategory: "Viandes" },
  { key: "saumon", label: "Saumon", category: "Nourriture", subcategory: "Poissons" },
  { key: "viande_horker", label: "Viande de horker", category: "Nourriture", subcategory: "Viandes" },
  { key: "palourde", label: "Chair de palourde", category: "Nourriture", subcategory: "Poissons" },

  // ── Plats
  ...[
    ["tarte_pommes", "Tarte aux pommes", "part"],
    ["ragout_boeuf", "Ragoût de bœuf", "bol"],
    ["soupe_chou_pdt", "Soupe de chou et pommes de terre", "bol"],
    ["soupe_chou", "Soupe au chou", "bol"],
    ["chaudree_palourdes", "Chaudrée de palourdes", "bol"],
    ["boeuf_grille", "Bœuf grillé", "portion"],
    ["fondue_lenclume", "Fondue d'Elsweyr", "portion"],
    ["poulet_grille", "Poulet grillé", "portion"],
    ["poireaux_grilles", "Poireaux grillés", "portion"],
    ["pain_horker", "Pain de horker", "part"],
    ["ragout_horker", "Ragoût de horker", "bol"],
    ["steak_saumon", "Steak de saumon", "portion"],
    ["soupe_legumes_riche", "Potage de légumes", "bol"],
    ["cotelette_venaison", "Côtelette de venaison", "portion"],
    ["ragout_venaison", "Ragoût de venaison", "bol"],
    ["pain_tresse", "Pain tressé", "miche"],
    ["brioche", "Brioche sucrée", "part"],
    ["chausson_pomme", "Chausson aux pommes", "part"],
    ["pain_ail", "Pain à l'ail", "part"],
    ["tourte_jazbay", "Tourte aux raisins de Jazbay", "part"],
    ["tourte_genievre", "Tourte aux baies de genièvre", "part"],
    ["tourte_neige", "Tourte aux baies de neige", "part"],
    ["creme_bouillie", "Crème bouillie", "part"],
  ].map(([key, label, unit]) => ({
    key,
    label,
    category: "Nourriture",
    subcategory: "Rations",
    state: "fini",
    unit,
    isCraftable: true,
  })),
  ...[
    ["biere", "Bière"],
    ["vin", "Vin"],
    ["hydromel_genievre", "Hydromel aux baies de genièvre"],
  ].map(([key, label]) => ({
    key,
    label,
    category: "Nourriture",
    subcategory: "Boissons",
    state: "fini",
    unit: "chope",
    isCraftable: true,
  })),

  // ── Tissus supplémentaires
  { key: "fil_argent", label: "Fil d'argent", category: "Tissus", subcategory: "Fil d'argent", state: "transforme", unit: "bobine", isCraftable: true },
  { key: "toile_lin", label: "Toile de lin", category: "Tissus", subcategory: "Lin", state: "transforme", isCraftable: true },
  { key: "drap_laine", label: "Drap de laine", category: "Tissus", subcategory: "Laine", state: "transforme", isCraftable: true },
  { key: "velours", label: "Velours", category: "Tissus", subcategory: "Soie", state: "transforme", isCraftable: true },

  // ── Vêtements
  ...[
    ["tunique_simple", "Tunique simple"],
    ["chemise_lin", "Chemise de lin"],
    ["pantalon_laine", "Pantalon de laine"],
    ["robe_bure", "Robe de bure"],
    ["robe_ceremonie", "Robe de cérémonie"],
    ["robe_cour", "Robe de cour"],
    ["manteau_hiver", "Manteau d'hiver"],
    ["cape_voyage", "Cape de voyage"],
    ["capuche_cuir", "Capuche de cuir"],
    ["chapeau_feutre", "Chapeau de feutre"],
    ["ceinture_cuir", "Ceinture de cuir"],
    ["bourse_cuir", "Bourse de cuir"],
    ["sac_dos", "Sac de voyage"],
    ["echarpe_laine", "Écharpe de laine"],
    ["mitaines_laine", "Mitaines de laine"],
    ["bottes_fourrees", "Bottes fourrées"],
    ["tablier_artisan", "Tablier d'artisan"],
    ["livree_garde", "Livrée de la Garde"],
    ["livree_marchande", "Livrée marchande"],
    ["tenue_bal", "Tenue de bal"],
  ].map(([key, label]) => ({
    key,
    label,
    category: "Produits finis",
    subcategory: "Vêtements",
    state: "fini",
    isCraftable: true,
  })),

  // ── Bois
  { key: "planche", label: "Planche", category: "Bois", subcategory: "Bois scié", state: "transforme", isCraftable: true },
  { key: "poutre", label: "Poutre", category: "Bois", subcategory: "Bois scié", state: "transforme", isCraftable: true },
  { key: "manche_bois", label: "Manche de bois", category: "Bois", subcategory: "Bois scié", state: "transforme", isCraftable: true },
  { key: "ecorce", label: "Écorce", category: "Bois", subcategory: "Bûches" },
];

/* ══════════════════════════════════════════════════════════════
   RECETTES
   ══════════════════════════════════════════════════════════════ */

export const RECETTES_METIERS: Recette[] = [
  // ── Tannage
  ...PEAUX.flatMap(([key, label, cuir, fourrure]): Recette[] => {
    const r: Recette[] = [
      {
        label: `Tannage : ${label.toLowerCase()}`,
        metierKey: "chasseur",
        output: "cuir",
        outputQty: cuir,
        station: "Chevalet de tannage",
        isChain: true,
        items: [[key, 1]],
      },
    ];
    if (fourrure > 0) {
      r.push({
        label: `Apprêt : fourrure depuis ${label.toLowerCase()}`,
        metierKey: "chasseur",
        output: "fourrure",
        outputQty: fourrure,
        station: "Chevalet de tannage",
        isChain: true,
        items: [[key, 1]],
      });
    }
    return r;
  }),

  // ── Bois
  { label: "Débit : planches", metierKey: "bucheron", output: "planche", outputQty: 4, station: "Billot", isChain: true, items: [["buche", 1]] },
  { label: "Débit : poutre", metierKey: "bucheron", output: "poutre", station: "Billot", isChain: true, items: [["buche", 2]] },
  { label: "Tournage : manches de bois", metierKey: "bucheron", output: "manche_bois", outputQty: 6, station: "Billot", isChain: true, items: [["bois_scie", 1]] },
  { label: "Écorçage", metierKey: "bucheron", output: "ecorce", outputQty: 3, station: "Billot", isChain: true, items: [["buche", 1]] },
  { label: "Briquettes de sciure", metierKey: "bucheron", output: "briquette", outputQty: 4, station: "Meule de charbonnier", isChain: true, items: [["bois_scie", 2]] },
  { label: "Coke de bois", metierKey: "bucheron", output: "coke", outputQty: 2, station: "Meule de charbonnier", isChain: true, items: [["charbon", 2]] },

  // ── Alchimie : soins et restaurations
  { label: "Potion de soin mineure", metierKey: "alchimiste", output: "potion_soin_mineure", station: "Table d'alchimie", notes: AJUSTER, items: [["fleur_montagne_bleue", 1], ["ble", 1]] },
  { label: "Potion de soin abondante", metierKey: "alchimiste", output: "potion_soin_abondante", station: "Table d'alchimie", notes: AJUSTER, items: [["fleur_montagne_bleue", 1], ["pustulente", 1], ["ble", 1]] },
  { label: "Potion de soin suprême", metierKey: "alchimiste", output: "potion_soin_supreme", station: "Table d'alchimie", notes: AJUSTER, items: [["fleur_montagne_bleue", 2], ["pustulente", 1], ["orteil_geant", 1]] },
  { label: "Potion de magie mineure", metierKey: "alchimiste", output: "potion_magie_mineure", station: "Table d'alchimie", notes: AJUSTER, items: [["fleur_montagne_rouge", 1], ["grappe_rampante", 1]] },
  { label: "Potion de magie abondante", metierKey: "alchimiste", output: "potion_magie_abondante", station: "Table d'alchimie", notes: AJUSTER, items: [["fleur_montagne_rouge", 1], ["raisin_jazbay", 1], ["oreille_elfe", 1]] },
  { label: "Potion de vigueur abondante", metierKey: "alchimiste", output: "potion_vigueur_abondante", station: "Table d'alchimie", notes: AJUSTER, items: [["peau_skeever", 1], ["fromage", 1]] },
  { label: "Philtre de régénération", metierKey: "alchimiste", output: "potion_regen_sante", station: "Table d'alchimie", notes: AJUSTER, items: [["fleur_montagne_bleue", 1], ["chapeau_blanc", 1], ["baie_neige", 1]] },

  // ── Alchimie : résistances et utilitaires
  { label: "Potion de résistance au feu", metierKey: "alchimiste", output: "potion_resist_feu", station: "Table d'alchimie", notes: AJUSTER, items: [["langue_dragon", 1], ["sels_givre", 1]] },
  { label: "Potion de résistance au froid", metierKey: "alchimiste", output: "potion_resist_froid", station: "Table d'alchimie", notes: AJUSTER, items: [["baie_neige", 1], ["sels_feu", 1]] },
  { label: "Potion de résistance à la foudre", metierKey: "alchimiste", output: "potion_resist_foudre", station: "Table d'alchimie", notes: AJUSTER, items: [["baie_genievre", 1], ["pholiote_ecailleuse", 1]] },
  { label: "Potion de résistance à la magie", metierKey: "alchimiste", output: "potion_resist_magie", station: "Table d'alchimie", notes: AJUSTER, items: [["fleur_montagne_violette", 1], ["thorax_luciole", 1]] },
  { label: "Potion de respiration aquatique", metierKey: "alchimiste", output: "potion_respiration", station: "Table d'alchimie", notes: AJUSTER, items: [["oeuf_chaurus", 1], ["ortie", 1]] },
  { label: "Potion de guérison", metierKey: "alchimiste", output: "potion_soigne_maladie", station: "Table d'alchimie", notes: AJUSTER, items: [["chapeau_blanc", 1], ["poussiere_vampire", 1]] },
  { label: "Potion d'invisibilité", metierKey: "alchimiste", output: "potion_invisibilite", station: "Table d'alchimie", notes: AJUSTER, items: [["mora_tapinella", 1], ["sels_vides", 1]] },

  // ── Alchimie : élixirs de fortification
  { label: "Élixir de force", metierKey: "alchimiste", output: "potion_force", station: "Table d'alchimie", notes: AJUSTER, items: [["griffe_ours", 1], ["ail", 1]] },
  { label: "Élixir de forge", metierKey: "alchimiste", output: "potion_forge", station: "Table d'alchimie", notes: AJUSTER, items: [["griffe_ours", 1], ["gousse_marais", 1]] },
  { label: "Élixir de marchandage", metierKey: "alchimiste", output: "potion_marchandage", station: "Table d'alchimie", notes: AJUSTER, items: [["aile_phalene", 1], ["tourbe_marais", 1]] },
  { label: "Élixir de discrétion", metierKey: "alchimiste", output: "potion_discretion", station: "Table d'alchimie", notes: AJUSTER, items: [["racine_canis", 1], ["amanite_mouche", 1]] },
  { label: "Élixir de portage", metierKey: "alchimiste", output: "potion_portage", station: "Table d'alchimie", notes: AJUSTER, items: [["orteil_geant", 1], ["plume_faucon", 1]] },

  // ── Alchimie : poisons
  { label: "Poison de dégâts de santé", metierKey: "alchimiste", output: "poison_degats_sante", station: "Table d'alchimie", notes: AJUSTER, items: [["clochette_mort", 1], ["glande_venin", 1]] },
  { label: "Poison persistant", metierKey: "alchimiste", output: "poison_lent_persistant", station: "Table d'alchimie", notes: AJUSTER, items: [["couronne_sanglante", 1], ["belladone", 1]] },
  { label: "Poison de frénésie", metierKey: "alchimiste", output: "poison_frenesie", station: "Table d'alchimie", notes: AJUSTER, items: [["tabouret_lutin", 1], ["ectoplasme", 1]] },
  { label: "Poison de terreur", metierKey: "alchimiste", output: "poison_terreur", station: "Table d'alchimie", notes: AJUSTER, items: [["poussiere_vampire", 1], ["mora_tapinella", 1]] },
  { label: "Poison de faiblesse au feu", metierKey: "alchimiste", output: "poison_faiblesse_feu", station: "Table d'alchimie", notes: AJUSTER, items: [["sels_givre", 1], ["mirriam_givre", 1]] },
  { label: "Poison de faiblesse au froid", metierKey: "alchimiste", output: "poison_faiblesse_froid", station: "Table d'alchimie", notes: AJUSTER, items: [["sels_feu", 1], ["langue_dragon", 1]] },
  { label: "Poison de ravage de vigueur", metierKey: "alchimiste", output: "poison_ravage_vigueur", station: "Table d'alchimie", notes: AJUSTER, items: [["pholiote_ecailleuse", 1], ["oeuf_chaurus", 1]] },
  { label: "Poison de silence", metierKey: "alchimiste", output: "poison_silence", station: "Table d'alchimie", notes: AJUSTER, items: [["belladone", 1], ["amanite_mouche", 1]] },

  // ── Cuisine : préparations de base
  { label: "Mouture : farine", metierKey: "cuisinier", output: "farine", outputQty: 3, station: "Marmite", isChain: true, items: [["ble", 2]] },
  { label: "Pain tressé", metierKey: "cuisinier", output: "pain_tresse", outputQty: 2, station: "Marmite", items: [["farine", 2], ["oeuf", 1], ["sel", 1]] },
  { label: "Pain à l'ail", metierKey: "cuisinier", output: "pain_ail", outputQty: 2, station: "Marmite", items: [["pain", 1], ["ail", 1], ["beurre", 1]] },

  // ── Cuisine : soupes et ragoûts
  { label: "Ragoût de bœuf", metierKey: "cuisinier", output: "ragout_boeuf", outputQty: 2, station: "Marmite", items: [["viande_boeuf", 1], ["pomme_terre", 1], ["carotte", 1], ["sel", 1]] },
  { label: "Ragoût de venaison", metierKey: "cuisinier", output: "ragout_venaison", outputQty: 2, station: "Marmite", items: [["viande_cerf", 1], ["pomme_terre", 1], ["poireau", 1], ["sel", 1]] },
  { label: "Ragoût de horker", metierKey: "cuisinier", output: "ragout_horker", outputQty: 2, station: "Marmite", items: [["viande_horker", 1], ["pomme_terre", 1], ["carotte", 1], ["sel", 1]] },
  { label: "Soupe au chou", metierKey: "cuisinier", output: "soupe_chou", outputQty: 2, station: "Marmite", items: [["chou", 2], ["sel", 1]] },
  { label: "Soupe de chou et pommes de terre", metierKey: "cuisinier", output: "soupe_chou_pdt", outputQty: 2, station: "Marmite", items: [["chou", 1], ["pomme_terre", 2], ["sel", 1]] },
  { label: "Potage de légumes", metierKey: "cuisinier", output: "soupe_legumes_riche", outputQty: 3, station: "Marmite", items: [["chou", 1], ["poireau", 1], ["carotte", 1], ["tomate", 1], ["sel", 1]] },
  { label: "Chaudrée de palourdes", metierKey: "cuisinier", output: "chaudree_palourdes", outputQty: 2, station: "Marmite", items: [["palourde", 2], ["lait", 1], ["beurre", 1]] },

  // ── Cuisine : grillades
  { label: "Bœuf grillé", metierKey: "cuisinier", output: "boeuf_grille", station: "Marmite", items: [["viande_boeuf", 1], ["sel", 1]] },
  { label: "Poulet grillé", metierKey: "cuisinier", output: "poulet_grille", station: "Marmite", items: [["poulet", 1], ["sel", 1]] },
  { label: "Poireaux grillés", metierKey: "cuisinier", output: "poireaux_grilles", outputQty: 2, station: "Marmite", items: [["poireau", 2], ["beurre", 1]] },
  { label: "Steak de saumon", metierKey: "cuisinier", output: "steak_saumon", station: "Marmite", items: [["saumon", 1], ["sel", 1]] },
  { label: "Côtelette de venaison", metierKey: "cuisinier", output: "cotelette_venaison", station: "Marmite", items: [["viande_cerf", 1], ["sel", 1]] },
  { label: "Pain de horker", metierKey: "cuisinier", output: "pain_horker", outputQty: 2, station: "Marmite", items: [["viande_horker", 2], ["farine", 1], ["sel", 1]] },
  { label: "Fondue d'Elsweyr", metierKey: "cuisinier", output: "fondue_lenclume", outputQty: 2, station: "Marmite", items: [["fromage", 2], ["ail", 1], ["lait", 1]] },

  // ── Cuisine : pâtisseries
  { label: "Tarte aux pommes", metierKey: "cuisinier", output: "tarte_pommes", outputQty: 2, station: "Marmite", items: [["pomme", 2], ["farine", 1], ["beurre", 1]] },
  { label: "Chausson aux pommes", metierKey: "cuisinier", output: "chausson_pomme", outputQty: 2, station: "Marmite", items: [["pomme", 1], ["farine", 1], ["beurre", 1]] },
  { label: "Brioche sucrée", metierKey: "cuisinier", output: "brioche", outputQty: 2, station: "Marmite", items: [["farine", 1], ["miel", 1], ["beurre", 1], ["oeuf", 1]] },
  { label: "Crème bouillie", metierKey: "cuisinier", output: "creme_bouillie", outputQty: 2, station: "Marmite", items: [["lait", 1], ["oeuf", 2], ["miel", 1]] },
  { label: "Tourte aux raisins de Jazbay", metierKey: "cuisinier", output: "tourte_jazbay", outputQty: 2, station: "Marmite", items: [["raisin_jazbay", 2], ["farine", 1], ["beurre", 1]] },
  { label: "Tourte aux baies de genièvre", metierKey: "cuisinier", output: "tourte_genievre", outputQty: 2, station: "Marmite", items: [["baie_genievre", 2], ["farine", 1], ["beurre", 1]] },
  { label: "Tourte aux baies de neige", metierKey: "cuisinier", output: "tourte_neige", outputQty: 2, station: "Marmite", items: [["baie_neige", 2], ["farine", 1], ["beurre", 1]] },

  // ── Cuisine : boissons
  { label: "Bière", metierKey: "cuisinier", output: "biere", outputQty: 4, station: "Marmite", items: [["ble", 2], ["ortie", 1]] },
  { label: "Vin", metierKey: "cuisinier", output: "vin", outputQty: 3, station: "Marmite", items: [["raisin_jazbay", 3]] },
  { label: "Hydromel aux baies de genièvre", metierKey: "cuisinier", output: "hydromel_genievre", outputQty: 4, station: "Marmite", items: [["miel", 2], ["baie_genievre", 1]] },

  // ── Couture : apprêts
  { label: "Tissage : toile de lin", metierKey: "couturier", output: "toile_lin", outputQty: 2, station: "Établi de couture", isChain: true, items: [["lin", 3]] },
  { label: "Tissage : drap de laine", metierKey: "couturier", output: "drap_laine", outputQty: 2, station: "Établi de couture", isChain: true, items: [["laine", 3]] },
  { label: "Tissage : velours", metierKey: "couturier", output: "velours", station: "Établi de couture", isChain: true, items: [["soie", 2], ["teinture", 1]] },
  { label: "Filage : fil d'argent", metierKey: "couturier", output: "fil_argent", outputQty: 2, station: "Établi de couture", isChain: true, items: [["lingot_argent", 1]] },

  // ── Couture : vêtements courants
  { label: "Chemise de lin", metierKey: "couturier", output: "chemise_lin", station: "Établi de couture", items: [["toile_lin", 2]] },
  { label: "Tunique simple", metierKey: "couturier", output: "tunique_simple", station: "Établi de couture", items: [["toile_lin", 1], ["drap_laine", 1]] },
  { label: "Pantalon de laine", metierKey: "couturier", output: "pantalon_laine", station: "Établi de couture", items: [["drap_laine", 2]] },
  { label: "Robe de bure", metierKey: "couturier", output: "robe_bure", station: "Établi de couture", items: [["drap_laine", 3], ["laniere_cuir", 1]] },
  { label: "Écharpe de laine", metierKey: "couturier", output: "echarpe_laine", station: "Établi de couture", items: [["drap_laine", 1]] },
  { label: "Mitaines de laine", metierKey: "couturier", output: "mitaines_laine", station: "Établi de couture", items: [["drap_laine", 1]] },
  { label: "Chapeau de feutre", metierKey: "couturier", output: "chapeau_feutre", station: "Établi de couture", items: [["drap_laine", 1], ["teinture", 1]] },

  // ── Couture : cuir
  { label: "Capuche de cuir", metierKey: "couturier", output: "capuche_cuir", station: "Établi de couture", items: [["cuir", 1], ["laniere_cuir", 2]] },
  { label: "Ceinture de cuir", metierKey: "couturier", output: "ceinture_cuir", station: "Établi de couture", items: [["cuir", 1], ["laniere_cuir", 1]] },
  { label: "Bourse de cuir", metierKey: "couturier", output: "bourse_cuir", station: "Établi de couture", items: [["cuir", 1], ["laniere_cuir", 1]] },
  { label: "Sac de voyage", metierKey: "couturier", output: "sac_dos", station: "Établi de couture", items: [["cuir", 2], ["laniere_cuir", 3]] },
  { label: "Tablier d'artisan", metierKey: "couturier", output: "tablier_artisan", station: "Établi de couture", items: [["cuir", 2], ["laniere_cuir", 2]] },
  { label: "Bottes fourrées", metierKey: "couturier", output: "bottes_fourrees", station: "Établi de couture", items: [["cuir", 1], ["fourrure", 1], ["laniere_cuir", 2]] },
  { label: "Manteau d'hiver", metierKey: "couturier", output: "manteau_hiver", station: "Établi de couture", items: [["drap_laine", 2], ["fourrure", 2], ["laniere_cuir", 2]] },
  { label: "Cape de voyage", metierKey: "couturier", output: "cape_voyage", station: "Établi de couture", items: [["drap_laine", 2], ["laniere_cuir", 1]] },

  // ── Couture : pièces de cour
  { label: "Robe de cérémonie", metierKey: "couturier", output: "robe_ceremonie", station: "Établi de couture", items: [["velours", 2], ["fil_argent", 1], ["teinture", 1]] },
  { label: "Robe de cour", metierKey: "couturier", output: "robe_cour", station: "Établi de couture", items: [["velours", 3], ["fil_or", 1], ["teinture", 2]] },
  { label: "Tenue de bal", metierKey: "couturier", output: "tenue_bal", station: "Établi de couture", items: [["velours", 3], ["soie", 2], ["fil_or", 2]] },
  { label: "Livrée de la Garde", metierKey: "couturier", output: "livree_garde", station: "Établi de couture", notes: "Aux couleurs de la branche militaire.", items: [["drap_laine", 2], ["cuir", 1], ["teinture", 2]] },
  { label: "Livrée marchande", metierKey: "couturier", output: "livree_marchande", station: "Établi de couture", notes: "Aux couleurs de la branche commerciale.", items: [["toile_lin", 2], ["fil_argent", 1], ["teinture", 1]] },
];
