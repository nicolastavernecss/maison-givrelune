/**
 * Amorçage de la base de la Maison Givrelune.
 *   npm run db:seed        (ou npm run db:reset pour repartir de zéro)
 *
 * Idempotent : relançable sans dupliquer les référentiels.
 */
import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";
import { randomInt } from "node:crypto";
import { PERMISSIONS, PERMISSION_CATALOG } from "../src/lib/domain";
import {
  BRANCHES,
  CIRCLES,
  COUNCIL_ROLES,
  HISTOIRE,
  MATERIALS,
  METIERS,
  PRIX_DEPART,
  RANKS,
  RECIPES,
  REGLEMENT,
} from "./seed-data";
import {
  GABARITS,
  MATIERES_CRAFT,
  MATIERES_CUIR,
  PALIERS,
  RECETTES_LIBRES,
  nomPiece,
} from "./seed-craft";
import {
  ENCHANTEMENTS_ARME,
  ENCHANTEMENTS_ARMURE,
  ENCHANTEMENTS_BIJOU,
  FORMES_BIJOUX,
  GEMMES_BIJOUX,
  MATIERES_METIERS,
  METAUX_BIJOUX,
  RECETTES_METIERS,
  nomBijou,
} from "./seed-metiers";

const prisma = new PrismaClient();

/**
 * Les référentiels (métiers, matières, recettes, membres, règlement) sont
 * toujours amorcés. Les chiffres — prix, stocks, coffre, commandes — ne le
 * sont qu'avec `--demo`, pour que la Maison démarre sur des compteurs à zéro
 * et saisisse ses vraies données.
 *   npm run db:seed   → référentiels seuls
 *   npm run db:demo   → référentiels + jeu de démonstration
 */
const AVEC_DEMO = process.argv.includes("--demo") || process.env.SEED_DEMO === "1";
const P = PERMISSIONS;
const ALL_PERMS = PERMISSION_CATALOG.map((p) => p.key);

const endsWith = (suffix: string) => ALL_PERMS.filter((k) => k.endsWith(suffix));
const READS = [...endsWith(".read"), P.INVENTORY_OWN];
const CREATES = endsWith(".create");
const VALIDATES = [
  ...endsWith(".validate"),
  P.ORDER_VALIDATE,
  P.CONTRACT_SIGN,
  P.RECIPE_MANAGE,
];

/** Générateur pseudo-aléatoire déterministe — un seed rejouable donne la même base. */
let _seed = 20260804;
function rnd() {
  _seed = (_seed * 1103515245 + 12345) % 2147483648;
  return _seed / 2147483648;
}
const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const jours = (n: number) => new Date(Date.now() - n * 86_400_000);
const dansJours = (n: number) => new Date(Date.now() + n * 86_400_000);

async function main() {
  console.log("❖ Amorçage de la Maison Givrelune…");

  // ── Permissions ────────────────────────────────────────────
  for (const perm of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: { label: perm.label, category: perm.category },
      create: perm,
    });
  }
  const permsByKey = new Map(
    (await prisma.permission.findMany()).map((p) => [p.key, p.id]),
  );
  const permIds = (keys: string[]) =>
    [...new Set(keys)].map((k) => permsByKey.get(k)).filter((v): v is string => Boolean(v));

  // ── Rangs ──────────────────────────────────────────────────
  const rankPerms: Record<string, string[]> = {
    patriarche: ALL_PERMS,
    haut_pere: ALL_PERMS.filter(
      (k) =>
        ![
          P.ADMIN_FULL,
          P.ADMIN_MEMBERS,
          P.ADMIN_ROLES,
          P.ADMIN_SANCTIONS,
          P.CONTRACT_SIGN,
          P.ROLE_REQUEST_APPROVE,
        ].includes(k as never),
    ),
    pere: [...READS, ...CREATES, P.ROLE_REQUEST_READ, P.ROLE_REQUEST_REVIEW, P.ARCHIVES_READ],
    fils: [
      // Un Fils lit les registres de la Maison, mais ni le coffre, ni les
      // archives, ni le journal, ni les candidatures en cours d'examen.
      ...READS.filter(
        (k) =>
          ![P.TREASURY_READ, P.AUDIT_READ, P.ARCHIVES_READ, P.ROLE_REQUEST_READ].includes(
            k as never,
          ),
      ),
      P.HARVEST_CREATE,
      P.REPORT_CREATE,
      P.TICKET_CREATE,
      P.MARKET_CREATE,
      P.ATTENDANCE_CREATE,
      P.GALLERY_CREATE,
      P.INVENTORY_OWN,
    ],
  };

  for (const r of RANKS) {
    const rank = await prisma.rank.upsert({
      where: { key: r.key },
      update: { label: r.label, level: r.level, description: r.description, color: r.color },
      create: r,
    });
    await prisma.rankPermission.deleteMany({ where: { rankId: rank.id } });
    await prisma.rankPermission.createMany({
      data: permIds(rankPerms[r.key] ?? []).map((permissionId) => ({
        rankId: rank.id,
        permissionId,
      })),
    });
  }
  const ranks = new Map((await prisma.rank.findMany()).map((r) => [r.key, r]));

  // ── Conseil ────────────────────────────────────────────────
  const councilPerms: Record<string, string[]> = {
    senechal: [
      P.ADMIN_MEMBERS,
      P.ADMIN_ROLES,
      P.ADMIN_SANCTIONS,
      P.ARCHIVES_READ,
      P.AUDIT_READ,
      P.ROLE_REQUEST_READ,
      P.ROLE_REQUEST_REVIEW,
      P.ROLE_REQUEST_APPROVE,
      P.TICKET_MANAGE,
      ...VALIDATES,
    ],
    champion: [
      P.MISSION_VALIDATE,
      P.MISSION_CREATE,
      P.PASSAGE_VALIDATE,
      P.PASSAGE_CREATE,
      P.REPORT_VALIDATE,
      P.OBJECTIVE_VALIDATE,
    ],
    intendant: [
      P.TREASURY_READ,
      P.TREASURY_MANAGE,
      P.INVENTORY_HOUSE_READ,
      P.INVENTORY_HOUSE_MANAGE,
      P.MATERIAL_MANAGE,
      P.MARKET_MANAGE,
      P.TRADE_VALIDATE,
      P.ORDER_VALIDATE,
    ],
    pretre: [P.EVENT_CREATE, P.ANNOUNCEMENT_CREATE, P.ATTENDANCE_VALIDATE],
    mage: [P.RECIPE_MANAGE, P.MATERIAL_MANAGE],
  };

  // Le stock commun est l'affaire de tout le Conseil, pas du seul Intendant :
  // chacune de ses fonctions peut le consulter et le corriger. On accorde les
  // deux droits ensemble — modifier sans pouvoir ouvrir la page n'a pas de sens.
  const STOCK_COMMUN = [P.INVENTORY_HOUSE_READ, P.INVENTORY_HOUSE_MANAGE];
  for (const c of COUNCIL_ROLES) {
    const liste = (councilPerms[c.key] ??= []);
    for (const droit of STOCK_COMMUN) if (!liste.includes(droit)) liste.push(droit);
  }

  for (const c of COUNCIL_ROLES) {
    const role = await prisma.councilRole.upsert({
      where: { key: c.key },
      update: { label: c.label, description: c.description, icon: c.icon, position: c.position },
      create: c,
    });
    await prisma.councilPermission.deleteMany({ where: { councilRoleId: role.id } });
    await prisma.councilPermission.createMany({
      data: permIds(councilPerms[c.key] ?? []).map((permissionId) => ({
        councilRoleId: role.id,
        permissionId,
      })),
    });
  }
  const councils = new Map((await prisma.councilRole.findMany()).map((c) => [c.key, c]));

  // ── Branches & grades ──────────────────────────────────────
  /**
   * Droits valant pour toute une branche, quel que soit le grade de ses
   * membres — y compris ceux qui n'en ont pas encore reçu.
   */
  const branchPerms: Record<string, string[]> = {
    // La Commerciale vit du négoce : elle tient le stock commun de bout en bout.
    commerciale: STOCK_COMMUN,
  };

  /** Modules propres à chaque branche : le grade 1 valide, les grades 2-3 créent. */
  const branchModules: Record<string, { create: string[]; validate: string[] }> = {
    militaire: {
      create: [P.PASSAGE_CREATE, P.MISSION_CREATE, P.REPORT_CREATE, P.OBJECTIVE_CREATE],
      validate: [P.PASSAGE_VALIDATE, P.MISSION_VALIDATE, P.REPORT_VALIDATE, P.OBJECTIVE_VALIDATE],
    },
    garde_chasse: {
      create: [P.PATROL_CREATE, P.HARVEST_CREATE, P.REPORT_CREATE],
      validate: [P.PATROL_VALIDATE, P.HARVEST_VALIDATE, P.REPORT_VALIDATE],
    },
    commerciale: {
      create: [P.TRADE_CREATE, P.CONTRACT_CREATE, P.MARKET_CREATE, P.ORDER_CREATE],
      validate: [P.TRADE_VALIDATE, P.MARKET_MANAGE, P.ORDER_VALIDATE, P.TREASURY_READ],
    },
    artisanat: {
      create: [P.ORDER_CREATE, P.HARVEST_CREATE, P.MARKET_CREATE],
      validate: [P.ORDER_VALIDATE, P.RECIPE_MANAGE, P.MATERIAL_MANAGE, P.INVENTORY_HOUSE_MANAGE],
    },
  };

  for (const b of BRANCHES) {
    const { grades, ...branchData } = b;
    const branch = await prisma.branch.upsert({
      where: { key: b.key },
      update: branchData,
      create: branchData,
    });
    await prisma.branchPermission.deleteMany({ where: { branchId: branch.id } });
    await prisma.branchPermission.createMany({
      data: permIds(branchPerms[b.key] ?? []).map((permissionId) => ({
        branchId: branch.id,
        permissionId,
      })),
    });

    const mods = branchModules[b.key];
    for (const g of grades) {
      const grade = await prisma.grade.upsert({
        where: { key: g.key },
        update: { label: g.label, level: g.level, branchId: branch.id },
        create: { ...g, branchId: branch.id },
      });
      const keys = g.level === 1 ? [...mods.validate, ...mods.create] : g.level <= 3 ? mods.create : [];
      await prisma.gradePermission.deleteMany({ where: { gradeId: grade.id } });
      await prisma.gradePermission.createMany({
        data: permIds(keys).map((permissionId) => ({ gradeId: grade.id, permissionId })),
      });
    }
  }
  const branches = new Map((await prisma.branch.findMany()).map((b) => [b.key, b]));
  const grades = new Map((await prisma.grade.findMany()).map((g) => [g.key, g]));

  // ── Cercles ────────────────────────────────────────────────
  for (const c of CIRCLES) {
    const { branchKey, ...rest } = c;
    await prisma.circle.upsert({
      where: { key: c.key },
      update: { ...rest, branchId: branches.get(branchKey)?.id },
      create: { ...rest, branchId: branches.get(branchKey)?.id },
    });
  }
  const circles = new Map((await prisma.circle.findMany()).map((c) => [c.key, c]));

  // ── Métiers ────────────────────────────────────────────────
  for (const m of METIERS) {
    await prisma.metier.upsert({ where: { key: m.key }, update: m, create: m });
  }
  const metiers = new Map((await prisma.metier.findMany()).map((m) => [m.key, m]));

  // ── Nettoyage des clés remplacées par l'armurerie engendrée ──
  // « armure_acier » est devenue « cuirasse_acier », « armure_naine »
  // « cuirasse_nain ». On retire les anciennes si rien ne s'y rattache.
  const REMPLACEES = [
    "armure_acier", // → cuirasse_acier
    "armure_naine", // → cuirasse_nain
    "bague_or_sertie", // → bague_or_<gemme>
    "bague_argent_sertie", // → bague_argent_<gemme>
    "collier_or_serti", // → collier_or_<gemme>
    "circlet_or", // → diademe_or
  ];
  for (const ancienne of REMPLACEES) {
    const m = await prisma.material.findUnique({
      where: { key: ancienne },
      include: { _count: { select: { inventory: true, usedIn: true } } },
    });
    if (!m) continue;
    if (m._count.inventory > 0 || m._count.usedIn > 0) continue;
    await prisma.recipe.deleteMany({ where: { outputMaterialId: m.id } });
    await prisma.material.delete({ where: { id: m.id } });
  }

  // ── Matières ───────────────────────────────────────────────
  let pos = 0;
  const enregistrerMatiere = async (m: {
    key: string;
    label: string;
    category: string;
    subcategory?: string;
    state?: string;
    unit?: string;
    isCraftable?: boolean;
  }) => {
    const data = {
      key: m.key,
      label: m.label,
      category: m.category,
      subcategory: m.subcategory ?? "",
      state: m.state ?? "brut",
      unit: m.unit ?? "unité",
      isCraftable: m.isCraftable ?? false,
      position: pos++,
    };
    await prisma.material.upsert({ where: { key: m.key }, update: data, create: data });
  };

  for (const m of [...MATERIALS, ...MATIERES_CRAFT, ...MATIERES_CUIR, ...MATIERES_METIERS]) {
    await enregistrerMatiere(m);
  }

  // Joaillerie : métal × forme × sertissage.
  for (const metal of METAUX_BIJOUX) {
    for (const forme of FORMES_BIJOUX) {
      for (const gemme of GEMMES_BIJOUX) {
        await enregistrerMatiere({
          key: `${forme.cle}_${metal.cle}${gemme.cle ? `_${gemme.cle}` : ""}`,
          label: nomBijou(forme, metal, gemme),
          category: "Produits finis",
          subcategory: "Bijoux",
          state: "fini",
          unit: "pièce",
          isCraftable: true,
        });
      }
    }
  }

  // Enchantement : un produit par effet et par support.
  const SUPPORTS = [
    {
      cle: "arme",
      label: "Arme enchantée",
      sous: "Armes",
      effets: ENCHANTEMENTS_ARME,
      base: "epee_acier",
      ame: "ame_commune",
    },
    {
      cle: "armure",
      label: "Armure enchantée",
      sous: "Armures",
      effets: ENCHANTEMENTS_ARMURE,
      base: "cuirasse_acier",
      ame: "ame_commune",
    },
    {
      cle: "bijou",
      label: "Bijou enchanté",
      sous: "Bijoux",
      effets: ENCHANTEMENTS_BIJOU,
      base: "bague_or",
      ame: "ame_grande",
    },
  ];
  for (const s of SUPPORTS) {
    for (const e of s.effets) {
      await enregistrerMatiere({
        key: `${s.cle}_ench_${e.cle}`,
        label: `${s.label} — ${e.label}`,
        category: "Produits finis",
        subcategory: s.sous,
        state: "fini",
        unit: "pièce",
        isCraftable: true,
      });
    }
  }

  // Armurerie : chaque gabarit croisé avec chaque palier devient une matière
  // « produit fini », fabricable et donc imputable au stock.
  for (const palier of PALIERS) {
    for (const gabarit of GABARITS) {
      await enregistrerMatiere({
        key: `${gabarit.cle}_${palier.cle}`,
        label: nomPiece(gabarit, palier),
        category: "Produits finis",
        subcategory: gabarit.categorie,
        state: "fini",
        unit: gabarit.cle === "fleches" ? "flèche" : "pièce",
        isCraftable: true,
      });
    }
  }

  const materials = new Map((await prisma.material.findMany()).map((m) => [m.key, m]));

  // ── Recettes ───────────────────────────────────────────────
  const enregistrerRecette = async (r: {
    label: string;
    metierKey: string;
    output: string;
    outputQty?: number;
    station?: string;
    isChain?: boolean;
    notes?: string;
    items: [string, number][];
  }) => {
    const output = materials.get(r.output);
    const metier = metiers.get(r.metierKey);
    if (!output || !metier) return false;

    const existing = await prisma.recipe.findFirst({
      where: { label: r.label, metierId: metier.id },
    });
    const data = {
      label: r.label,
      metierId: metier.id,
      outputMaterialId: output.id,
      outputQty: r.outputQty ?? 1,
      station: r.station ?? metier.station,
      isChain: r.isChain ?? false,
      notes: r.notes ?? "",
    };
    const recipe = existing
      ? await prisma.recipe.update({ where: { id: existing.id }, data })
      : await prisma.recipe.create({ data });

    await prisma.recipeItem.deleteMany({ where: { recipeId: recipe.id } });
    await prisma.recipeItem.createMany({
      data: r.items
        .filter(([key]) => materials.has(key))
        .map(([key, quantity]) => ({
          recipeId: recipe.id,
          materialId: materials.get(key)!.id,
          quantity,
        })),
    });
    return true;
  };

  let nbRecettes = 0;
  for (const r of [...RECIPES, ...RECETTES_LIBRES, ...RECETTES_METIERS]) {
    if (await enregistrerRecette(r)) nbRecettes++;
  }

  // Joaillerie engendrée.
  for (const metal of METAUX_BIJOUX) {
    for (const forme of FORMES_BIJOUX) {
      for (const gemme of GEMMES_BIJOUX) {
        const items: [string, number][] = [[metal.lingot, forme.lingots]];
        if (gemme.materiau) items.push([gemme.materiau, 1]);
        if (
          await enregistrerRecette({
            label: nomBijou(forme, metal, gemme),
            metierKey: "bijoutier",
            output: `${forme.cle}_${metal.cle}${gemme.cle ? `_${gemme.cle}` : ""}`,
            station: "Établi de joaillerie",
            items,
          })
        ) {
          nbRecettes++;
        }
      }
    }
  }

  // Enchantement engendré : pierre d'âme + pièce de base.
  for (const s of SUPPORTS) {
    for (const e of s.effets) {
      if (
        await enregistrerRecette({
          label: `${s.label} — ${e.label}`,
          metierKey: "enchanteur",
          output: `${s.cle}_ench_${e.cle}`,
          station: "Table d'enchantement",
          notes:
            "La pièce de base indiquée est un exemple : remplacez-la par celle que vous enchantez réellement.",
          items: [
            [s.ame, 1],
            [s.base, 1],
          ],
        })
      ) {
        nbRecettes++;
      }
    }
  }

  // Armurerie engendrée : palier × gabarit.
  for (const palier of PALIERS) {
    for (const gabarit of GABARITS) {
      const items: [string, number][] = [[palier.principal, gabarit.principal]];
      for (const [cle, qte] of palier.fixes ?? []) items.push([cle, qte]);
      if (gabarit.lanieres > 0) items.push(["laniere_cuir", gabarit.lanieres]);
      if (gabarit.bois) items.push(["bois_scie", gabarit.bois]);

      // Un même composant peut apparaître deux fois (ébonite daedrique) : on fusionne.
      const fusion = new Map<string, number>();
      for (const [cle, qte] of items) fusion.set(cle, (fusion.get(cle) ?? 0) + qte);

      if (
        await enregistrerRecette({
          label: nomPiece(gabarit, palier),
          metierKey: "forgeron",
          output: `${gabarit.cle}_${palier.cle}`,
          outputQty: gabarit.produit ?? 1,
          station: gabarit.cle === "arc" || gabarit.cle === "fleches" ? "Établi" : "Forge",
          items: [...fusion.entries()],
        })
      ) {
        nbRecettes++;
      }
    }
  }

  const nbMatieres = await prisma.material.count();
  console.log(
    `  ❖ ${nbRecettes} recettes (dont ${PALIERS.length * GABARITS.length} pièces d'armurerie), ${nbMatieres} matières, ${METIERS.length} métiers`,
  );

  // ── Membres ────────────────────────────────────────────────
  /*
   * Mot de passe initial des fondateurs.
   *
   * Rien n'est écrit en dur ici : le dépôt peut être public sans livrer
   * les clés de la Maison. Deux cas :
   *   - SEED_PASSWORD est défini  → on l'utilise (utile pour rejouer un seed) ;
   *   - sinon                     → on en engendre un au hasard, affiché une
   *                                 seule fois dans la console.
   *
   * Il respecte la politique du site : au moins 12 caractères, quatre
   * familles, aucun mot du contexte, aucune suite de touches.
   */
  const MOTS = [
    "Corbeau", "Ravine", "Aubier", "Silex", "Bruyere", "Cendre", "Sillon",
    "Tourbe", "Fougere", "Ardoise", "Roseau", "Chardon", "Ecume", "Brume",
    "Falaise", "Marais", "Combe", "Sente", "Genet", "Ramure", "Halage",
    "Buse", "Loutre", "Sanglier", "Bouleau", "Erable", "Frene", "Aulne",
  ];
  const engendrerMotDePasse = () => {
    const tire = () => MOTS[randomInt(MOTS.length)];
    const a = tire();
    let b = tire();
    let c = tire();
    while (b === a) b = tire();
    while (c === a || c === b) c = tire();
    return `${a}-${b}-${c}-${randomInt(10, 100)}`;
  };

  const MOT_DE_PASSE_ENGENDRE = !process.env.SEED_PASSWORD;
  const MOT_DE_PASSE_DEMO = process.env.SEED_PASSWORD ?? engendrerMotDePasse();
  const hash = hashSync(MOT_DE_PASSE_DEMO, 12);

  type MemberSeed = {
    login: string;
    nomRp: string;
    rank: string;
    branch?: string;
    grade?: string;
    council?: string;
    circle?: string;
    status?: string;
    bio?: string;
    metiers?: [string, string][];
    presentedBy?: string;
    entree?: number;
  };

  /**
   * Le fondateur, toujours créé : c'est lui qui ouvrira les comptes des
   * autres depuis Gouvernance → Membres & rôles, ou qui acceptera les
   * demandes de rôle. Les droits découlent automatiquement du rang, du
   * grade et de la fonction de Conseil qu'on lui attribue.
   */
  const FONDATEURS: MemberSeed[] = [
    {
      login: "nicolas.varian",
      nomRp: "Nicolas Imperium Varian",
      rank: "patriarche",
      status: "actif",
      entree: 900,
      bio: "Fondateur. N'a hérité d'aucun titre et n'en a jamais attendu. Tient les alliances et la parole de la Maison.",
      metiers: [["marchand", "maitre"]],
    },
  ];

  /** Compagnons fictifs, uniquement avec `--demo`. */
  const MEMBRES_DEMO: MemberSeed[] = [
    {
      login: "halvar.sombrepierre",
      nomRp: "Halvar Sombrepierre",
      rank: "haut_pere",
      council: "senechal",
      status: "actif",
      entree: 780,
      bio: "Sénéchal. Tient les registres, l'admission des membres et la discipline. Rien ne lui échappe deux fois.",
    },
    {
      login: "taga.duriff",
      nomRp: "Taga Duriff",
      rank: "haut_pere",
      branch: "garde_chasse",
      grade: "capitaine_garde",
      circle: "grande_ramure",
      status: "actif",
      entree: 720,
      bio: "Capitaine de la Garde et chef de la Grande Ramure. Connaît chaque col et chaque sentier des terres de la Maison.",
      metiers: [["chasseur", "maitre"]],
    },
    {
      login: "ulfr.brise-ecu",
      nomRp: "Ulfr Brise-Écu",
      rank: "haut_pere",
      branch: "militaire",
      grade: "maitre_de_guerre",
      council: "champion",
      status: "actif",
      entree: 700,
      bio: "Maître de Guerre et Champion de la Maison. Une seule règle : on ne dégaine jamais sans mandat.",
      metiers: [["mercenaire", "maitre"]],
    },
    {
      login: "berit.mainsure",
      nomRp: "Berit Mainsûre",
      rank: "pere",
      branch: "commerciale",
      grade: "argentier",
      council: "intendant",
      status: "actif",
      entree: 640,
      bio: "Argentier et Intendant. Tient le coffre, les stocks et le cours du marché. Compte deux fois, paie une fois.",
      metiers: [["marchand", "maitre"]],
    },
    {
      login: "dorik.fer-noir",
      nomRp: "Dorik Fer-Noir",
      rank: "pere",
      branch: "artisanat",
      grade: "maitre_artisan",
      status: "actif",
      entree: 610,
      bio: "Maître Artisan, forge et fourneau. A fondu le premier lingot de la Maison.",
      metiers: [
        ["forgeron", "maitre"],
        ["mineur", "compagnon"],
      ],
    },
    {
      login: "sylvienne.aubelune",
      nomRp: "Sylvienne Aubelune",
      rank: "pere",
      branch: "artisanat",
      grade: "artisan",
      status: "actif",
      entree: 430,
      bio: "Formée à l'atelier de la Maison. Les tenues de cour sortent de son établi.",
      metiers: [["couturier", "artisan"]],
    },
    {
      login: "nerien.vals",
      nomRp: "Nerien Vals",
      rank: "fils",
      branch: "artisanat",
      grade: "compagnon",
      status: "actif",
      entree: 260,
      bio: "Alchimiste. Distille pour la Maison ce que les autres ramassent sans savoir le nommer.",
      metiers: [
        ["alchimiste", "compagnon"],
        ["herboriste", "apprenti"],
      ],
      presentedBy: "dorik.fer-noir",
    },
    {
      login: "eyva.pas-leger",
      nomRp: "Eyva Pas-Léger",
      rank: "fils",
      branch: "garde_chasse",
      grade: "garde_chasse",
      circle: "grande_ramure",
      status: "actif",
      entree: 240,
      bio: "Pisteuse devenue Garde-Chasse en une saison. Membre de la Grande Ramure.",
      metiers: [["chasseur", "artisan"]],
      presentedBy: "taga.duriff",
    },
    {
      login: "torvald.cadet",
      nomRp: "Torvald le Cadet",
      rank: "fils",
      branch: "militaire",
      grade: "recrue",
      status: "essai",
      entree: 24,
      bio: "Recrue en période d'essai. Beaucoup d'allant, encore peu de discipline.",
      metiers: [["garde", "apprenti"]],
      presentedBy: "ulfr.brise-ecu",
    },
    {
      login: "grumm",
      nomRp: "Grumm",
      rank: "fils",
      branch: "artisanat",
      grade: "apprenti_artisanat",
      status: "essai",
      entree: 12,
      bio: "Orsimer taciturne. Descend à la mine avant l'aube et remonte après la nuit.",
      metiers: [["mineur", "apprenti"]],
      presentedBy: "dorik.fer-noir",
    },
  ];

  const MEMBERS: MemberSeed[] = AVEC_DEMO ? [...FONDATEURS, ...MEMBRES_DEMO] : FONDATEURS;

  const users = new Map<string, { id: string; nomRp: string }>();
  for (const m of MEMBERS) {
    const data = {
      login: m.login,
      passwordHash: hash,
      nomRp: m.nomRp,
      bio: m.bio ?? "",
      rankId: ranks.get(m.rank)!.id,
      branchId: m.branch ? branches.get(m.branch)?.id : null,
      gradeId: m.grade ? grades.get(m.grade)?.id : null,
      councilRoleId: m.council ? councils.get(m.council)?.id : null,
      circleId: m.circle ? circles.get(m.circle)?.id : null,
      status: m.status ?? "actif",
      dateEntree: jours(m.entree ?? 100),
    };
    // Le mot de passe n'est posé qu'à la création : rejouer le seed ne doit
    // jamais réinitialiser celui qu'un membre a choisi depuis « Mon compte ».
    const { passwordHash, ...sansMotDePasse } = data;
    const user = await prisma.user.upsert({
      where: { login: m.login },
      update: sansMotDePasse,
      create: { ...sansMotDePasse, passwordHash },
    });
    users.set(m.login, user);
  }

  // Parrainages (2ᵉ passe : tous les membres existent désormais)
  for (const m of MEMBERS) {
    if (!m.presentedBy) continue;
    await prisma.user.update({
      where: { login: m.login },
      data: { presentedById: users.get(m.presentedBy)!.id },
    });
  }

  // Métiers des membres
  for (const m of MEMBERS) {
    for (const [i, [metierKey, niveau]] of (m.metiers ?? []).entries()) {
      const metier = metiers.get(metierKey);
      if (!metier) continue;
      await prisma.userMetier.upsert({
        where: { userId_metierId: { userId: users.get(m.login)!.id, metierId: metier.id } },
        update: { niveau, isPrimary: i === 0 },
        create: {
          userId: users.get(m.login)!.id,
          metierId: metier.id,
          niveau,
          isPrimary: i === 0,
        },
      });
    }
  }

  // Chef de la Grande Ramure — seulement si le membre concerné existe.
  const chefRamure = users.get("taga.duriff");
  if (chefRamure) {
    await prisma.circle.update({
      where: { key: "grande_ramure" },
      data: { leaderId: chefRamure.id },
    });
  }
  if (MOT_DE_PASSE_ENGENDRE) {
    console.log(`  ❖ ${MEMBERS.length} membres créés.`);
    console.log("");
    console.log("     ┌──────────────────────────────────────────────────────┐");
    console.log("     │  MOT DE PASSE INITIAL — affiché une seule fois       │");
    console.log("     └──────────────────────────────────────────────────────┘");
    console.log(`        ${MOT_DE_PASSE_DEMO}`);
    console.log("");
    console.log("     Notez-le maintenant, puis changez-le depuis « Mon compte »");
    console.log("     dès votre première connexion.");
    console.log("");
  } else {
    console.log(`  ❖ ${MEMBERS.length} membres (mot de passe fourni par SEED_PASSWORD)`);
  }

  // ── Cours du marché : historique d'amorce ──────────────────
  if (AVEC_DEMO && (await prisma.marketPrice.count()) === 0) {
    const releveurs = ["berit.mainsure", "dorik.fer-noir", "nicolas.varian", "sylvienne.aubelune"];
    const lignes: {
      materialId: string;
      price: number;
      date: Date;
      memberId: string;
      source: string;
    }[] = [];

    for (const [key, base] of Object.entries(PRIX_DEPART)) {
      const material = materials.get(key);
      if (!material) continue;
      // 6 relevés étalés sur ~10 semaines, avec une dérive douce
      let cours = base * (0.82 + rnd() * 0.16);
      for (let i = 5; i >= 0; i--) {
        cours = cours * (0.97 + rnd() * 0.09);
        lignes.push({
          materialId: material.id,
          price: Math.max(1, Math.round(cours * 10) / 10),
          date: jours(i * 12 + Math.floor(rnd() * 4)),
          memberId: users.get(pick(releveurs))!.id,
          source: pick(["Comptoir de Vendeaume", "Blancherive", "Fauret", "Marché de la Maison", ""]),
        });
      }
    }
    await prisma.marketPrice.createMany({ data: lignes });
    console.log(`  ❖ ${lignes.length} relevés de prix`);
  }

  const dernierPrix = new Map<string, number>();
  for (const [key, base] of Object.entries(PRIX_DEPART)) {
    const material = materials.get(key);
    if (!material) continue;
    const last = await prisma.marketPrice.findFirst({
      where: { materialId: material.id },
      orderBy: { date: "desc" },
    });
    dernierPrix.set(key, last?.price ?? base);
  }

  // ── Stocks ─────────────────────────────────────────────────
  if (AVEC_DEMO && (await prisma.inventoryItem.count()) === 0) {
    const stockMaison: [string, number, number | null][] = [
      ["minerai_fer", 340, 120],
      ["lingot_fer", 96, 40],
      ["lingot_acier", 54, 25],
      ["minerai_corindon", 88, 30],
      ["lingot_or", 12, 6],
      ["lingot_argent", 19, null],
      ["peau", 74, 30],
      ["cuir", 41, 20],
      ["laniere_cuir", 128, 60],
      ["fourrure", 22, null],
      ["buche", 260, 100],
      ["charbon", 74, 40],
      ["lin", 58, 25],
      ["laine", 63, 25],
      ["soie", 11, 8],
      ["teinture", 17, 10],
      ["plante", 96, 40],
      ["champignon", 52, 25],
      ["viande", 64, 30],
      ["legume", 71, 30],
      ["gemme", 7, 4],
    ];
    for (const [key, quantity, seuil] of stockMaison) {
      const material = materials.get(key)!;
      await prisma.inventoryItem.create({
        data: {
          ownerType: "maison",
          materialId: material.id,
          category: material.category,
          state: material.state,
          unit: material.unit,
          quantity,
          seuilBas: seuil,
          unitValue: dernierPrix.get(key) ?? null,
        },
      });
    }

    const stash: [string, [string, number][]][] = [
      ["dorik.fer-noir", [["lingot_fer", 24], ["lingot_acier", 16], ["minerai_fer", 60], ["laniere_cuir", 30]]],
      ["sylvienne.aubelune", [["soie", 6], ["lin", 14], ["laine", 12], ["teinture", 5], ["fil_or", 3]]],
      ["eyva.pas-leger", [["peau", 18], ["fourrure", 9], ["viande", 22], ["plante", 15]]],
      ["grumm", [["minerai_fer", 82], ["minerai_corindon", 21], ["minerai_or", 4]]],
      ["nerien.vals", [["plante", 34], ["champignon", 27], ["ingredient_rare", 3]]],
    ];
    for (const [login, lignes] of stash) {
      for (const [key, quantity] of lignes) {
        const material = materials.get(key)!;
        await prisma.inventoryItem.create({
          data: {
            ownerType: "membre",
            ownerUserId: users.get(login)!.id,
            materialId: material.id,
            category: material.category,
            state: material.state,
            unit: material.unit,
            quantity,
            unitValue: dernierPrix.get(key) ?? null,
          },
        });
      }
    }

    // Quelques mouvements pour peupler l'historique
    const itemsMaison = await prisma.inventoryItem.findMany({ where: { ownerType: "maison" }, take: 8 });
    for (const item of itemsMaison) {
      await prisma.inventoryMovement.createMany({
        data: [
          {
            inventoryItemId: item.id,
            ownerType: "maison",
            materialId: item.materialId,
            label: "Versement aux communs",
            delta: Math.round(item.quantity * 0.6),
            reason: "Récolte versée au stock commun",
            userId: users.get(pick(["grumm", "eyva.pas-leger", "dorik.fer-noir"]))!.id,
            createdAt: jours(Math.floor(rnd() * 40) + 5),
          },
          {
            inventoryItemId: item.id,
            ownerType: "maison",
            materialId: item.materialId,
            label: "Prélèvement d'atelier",
            delta: -Math.round(item.quantity * 0.15),
            reason: "Consommé pour une commande",
            userId: users.get("dorik.fer-noir")!.id,
            createdAt: jours(Math.floor(rnd() * 20) + 1),
          },
        ],
      });
    }
    console.log("  ❖ Stock commun + stashs personnels");
  }

  // ── Commandes & impayés ────────────────────────────────────
  if (AVEC_DEMO && (await prisma.craftOrder.count()) === 0) {
    const recipeArmure = await prisma.recipe.findFirst({ where: { label: "Armure d'acier" } });
    const recipeTenue = await prisma.recipe.findFirst({ where: { label: "Tenue noble" } });

    const commandes = [
      {
        clientNomRp: "Jarl Sigrid Vent-du-Nord",
        clientMaison: "Cour de Blancherive",
        clientContact: "Messager de la cour",
        artisanId: users.get("sylvienne.aubelune")!.id,
        metierId: metiers.get("couturier")!.id,
        objets: "Tenue noble brodée aux armes de la cour",
        quantite: 2,
        materiauxFournisParClient: false,
        materiauxAFournir: "Soie, fil d'or, teintures pourpres",
        prixConvenu: 2400,
        acompte: 1200,
        etat: "en_fabrication",
        dateCommande: jours(18),
        dateLivraisonPrevue: dansJours(6),
        recipeId: recipeTenue?.id,
        observations: "Livraison impérative avant le banquet de la cour.",
        createdById: users.get("berit.mainsure")!.id,
      },
      {
        clientNomRp: "Compagnie du Loup Gris",
        clientMaison: "Mercenaires libres",
        clientContact: "Halgar, quartier-maître",
        artisanId: users.get("dorik.fer-noir")!.id,
        metierId: metiers.get("forgeron")!.id,
        objets: "Armures d'acier complètes",
        quantite: 4,
        materiauxFournisParClient: false,
        materiauxAFournir: "Lingots d'acier, lingots de fer, lanières",
        prixConvenu: 3600,
        acompte: 900,
        etat: "en_fabrication",
        dateCommande: jours(12),
        dateLivraisonPrevue: dansJours(11),
        recipeId: recipeArmure?.id,
        observations: "Reste dû important — relancer le quartier-maître.",
        createdById: users.get("dorik.fer-noir")!.id,
      },
      {
        clientNomRp: "Maître Aldric",
        clientMaison: "Guilde des Marchands",
        clientContact: "Comptoir de Vendeaume",
        artisanId: users.get("dorik.fer-noir")!.id,
        metierId: metiers.get("forgeron")!.id,
        objets: "Dagues de fer",
        quantite: 12,
        materiauxFournisParClient: true,
        materiauxAFournir: "—",
        prixConvenu: 720,
        acompte: 720,
        etat: "livree",
        dateCommande: jours(40),
        dateLivraisonPrevue: jours(25),
        observations: "Matériaux fournis par le client. Réglée intégralement.",
        createdById: users.get("berit.mainsure")!.id,
      },
      {
        clientNomRp: "Dame Ysolde",
        clientMaison: "Domaine de Fauret",
        clientContact: "Corbeau",
        artisanId: users.get("nerien.vals")!.id,
        metierId: metiers.get("alchimiste")!.id,
        objets: "Potions de soin",
        quantite: 20,
        materiauxFournisParClient: false,
        materiauxAFournir: "Plantes et champignons du Garde-Chasse",
        prixConvenu: 900,
        acompte: 0,
        etat: "en_attente",
        dateCommande: jours(4),
        dateLivraisonPrevue: dansJours(14),
        observations: "Aucun acompte versé pour l'instant.",
        createdById: users.get("nerien.vals")!.id,
      },
      {
        clientNomRp: "Thane Bjorn Hache-Longue",
        clientMaison: "Épervier",
        clientContact: "En personne, Grande Salle",
        artisanId: users.get("dorik.fer-noir")!.id,
        metierId: metiers.get("forgeron")!.id,
        objets: "Bouclier d'acier gravé",
        quantite: 1,
        materiauxFournisParClient: false,
        materiauxAFournir: "Lingots d'acier",
        prixConvenu: 850,
        acompte: 850,
        etat: "prete",
        dateCommande: jours(9),
        dateLivraisonPrevue: dansJours(2),
        observations: "Prête, en attente de retrait.",
        createdById: users.get("dorik.fer-noir")!.id,
      },
    ];

    for (const c of commandes) {
      await prisma.craftOrder.create({
        data: { ...c, resteAPayer: Math.max(0, c.prixConvenu - c.acompte) },
      });
    }
    console.log(`  ❖ ${commandes.length} commandes (dont impayées)`);
  }

  // ── Trésorerie ─────────────────────────────────────────────
  // Le coffre existe toujours, à zéro tant que rien n'y est versé.
  await prisma.treasury.upsert({
    where: { id: "maison" },
    update: {},
    create: {
      id: "maison",
      septims: 0,
      valeurStock: 0,
      note: "Coffre de la Maison, tenu par l'Intendant.",
    },
  });

  if (AVEC_DEMO && (await prisma.treasuryMovement.count()) === 0) {
    const mouvements: [number, string, string, number][] = [
      [12000, "Fonds fondateurs versés par les Patriarches", "dotation", 210],
      [2400, "Vente de lingots au comptoir de Vendeaume", "commerce", 96],
      [-1800, "Achat de soie et de teintures pour l'atelier de couture", "achat", 72],
      [720, "Commande Maître Aldric — dagues de fer", "commande", 40],
      [-950, "Solde des Gardes-Chasse", "solde", 30],
      [1200, "Acompte cour de Blancherive — tenues nobles", "commande", 18],
      [900, "Acompte Compagnie du Loup Gris", "commande", 12],
      [-430, "Réparation du fourneau de la forge", "entretien", 8],
      [850, "Bouclier gravé — Thane Bjorn", "commande", 5],
    ];
    let solde = 0;
    for (const [montant, motif, categorie, ilya] of mouvements) {
      solde += montant;
      await prisma.treasuryMovement.create({
        data: {
          montant,
          motif,
          categorie,
          date: jours(ilya),
          soldeApres: solde,
          userId: users.get(montant > 0 ? "berit.mainsure" : "halvar.sombrepierre")!.id,
        },
      });
    }
    const valeurStock = Math.round(
      (
        await prisma.inventoryItem.findMany({
          where: { ownerType: "maison" },
          select: { quantity: true, unitValue: true },
        })
      ).reduce((sum, i) => sum + i.quantity * (i.unitValue ?? 0), 0),
    );
    await prisma.treasury.upsert({
      where: { id: "maison" },
      update: { septims: solde, valeurStock, responsableId: users.get("berit.mainsure")!.id },
      create: {
        id: "maison",
        septims: solde,
        valeurStock,
        responsableId: users.get("berit.mainsure")!.id,
        note: "Coffre de la Maison, tenu par l'Intendant.",
      },
    });
    console.log(`  ❖ Trésorerie : ${solde} Septims`);
  }

  // ── Registres ──────────────────────────────────────────────
  if (AVEC_DEMO && (await prisma.passageRight.count()) === 0) {
    await prisma.passageRight.createMany({
      data: [
        {
          beneficiaireId: users.get("eyva.pas-leger")!.id,
          typeDroit: "Passage des cols du nord",
          nombreDroits: 5,
          dateOctroi: jours(30),
          expiration: dansJours(30),
          accordeParId: users.get("ulfr.brise-ecu")!.id,
          motif: "Patrouilles régulières de la Grande Ramure",
          statut: "actif",
        },
        {
          beneficiaireNom: "Compagnie du Loup Gris",
          typeDroit: "Escorte de convoi marchand",
          nombreDroits: 2,
          dateOctroi: jours(14),
          expiration: dansJours(7),
          accordeParId: users.get("ulfr.brise-ecu")!.id,
          motif: "Livraison des armures commandées",
          statut: "actif",
        },
        {
          beneficiaireNom: "Marchand Ambulant Sven",
          typeDroit: "Traversée du domaine",
          nombreDroits: 1,
          dateOctroi: jours(80),
          expiration: jours(20),
          accordeParId: users.get("taga.duriff")!.id,
          motif: "Passage unique accordé par courtoisie",
          statut: "expire",
        },
      ],
    });

    await prisma.patrol.createMany({
      data: [
        {
          patrouilleurs: "Taga Duriff, Eyva Pas-Léger",
          circleId: circles.get("grande_ramure")!.id,
          zone: "Cols du nord — sentier des Trois Pierres",
          date: jours(3),
          heureDebut: "20:00",
          heureFin: "23:30",
          type: "frontieres",
          incidents: "Traces de braconniers relevées près du gué. Aucun contact.",
          statut: "effectuee",
          authorId: users.get("eyva.pas-leger")!.id,
          valideParId: users.get("taga.duriff")!.id,
          valideLe: jours(2),
        },
        {
          patrouilleurs: "Eyva Pas-Léger, Torvald le Cadet",
          circleId: circles.get("grande_ramure")!.id,
          zone: "Route de Blancherive",
          date: dansJours(2),
          heureDebut: "19:00",
          heureFin: "22:00",
          type: "routes",
          statut: "planifiee",
          authorId: users.get("taga.duriff")!.id,
        },
        {
          patrouilleurs: "Taga Duriff",
          zone: "Bois de la Ramure — traque du loup blanc",
          date: jours(11),
          heureDebut: "05:00",
          heureFin: "12:00",
          type: "traque",
          incidents: "Bête abattue. Fourrure versée aux communs.",
          statut: "effectuee",
          authorId: users.get("taga.duriff")!.id,
          valideParId: users.get("taga.duriff")!.id,
          valideLe: jours(11),
        },
      ],
    });

    await prisma.harvestPermit.createMany({
      data: [
        {
          demandeurId: users.get("grumm")!.id,
          categorie: "minerais",
          materialId: materials.get("minerai_fer")!.id,
          ressource: "Minerai de fer — filon de la Combe Grise",
          quantiteAutorisee: 200,
          unite: "unité",
          zone: "Combe Grise",
          dateEmission: jours(20),
          validiteJusquau: dansJours(10),
          delivreParId: users.get("taga.duriff")!.id,
          statut: "accorde",
          quantiteRecoltee: 82,
        },
        {
          demandeurId: users.get("nerien.vals")!.id,
          categorie: "plantes",
          materialId: materials.get("plante")!.id,
          ressource: "Plantes alchimiques — clairière de la Ramure",
          quantiteAutorisee: 60,
          zone: "Bois de la Ramure",
          dateEmission: jours(9),
          validiteJusquau: dansJours(21),
          delivreParId: users.get("taga.duriff")!.id,
          statut: "accorde",
          quantiteRecoltee: 34,
        },
        {
          demandeurId: users.get("sylvienne.aubelune")!.id,
          categorie: "autre",
          ressource: "Écorce à teinture — berges du ruisseau",
          quantiteAutorisee: 40,
          zone: "Berges est",
          dateEmission: jours(1),
          statut: "en_attente",
          motif: "Teintures pourpres pour la commande de la cour de Blancherive.",
        },
      ],
    });
    console.log("  ❖ Registres : droits de passage, patrouilles, permis de récolte");
  }

  // ── Opérations & diplomatie ────────────────────────────────
  if (AVEC_DEMO && (await prisma.mission.count()) === 0) {
    const m1 = await prisma.mission.create({
      data: {
        titre: "Escorte du convoi de lingots vers Vendeaume",
        branchId: branches.get("militaire")!.id,
        assignes: "Ulfr Brise-Écu, Torvald le Cadet",
        objectif: "Conduire le convoi jusqu'au comptoir sans perte.",
        date: jours(7),
        lieu: "Route de Vendeaume",
        statut: "reussie",
        autoriseParId: users.get("nicolas.varian")!.id,
      },
    });
    await prisma.mission.create({
      data: {
        titre: "Reconnaissance des ruines dwemer de la Combe Grise",
        branchId: branches.get("garde_chasse")!.id,
        assignes: "Taga Duriff, Eyva Pas-Léger, Grumm",
        objectif: "Évaluer le gisement de ferraille dwemer et la présence hostile.",
        date: dansJours(5),
        lieu: "Combe Grise",
        statut: "planifiee",
        autoriseParId: users.get("ulfr.brise-ecu")!.id,
      },
    });
    await prisma.report.create({
      data: {
        titre: "Rapport d'escorte — convoi de Vendeaume",
        auteurId: users.get("ulfr.brise-ecu")!.id,
        missionId: m1.id,
        date: jours(6),
        resume:
          "Convoi arrivé intact. Deux tentatives d'approche de bandits repoussées sans combat au niveau du gué.",
        pertes: "Aucune.",
        butin: "2 400 Septims encaissés au comptoir.",
        suites: "Renforcer la garde du gué lors des prochains convois.",
        statut: "vise",
      },
    });
    await prisma.objective.createMany({
      data: [
        {
          intitule: "Porter le stock de lingots d'acier à 150 unités",
          description: "Assurer la production des quatre armures commandées et constituer une réserve.",
          echeance: dansJours(20),
          avancement: 36,
          responsableId: users.get("dorik.fer-noir")!.id,
          statut: "en_cours",
        },
        {
          intitule: "Ouvrir un comptoir permanent à Blancherive",
          description: "Négocier un emplacement et un droit de vente auprès de la cour.",
          echeance: dansJours(60),
          avancement: 15,
          responsableId: users.get("berit.mainsure")!.id,
          statut: "en_cours",
        },
      ],
    });

    await prisma.contract.createMany({
      data: [
        {
          titre: "Fourniture d'armures — Compagnie du Loup Gris",
          parties: "Maison Givrelune ↔ Compagnie du Loup Gris",
          objet: "Fourniture de quatre armures d'acier complètes.",
          clauses:
            "Acompte de 25 % à la commande. Solde à la livraison. Pénalité de 5 % par semaine de retard imputable à la Maison.",
          contrepartie: "3 600 Septims",
          montant: 3600,
          dateSignature: jours(12),
          echeance: dansJours(11),
          signeParId: users.get("nicolas.varian")!.id,
          statut: "signe",
        },
        {
          titre: "Droit d'exploitation du filon de la Combe Grise",
          parties: "Maison Givrelune ↔ Cour de Blancherive",
          objet: "Exploitation exclusive du filon de fer pour une saison.",
          clauses: "Redevance de 10 % de la production brute versée à la cour.",
          contrepartie: "Redevance en nature",
          montant: 0,
          statut: "brouillon",
        },
      ],
    });
    await prisma.alliance.createMany({
      data: [
        {
          faction: "Compagnie du Loup Gris",
          nature: "Alliance martiale et commerciale",
          termes: "Appui militaire réciproque. Tarif préférentiel sur l'équipement forgé par la Maison.",
          date: jours(60),
          referentId: users.get("ulfr.brise-ecu")!.id,
          statut: "active",
        },
        {
          faction: "Guilde des Marchands de Vendeaume",
          nature: "Accord de comptoir",
          termes: "Accès au comptoir, commission de 8 % sur les ventes réalisées.",
          date: jours(35),
          referentId: users.get("berit.mainsure")!.id,
          statut: "pressentie",
        },
      ],
    });
    await prisma.correspondence.createMany({
      data: [
        {
          expediteur: "Cour de Blancherive",
          destinataire: "Maison Givrelune",
          date: jours(20),
          objet: "Commande de tenues pour le banquet",
          contenu:
            "La cour souhaite deux tenues nobles aux armes de Blancherive pour le banquet de la nouvelle lune. Le prix proposé est de 2 400 Septims, moitié à la commande.",
          statut: "recue",
          authorId: users.get("halvar.sombrepierre")!.id,
        },
        {
          expediteur: "Maison Givrelune",
          destinataire: "Compagnie du Loup Gris",
          date: jours(3),
          objet: "Rappel du solde dû",
          contenu:
            "Le quartier-maître est prié de bien vouloir régler le solde de 2 700 Septims avant la livraison des armures.",
          statut: "envoyee",
          authorId: users.get("berit.mainsure")!.id,
        },
      ],
    });
    console.log("  ❖ Opérations & diplomatie");
  }

  // ── Vie de la Maison ───────────────────────────────────────
  if (AVEC_DEMO && (await prisma.announcement.count()) === 0) {
    await prisma.announcement.createMany({
      data: [
        {
          titre: "Ouverture du Hub de la Maison",
          contenu:
            "Le registre de la Maison est désormais tenu ici. Stocks, permis, commandes et cours du marché y sont consignés. Le Discord reste notre place forte : ce hub ne le remplace pas, il le décharge de ce qu'il fait mal.\n\nChaque membre est tenu de vérifier son stash et de relever les prix qu'il constate.",
          auteurId: users.get("nicolas.varian")!.id,
          epingle: true,
          createdAt: jours(2),
        },
        {
          titre: "Appel aux mineurs — filon de la Combe Grise",
          contenu:
            "La Maison a besoin de 200 unités de minerai de fer sous quinzaine pour honorer la commande du Loup Gris. Les permis de récolte sont délivrés par le Garde-Chasse. Le versement aux communs est rémunéré au cours du marché.",
          auteurId: users.get("dorik.fer-noir")!.id,
          branchId: branches.get("artisanat")!.id,
          createdAt: jours(6),
        },
        {
          titre: "Rappel du règlement — biens communs",
          contenu:
            "Tout prélèvement sur les stocks communs doit être consigné au registre, quel que soit le rang de celui qui prend. Servir aux communs sans l'inscrire est un vol. Le Sénéchal veille.",
          auteurId: users.get("halvar.sombrepierre")!.id,
          createdAt: jours(15),
        },
      ],
    });

    const ev1 = await prisma.event.create({
      data: {
        titre: "Conseil des Patriarches",
        description: "Point sur la trésorerie, les alliances et l'admission des nouveaux membres.",
        date: dansJours(4),
        heure: "21:00",
        heureRdv: "20:45",
        lieu: "Salle du Conseil",
        createdById: users.get("nicolas.varian")!.id,
      },
    });
    await prisma.event.createMany({
      data: [
        {
          titre: "Grande patrouille de la Ramure",
          description: "Ratissage des cols du nord avant les neiges. Tous les Gardes-Chasse sont attendus.",
          date: dansJours(8),
          heure: "20:00",
          heureRdv: "19:30",
          lieu: "Poste de la Ramure",
          createdById: users.get("taga.duriff")!.id,
        },
        {
          titre: "Banquet de la nouvelle lune",
          description: "Cérémonie d'accueil des nouveaux membres et remise des tenues de la cour.",
          date: dansJours(16),
          heure: "21:00",
          heureRdv: "20:30",
          lieu: "Grande Salle",
          createdById: users.get("nicolas.varian")!.id,
        },
      ],
    });
    for (const login of ["taga.duriff", "ulfr.brise-ecu", "berit.mainsure", "halvar.sombrepierre"]) {
      await prisma.eventRSVP.create({
        data: { eventId: ev1.id, userId: users.get(login)!.id, reponse: "present" },
      });
    }

    await prisma.attendance.createMany({
      data: [
        {
          userId: users.get("torvald.cadet")!.id,
          type: "absence",
          dateDebut: dansJours(3),
          dateFin: dansJours(10),
          motif: "Affaires familiales à Faillaise.",
          statut: "declaree",
        },
        {
          userId: users.get("nerien.vals")!.id,
          type: "absence",
          dateDebut: jours(12),
          dateFin: jours(5),
          motif: "Expédition de cueillette prolongée.",
          statut: "validee",
        },
      ],
    });
    console.log("  ❖ Annonces, calendrier, absences");
  }

  // ── Gouvernance ────────────────────────────────────────────
  if (AVEC_DEMO && (await prisma.roleRequest.count()) === 0) {
    await prisma.roleRequest.createMany({
      data: [
        {
          nomRp: "Bjarke Fend-la-Brume",
          discordTag: "bjarke",
          rangSouhaite: "fils",
          gradeSouhaite: "Pisteur",
          branche: "Garde-Chasse",
          cercle: "La Grande Ramure",
          metiers: "Chasseur, Pêcheur",
          presentePar: "Taga Duriff",
          message:
            "Je chasse dans ces bois depuis dix hivers. Je ne demande pas de titre, seulement de servir. Présenté aux Patriarches par Taga Duriff.",
          statut: "en_attente",
          createdAt: jours(3),
        },
        {
          nomRp: "Lysenne Doigts-d'Argent",
          discordTag: "lysenne",
          rangSouhaite: "fils",
          gradeSouhaite: "Apprenti",
          branche: "Artisanat",
          metiers: "Bijoutier",
          presentePar: "Sylvienne Aubelune",
          message:
            "Formée à la joaillerie à Solitude. J'aimerais servir l'atelier de la Maison et apprendre le sertissage des gemmes.",
          statut: "en_attente",
          createdAt: jours(1),
        },
      ],
    });
    await prisma.ticket.create({
      data: {
        titre: "Accès au registre des stocks",
        categorie: "acces",
        contenu:
          "Je ne parviens pas à consigner ce que je verse aux communs. Puis-je obtenir le droit d'écriture sur le stock commun ?",
        auteurId: users.get("grumm")!.id,
        assigneId: users.get("halvar.sombrepierre")!.id,
        statut: "ouvert",
        createdAt: jours(2),
      },
    });
    console.log("  ❖ Demandes de rôle & tickets");
  }

  // ── Pages institutionnelles ────────────────────────────────
  for (const page of [
    { key: "reglement", titre: "Règlement de la Maison", contenu: REGLEMENT },
    { key: "histoire", titre: "Histoire de la Maison", contenu: HISTOIRE },
  ]) {
    await prisma.sitePage.upsert({
      where: { key: page.key },
      update: page,
      create: page,
    });
  }

  if (!AVEC_DEMO) {
    console.log("  ❖ Compteurs à zéro : ni prix, ni stock, ni coffre garni.");
    console.log("     (npm run db:demo pour charger un jeu de démonstration)");
  }
  console.log("❖ La Maison est prête. Nés sans titre, élevés par nos actes.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
