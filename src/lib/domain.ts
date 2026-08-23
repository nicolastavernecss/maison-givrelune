/**
 * Vocabulaire de la Maison Givrelune.
 * Source unique pour les statuts, libellés et clés de permission,
 * partagée entre le seed, les serveurs d'action et l'interface.
 */

export const MAISON = {
  nom: "Maison Givrelune",
  devise: "Nés sans titre, élevés par nos actes.",
  valeurs: ["Honneur", "Loyauté", "Mérite"] as const,
  monnaie: "Septim",
  monnaiePluriel: "Septims",
  serveur: "Keizaal Online",
  fondateurs: ["Nicolas Imperium Varian"] as const,
  citations: [
    "Le givre forge notre patience. La lune éclaire notre destinée. Nos actes écriront notre nom.",
    "Chez Givrelune, le rang ne se reçoit pas par la naissance. Les actes forgent le nom.",
  ] as const,
};

// ─── Permissions ─────────────────────────────────────────────

export const PERMISSIONS = {
  // Administration
  ADMIN_FULL: "admin.full",
  ADMIN_MEMBERS: "admin.members",
  ADMIN_ROLES: "admin.roles",
  ADMIN_SANCTIONS: "admin.sanctions",
  AUDIT_READ: "audit.read",
  ARCHIVES_READ: "archives.read",

  // Registres

  PATROL_READ: "patrols.read",
  PATROL_CREATE: "patrols.create",
  PATROL_VALIDATE: "patrols.validate",

  HARVEST_READ: "harvest_permits.read",
  HARVEST_CREATE: "harvest_permits.create",
  HARVEST_VALIDATE: "harvest_permits.validate",

  // Opérations
  MISSION_READ: "missions.read",
  MISSION_CREATE: "missions.create",
  MISSION_VALIDATE: "missions.validate",
  OBJECTIVE_READ: "objectives.read",
  OBJECTIVE_CREATE: "objectives.create",
  OBJECTIVE_VALIDATE: "objectives.validate",
  REPORT_READ: "reports.read",
  REPORT_CREATE: "reports.create",
  REPORT_VALIDATE: "reports.validate",

  // Diplomatie
  CONTRACT_READ: "contracts.read",
  CONTRACT_CREATE: "contracts.create",
  CONTRACT_SIGN: "contracts.sign",
  ALLIANCE_READ: "alliances.read",
  ALLIANCE_CREATE: "alliances.create",
  ALLIANCE_VALIDATE: "alliances.validate",
  CORRESPONDENCE_READ: "correspondences.read",
  CORRESPONDENCE_CREATE: "correspondences.create",

  // Économie
  MATERIAL_READ: "materials.read",
  MATERIAL_MANAGE: "materials.manage",
  MARKET_READ: "market.read",
  MARKET_CREATE: "market.create",
  MARKET_MANAGE: "market.manage",
  INVENTORY_OWN: "inventory.own",
  INVENTORY_HOUSE_READ: "inventory.house.read",
  INVENTORY_HOUSE_MANAGE: "inventory.house.manage",
  RECIPE_READ: "recipes.read",
  RECIPE_MANAGE: "recipes.manage",
  ORDER_READ: "craft_orders.read",
  ORDER_CREATE: "craft_orders.create",
  ORDER_VALIDATE: "craft_orders.validate",
  TRADE_READ: "trades.read",
  TRADE_CREATE: "trades.create",
  TRADE_VALIDATE: "trades.validate",
  TREASURY_READ: "treasury.read",
  TREASURY_MANAGE: "treasury.manage",

  // Vie de la Maison
  ANNOUNCEMENT_READ: "announcements.read",
  ANNOUNCEMENT_CREATE: "announcements.create",
  EVENT_READ: "events.read",
  EVENT_CREATE: "events.create",
  ATTENDANCE_READ: "attendance.read",
  ATTENDANCE_CREATE: "attendance.create",
  ATTENDANCE_VALIDATE: "attendance.validate",

  // Gouvernance
  ROLE_REQUEST_READ: "role_requests.read",
  ROLE_REQUEST_REVIEW: "role_requests.review",
  ROLE_REQUEST_APPROVE: "role_requests.approve",
  TICKET_READ: "tickets.read",
  TICKET_CREATE: "tickets.create",
  TICKET_MANAGE: "tickets.manage",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_CATALOG: {
  key: string;
  label: string;
  category: string;
}[] = [
  { key: PERMISSIONS.ADMIN_FULL, label: "Administration totale", category: "Administration" },
  { key: PERMISSIONS.ADMIN_MEMBERS, label: "Gérer les membres", category: "Administration" },
  { key: PERMISSIONS.ADMIN_ROLES, label: "Attribuer rangs & rôles", category: "Administration" },
  { key: PERMISSIONS.ADMIN_SANCTIONS, label: "Prononcer des sanctions", category: "Administration" },
  { key: PERMISSIONS.AUDIT_READ, label: "Consulter le journal d'audit", category: "Administration" },
  { key: PERMISSIONS.ARCHIVES_READ, label: "Consulter les archives", category: "Administration" },

  { key: PERMISSIONS.PATROL_READ, label: "Lire les patrouilles", category: "Registres" },
  { key: PERMISSIONS.PATROL_CREATE, label: "Planifier une patrouille", category: "Registres" },
  { key: PERMISSIONS.PATROL_VALIDATE, label: "Valider une patrouille", category: "Registres" },
  { key: PERMISSIONS.HARVEST_READ, label: "Lire les permis de récolte", category: "Registres" },
  { key: PERMISSIONS.HARVEST_CREATE, label: "Demander un permis de récolte", category: "Registres" },
  { key: PERMISSIONS.HARVEST_VALIDATE, label: "Délivrer un permis de récolte", category: "Registres" },

  { key: PERMISSIONS.MISSION_READ, label: "Lire les missions", category: "Opérations" },
  { key: PERMISSIONS.MISSION_CREATE, label: "Créer une mission", category: "Opérations" },
  { key: PERMISSIONS.MISSION_VALIDATE, label: "Autoriser une mission", category: "Opérations" },
  { key: PERMISSIONS.OBJECTIVE_READ, label: "Lire les objectifs", category: "Opérations" },
  { key: PERMISSIONS.OBJECTIVE_CREATE, label: "Créer un objectif", category: "Opérations" },
  { key: PERMISSIONS.OBJECTIVE_VALIDATE, label: "Clôturer un objectif", category: "Opérations" },
  { key: PERMISSIONS.REPORT_READ, label: "Lire les rapports", category: "Opérations" },
  { key: PERMISSIONS.REPORT_CREATE, label: "Déposer un rapport", category: "Opérations" },
  { key: PERMISSIONS.REPORT_VALIDATE, label: "Viser un rapport", category: "Opérations" },

  { key: PERMISSIONS.CONTRACT_READ, label: "Lire les contrats", category: "Diplomatie" },
  { key: PERMISSIONS.CONTRACT_CREATE, label: "Rédiger un contrat", category: "Diplomatie" },
  { key: PERMISSIONS.CONTRACT_SIGN, label: "Signer un contrat", category: "Diplomatie" },
  { key: PERMISSIONS.ALLIANCE_READ, label: "Lire les alliances", category: "Diplomatie" },
  { key: PERMISSIONS.ALLIANCE_CREATE, label: "Déclarer une alliance", category: "Diplomatie" },
  { key: PERMISSIONS.ALLIANCE_VALIDATE, label: "Sceller une alliance", category: "Diplomatie" },
  { key: PERMISSIONS.CORRESPONDENCE_READ, label: "Lire la boîte-aux-lettres", category: "Diplomatie" },
  { key: PERMISSIONS.CORRESPONDENCE_CREATE, label: "Consigner un courrier", category: "Diplomatie" },

  { key: PERMISSIONS.MATERIAL_READ, label: "Consulter le référentiel des matières", category: "Économie" },
  { key: PERMISSIONS.MATERIAL_MANAGE, label: "Éditer le référentiel des matières", category: "Économie" },
  { key: PERMISSIONS.MARKET_READ, label: "Consulter le cours du marché", category: "Économie" },
  { key: PERMISSIONS.MARKET_CREATE, label: "Relever un prix", category: "Économie" },
  { key: PERMISSIONS.MARKET_MANAGE, label: "Corriger / supprimer un relevé", category: "Économie" },
  { key: PERMISSIONS.INVENTORY_OWN, label: "Tenir son propre stash", category: "Économie" },
  { key: PERMISSIONS.INVENTORY_HOUSE_READ, label: "Consulter le stock commun", category: "Économie" },
  { key: PERMISSIONS.INVENTORY_HOUSE_MANAGE, label: "Modifier le stock commun", category: "Économie" },
  { key: PERMISSIONS.RECIPE_READ, label: "Consulter les recettes", category: "Économie" },
  { key: PERMISSIONS.RECIPE_MANAGE, label: "Éditer les recettes d'un atelier", category: "Économie" },
  { key: PERMISSIONS.ORDER_READ, label: "Lire les commandes", category: "Économie" },
  { key: PERMISSIONS.ORDER_CREATE, label: "Enregistrer une commande", category: "Économie" },
  { key: PERMISSIONS.ORDER_VALIDATE, label: "Clôturer / encaisser une commande", category: "Économie" },
  { key: PERMISSIONS.TRADE_READ, label: "Lire le registre de commerce", category: "Économie" },
  { key: PERMISSIONS.TRADE_CREATE, label: "Enregistrer une opération de commerce", category: "Économie" },
  { key: PERMISSIONS.TRADE_VALIDATE, label: "Conclure une opération de commerce", category: "Économie" },
  { key: PERMISSIONS.TREASURY_READ, label: "Consulter la trésorerie", category: "Économie" },
  { key: PERMISSIONS.TREASURY_MANAGE, label: "Mouvementer la trésorerie", category: "Économie" },

  { key: PERMISSIONS.ANNOUNCEMENT_READ, label: "Lire les annonces", category: "Vie de la Maison" },
  { key: PERMISSIONS.ANNOUNCEMENT_CREATE, label: "Publier une annonce", category: "Vie de la Maison" },
  { key: PERMISSIONS.EVENT_READ, label: "Consulter le calendrier", category: "Vie de la Maison" },
  { key: PERMISSIONS.EVENT_CREATE, label: "Organiser un événement", category: "Vie de la Maison" },
  { key: PERMISSIONS.ATTENDANCE_READ, label: "Consulter les absences", category: "Vie de la Maison" },
  { key: PERMISSIONS.ATTENDANCE_CREATE, label: "Déclarer une absence", category: "Vie de la Maison" },
  { key: PERMISSIONS.ATTENDANCE_VALIDATE, label: "Valider une absence", category: "Vie de la Maison" },

  { key: PERMISSIONS.ROLE_REQUEST_READ, label: "Lire les demandes de rôle", category: "Gouvernance" },
  { key: PERMISSIONS.ROLE_REQUEST_REVIEW, label: "Examiner une demande de rôle", category: "Gouvernance" },
  { key: PERMISSIONS.ROLE_REQUEST_APPROVE, label: "Valider une demande de rôle", category: "Gouvernance" },
  { key: PERMISSIONS.TICKET_READ, label: "Lire les tickets", category: "Gouvernance" },
  { key: PERMISSIONS.TICKET_CREATE, label: "Ouvrir un ticket", category: "Gouvernance" },
  { key: PERMISSIONS.TICKET_MANAGE, label: "Traiter les tickets", category: "Gouvernance" },
];

// ─── Statuts ────────────────────────────────────────────────

export type StatusTone = "neutre" | "attente" | "actif" | "succes" | "alerte" | "danger";

export interface StatusDef {
  value: string;
  label: string;
  tone: StatusTone;
}

const s = (value: string, label: string, tone: StatusTone): StatusDef => ({ value, label, tone });

export const STATUSES = {
  membre: [
    s("actif", "Actif", "succes"),
    s("essai", "Période d'essai", "attente"),
    s("archive", "Archivé", "neutre"),
  ],
  patrouille: [
    s("planifiee", "Planifiée", "attente"),
    s("effectuee", "Effectuée", "succes"),
    s("annulee", "Annulée", "neutre"),
  ],
  permis: [
    s("en_attente", "En attente", "attente"),
    s("accorde", "Accordé", "succes"),
    s("refuse", "Refusé", "danger"),
    s("expire", "Expiré", "neutre"),
  ],
  commande: [
    s("en_attente", "En attente", "attente"),
    s("en_fabrication", "En fabrication", "actif"),
    s("prete", "Prête", "succes"),
    s("livree", "Livrée", "neutre"),
    s("annulee", "Annulée", "danger"),
  ],
  commerce: [
    s("propose", "Proposé", "attente"),
    s("negocie", "En négociation", "actif"),
    s("conclu", "Conclu", "succes"),
    s("annule", "Annulé", "danger"),
  ],
  contrat: [
    s("brouillon", "Brouillon", "attente"),
    s("signe", "Signé", "succes"),
    s("rompu", "Rompu", "danger"),
    s("expire", "Expiré", "neutre"),
  ],
  alliance: [
    s("pressentie", "Pressentie", "attente"),
    s("active", "Active", "succes"),
    s("suspendue", "Suspendue", "alerte"),
    s("rompue", "Rompue", "danger"),
  ],
  correspondance: [
    s("recue", "Reçue", "actif"),
    s("envoyee", "Envoyée", "succes"),
    s("brouillon", "Brouillon", "attente"),
  ],
  mission: [
    s("planifiee", "Planifiée", "attente"),
    s("en_cours", "En cours", "actif"),
    s("reussie", "Réussie", "succes"),
    s("echouee", "Échouée", "danger"),
  ],
  objectif: [
    s("en_cours", "En cours", "actif"),
    s("atteint", "Atteint", "succes"),
    s("abandonne", "Abandonné", "neutre"),
  ],
  rapport: [
    s("depose", "Déposé", "attente"),
    s("vise", "Visé", "succes"),
    s("classe", "Classé", "neutre"),
  ],
  demande: [
    s("en_attente", "En attente", "attente"),
    s("examinee", "Examinée", "actif"),
    s("acceptee", "Acceptée", "succes"),
    s("refusee", "Refusée", "danger"),
  ],
  sanction: [
    s("active", "Active", "danger"),
    s("levee", "Levée", "succes"),
    s("expiree", "Expirée", "neutre"),
  ],
  ticket: [
    s("ouvert", "Ouvert", "attente"),
    s("en_cours", "En cours", "actif"),
    s("resolu", "Résolu", "succes"),
    s("ferme", "Fermé", "neutre"),
  ],
  absence: [
    s("declaree", "Déclarée", "attente"),
    s("validee", "Validée", "succes"),
    s("refusee", "Refusée", "danger"),
  ],
  evenement: [
    s("planifie", "Planifié", "attente"),
    s("passe", "Passé", "neutre"),
    s("annule", "Annulé", "danger"),
  ],
} satisfies Record<string, StatusDef[]>;

export type StatusFamily = keyof typeof STATUSES;

export function statusDef(family: StatusFamily, value: string): StatusDef {
  return (
    STATUSES[family].find((d) => d.value === value) ?? {
      value,
      label: value,
      tone: "neutre" as StatusTone,
    }
  );
}

// ─── Autres nomenclatures ────────────────────────────────────

export const MATERIAL_CATEGORIES = [
  "Minerais & Métaux",
  "Bois",
  "Peaux & Cuir",
  "Tissus",
  "Alchimie",
  "Nourriture",
  "Gemmes & Âmes",
  "Produits finis",
] as const;

export const MATERIAL_STATES: Record<string, string> = {
  brut: "Brut",
  minerai: "Minerai",
  lingot: "Lingot",
  raffine: "Raffiné",
  transforme: "Transformé",
  fini: "Produit fini",
};

export const METIER_NIVEAUX = [
  { value: "apprenti", label: "Apprenti" },
  { value: "compagnon", label: "Compagnon" },
  { value: "artisan", label: "Artisan" },
  { value: "maitre", label: "Maître" },
];

export const HARVEST_CATEGORIES = ["plantes", "minerais", "bois", "champignons", "autre"];
export const PATROL_TYPES = ["routes", "frontieres", "traque", "autre"];
export const SANCTION_TYPES = [
  { value: "avertissement", label: "Avertissement" },
  { value: "retrogradation", label: "Rétrogradation" },
  { value: "exclusion_temporaire", label: "Exclusion temporaire" },
  { value: "bannissement", label: "Bannissement" },
];

/// Marge conseillée par défaut appliquée au coût de fabrication.
export const DEFAULT_MARGIN = 0.4;

// ─── Taxe d'atelier ──────────────────────────────────────────

/**
 * Part prélevée par la Maison sur chaque fabrication, versée au coffre.
 * Le taux appliqué est figé dans chaque ligne de production : le modifier
 * ici ne réécrit pas l'historique, il ne vaut que pour la suite.
 */
export const TAUX_TAXE = 0.35;

// ─── Prise de poste ──────────────────────────────────────────

/**
 * Un poste ouvert depuis plus longtemps que cela est considéré comme oublié :
 * le membre a fermé le navigateur sans se déclarer parti.
 */
export const DUREE_MAX_POSTE_H = 8;

export const ETATS_POSTE = [
  {
    value: "disponible",
    label: "Disponible",
    tone: "succes" as StatusTone,
    icone: "valider",
    aide: "En jeu, prêt à être appelé sur une patrouille ou une commande.",
  },
  {
    value: "en_patrouille",
    label: "En patrouille",
    tone: "actif" as StatusTone,
    icone: "patrouille",
    aide: "Déjà engagé sur une ronde ou une mission.",
  },
  {
    value: "occupe",
    label: "Occupé",
    tone: "attente" as StatusTone,
    icone: "horloge",
    aide: "En jeu, mais pris par autre chose. À ne pas déranger.",
  },
];

export function etatPoste(valeur: string) {
  return ETATS_POSTE.find((e) => e.value === valeur) ?? ETATS_POSTE[0];
}
