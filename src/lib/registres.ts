import type { ReactNode } from "react";
import { HARVEST_CATEGORIES, PATROL_TYPES, PERMISSIONS as P, STATUSES, type StatusFamily } from "./domain";

/**
 * Moteur de registres.
 *
 * Le cahier des charges décrit un patron commun à tous les registres :
 * liste filtrable + formulaire + statut + validation par un gradé +
 * horodatage + auteur. Plutôt que de le réécrire dix fois, chaque registre
 * est décrit ici et l'interface est engendrée à partir de cette description.
 * Ajouter un registre = ajouter une entrée dans REGISTRES.
 */

export type TypeChamp =
  | "texte"
  | "zone"
  | "nombre"
  | "septims"
  | "pourcentage"
  | "date"
  | "heure"
  | "select"
  | "checkbox"
  | "membre"
  | "materiau"
  | "metier"
  | "branche"
  | "cercle"
  | "mission";

export type ChampDef = {
  nom: string;
  label: string;
  type: TypeChamp;
  requis?: boolean;
  aide?: string;
  options?: { value: string; label: string }[];
  large?: boolean;
  section?: string;
  defaut?: string;
  min?: number;
  max?: number;
  /** Rempli automatiquement avec le membre connecté si laissé vide. */
  auteur?: boolean;
};

export type ColonneDef = {
  champ: string;
  entete: string;
  type?: "texte" | "date" | "nombre" | "septims" | "statut" | "relation" | "personnalise";
  relation?: string;
  sousChamp?: string;
  /** Champ texte utilisé quand la relation est vide (bénéficiaire extérieur à la Maison). */
  repli?: string;
  principal?: boolean;
  masquerMobile?: boolean;
  rendu?: (item: Record<string, unknown>) => ReactNode;
};

export type TransitionDef = {
  vers: string;
  label: string;
  icone: string;
  ton: "neutre" | "succes" | "danger";
  droit: string;
  /** Inscrit le membre connecté comme validateur et horodate. */
  marqueValideur?: boolean;
  /** N'apparaît que si le statut courant est dans cette liste. */
  depuis?: string[];
};

export type RegistreDef = {
  cle: string;
  chemin: string;
  modele: string;
  titre: string;
  singulier: string;
  surTitre: string;
  description: string;
  icone: string;
  famille: StatusFamily;
  champStatut: string;
  droits: { lire: string; creer: string; valider: string };
  champs: ChampDef[];
  colonnes: ColonneDef[];
  include?: Record<string, unknown>;
  tri?: Record<string, "asc" | "desc">;
  recherche: string[];
  filtres?: { nom: string; label: string; champ: string; options: { value: string; label: string }[] }[];
  transitions?: TransitionDef[];
  /** Champ recevant l'identifiant du validateur. */
  champValideur?: string;
  /** Champ recevant la date de validation. */
  champValideLe?: string;
  /**
   * Champ portant l'auteur de l'entrée. Sert à décider qui peut la corriger :
   * son auteur, ou quelqu'un qui a le droit de valider. Sans ce champ, seuls
   * les validateurs peuvent modifier.
   */
  champAuteur?: string;
};

const opts = (famille: StatusFamily) =>
  STATUSES[famille].map((s) => ({ value: s.value, label: s.label }));

const listeOpts = (valeurs: string[]) =>
  valeurs.map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, " ") }));

const membreRel = { select: { id: true, nomRp: true } };

export const REGISTRES: RegistreDef[] = [
  /* ═══ Garde-Chasse — patrouilles ══════════════════════════ */
  {
    cle: "patrouilles",
    champAuteur: "authorId",
    chemin: "/registres/patrouilles",
    modele: "patrol",
    titre: "Patrouilles",
    singulier: "patrouille",
    surTitre: "Branche Garde-Chasse",
    description:
      "Planification et compte rendu des rondes : routes, frontières et traques. Une patrouille effectuée doit être visée par un gradé.",
    icone: "patrouille",
    famille: "patrouille",
    champStatut: "statut",
    droits: { lire: P.PATROL_READ, creer: P.PATROL_CREATE, valider: P.PATROL_VALIDATE },
    tri: { date: "desc" },
    recherche: ["zone", "patrouilleurs", "incidents"],
    include: { circle: { select: { label: true } }, author: membreRel, validePar: membreRel },
    champValideur: "valideParId",
    champValideLe: "valideLe",
    champs: [
      { nom: "patrouilleurs", label: "Patrouilleur(s)", type: "texte", requis: true, large: true, section: "La ronde", aide: "Noms RP séparés par des virgules." },
      { nom: "circleId", label: "Cercle", type: "cercle", section: "La ronde" },
      { nom: "zone", label: "Zone / secteur", type: "texte", requis: true, section: "La ronde" },
      { nom: "type", label: "Type", type: "select", options: listeOpts(PATROL_TYPES), defaut: "routes", section: "La ronde" },
      { nom: "date", label: "Date", type: "date", requis: true, section: "Horaire" },
      { nom: "heureDebut", label: "Heure de début", type: "heure", section: "Horaire" },
      { nom: "heureFin", label: "Heure de fin", type: "heure", section: "Horaire" },
      { nom: "authorId", label: "Consignée par", type: "membre", auteur: true, section: "Horaire" },
      { nom: "incidents", label: "Incidents relevés", type: "zone", large: true, section: "Compte rendu" },
      { nom: "statut", label: "Statut", type: "select", options: opts("patrouille"), defaut: "planifiee", section: "Compte rendu" },
    ],
    colonnes: [
      { champ: "zone", entete: "Zone", principal: true },
      { champ: "patrouilleurs", entete: "Patrouilleurs" },
      { champ: "type", entete: "Type", masquerMobile: true },
      { champ: "date", entete: "Date", type: "date" },
      { champ: "circle", entete: "Cercle", type: "relation", relation: "circle", sousChamp: "label", masquerMobile: true },
      { champ: "validePar", entete: "Visée par", type: "relation", relation: "validePar", sousChamp: "nomRp", masquerMobile: true },
      { champ: "statut", entete: "Statut", type: "statut" },
    ],
    transitions: [
      { vers: "effectuee", label: "Viser", icone: "valider", ton: "succes", droit: P.PATROL_VALIDATE, marqueValideur: true, depuis: ["planifiee"] },
      { vers: "annulee", label: "Annuler", icone: "refuser", ton: "danger", droit: P.PATROL_VALIDATE, depuis: ["planifiee"] },
      { vers: "planifiee", label: "Rouvrir", icone: "retour", ton: "neutre", droit: P.PATROL_VALIDATE, depuis: ["annulee", "effectuee"] },
    ],
  },

  /* ═══ Garde-Chasse ↔ Artisanat — permis de récolte ════════ */
  {
    cle: "permis-de-recolte",
    champAuteur: "demandeurId",
    chemin: "/registres/permis-de-recolte",
    modele: "harvestPermit",
    titre: "Permis de récolte",
    singulier: "permis",
    surTitre: "Garde-Chasse ↔ Artisanat",
    description:
      "Toute récolte sur les terres de la Maison passe par un permis : ressource, quantité autorisée, zone et validité. Le Garde-Chasse délivre, l'artisan déclare ce qu'il a ramené.",
    icone: "permis",
    famille: "permis",
    champStatut: "statut",
    droits: { lire: P.HARVEST_READ, creer: P.HARVEST_CREATE, valider: P.HARVEST_VALIDATE },
    tri: { dateEmission: "desc" },
    recherche: ["ressource", "zone", "demandeurNom", "motif"],
    include: { demandeur: membreRel, delivrePar: membreRel, material: { select: { label: true, unit: true } } },
    champValideur: "delivreParId",
    champs: [
      { nom: "demandeurId", label: "Demandeur (membre)", type: "membre", auteur: true, section: "Demandeur" },
      { nom: "demandeurNom", label: "Demandeur extérieur", type: "texte", section: "Demandeur" },
      { nom: "categorie", label: "Catégorie", type: "select", options: listeOpts(HARVEST_CATEGORIES), requis: true, defaut: "plantes", section: "Ressource" },
      { nom: "materialId", label: "Matière du référentiel", type: "materiau", section: "Ressource", aide: "Rattache le permis au cours du marché et aux stocks." },
      { nom: "ressource", label: "Ressource précise", type: "texte", section: "Ressource", aide: "Ex. : minerai de fer — filon de la Combe Grise." },
      { nom: "quantiteAutorisee", label: "Quantité autorisée", type: "nombre", requis: true, min: 0, section: "Ressource" },
      { nom: "unite", label: "Unité", type: "texte", defaut: "unité", section: "Ressource" },
      { nom: "quantiteRecoltee", label: "Déjà récolté", type: "nombre", min: 0, defaut: "0", section: "Ressource", aide: "Déclaré par le récoltant, à reporter dans son stash." },
      { nom: "zone", label: "Zone autorisée", type: "texte", section: "Validité" },
      { nom: "dateEmission", label: "Date d'émission", type: "date", requis: true, section: "Validité" },
      { nom: "validiteJusquau", label: "Valide jusqu'au", type: "date", section: "Validité" },
      { nom: "delivreParId", label: "Délivré par", type: "membre", section: "Validité" },
      { nom: "statut", label: "Statut", type: "select", options: opts("permis"), defaut: "en_attente", section: "Validité" },
      { nom: "motif", label: "Motif de la demande", type: "zone", large: true, section: "Validité" },
    ],
    colonnes: [
      { champ: "ressource", entete: "Ressource", principal: true },
      { champ: "demandeur", entete: "Demandeur", type: "relation", relation: "demandeur", sousChamp: "nomRp", repli: "demandeurNom" },
      { champ: "categorie", entete: "Catégorie", masquerMobile: true },
      { champ: "zone", entete: "Zone", masquerMobile: true },
      { champ: "validiteJusquau", entete: "Valide jusqu'au", type: "date" },
      { champ: "delivrePar", entete: "Délivré par", type: "relation", relation: "delivrePar", sousChamp: "nomRp", masquerMobile: true },
      { champ: "statut", entete: "Statut", type: "statut" },
    ],
    transitions: [
      { vers: "accorde", label: "Accorder", icone: "valider", ton: "succes", droit: P.HARVEST_VALIDATE, marqueValideur: true, depuis: ["en_attente", "refuse"] },
      { vers: "refuse", label: "Refuser", icone: "refuser", ton: "danger", droit: P.HARVEST_VALIDATE, marqueValideur: true, depuis: ["en_attente"] },
      { vers: "expire", label: "Clore", icone: "horloge", ton: "neutre", droit: P.HARVEST_VALIDATE, depuis: ["accorde"] },
    ],
  },

  /* ═══ Opérations — missions ═══════════════════════════════ */
  {
    cle: "missions",
    chemin: "/operations/missions",
    modele: "mission",
    titre: "Missions",
    singulier: "mission",
    surTitre: "Opérations",
    description:
      "Escortes, reconnaissances, opérations armées. Aucune n'est engagée sans autorisation de la hiérarchie (règlement §V).",
    icone: "mission",
    famille: "mission",
    champStatut: "statut",
    droits: { lire: P.MISSION_READ, creer: P.MISSION_CREATE, valider: P.MISSION_VALIDATE },
    tri: { date: "desc" },
    recherche: ["titre", "objectif", "lieu", "assignes"],
    include: { branch: { select: { label: true } }, autorisePar: membreRel },
    champValideur: "autoriseParId",
    champs: [
      { nom: "titre", label: "Titre", type: "texte", requis: true, large: true, section: "La mission" },
      { nom: "branchId", label: "Branche", type: "branche", section: "La mission" },
      { nom: "assignes", label: "Assignés", type: "texte", section: "La mission", aide: "Noms RP séparés par des virgules." },
      { nom: "objectif", label: "Objectif", type: "zone", large: true, section: "La mission" },
      { nom: "date", label: "Date", type: "date", requis: true, section: "Cadre" },
      { nom: "lieu", label: "Lieu", type: "texte", section: "Cadre" },
      { nom: "autoriseParId", label: "Autorisée par", type: "membre", section: "Cadre" },
      { nom: "statut", label: "Statut", type: "select", options: opts("mission"), defaut: "planifiee", section: "Cadre" },
    ],
    colonnes: [
      { champ: "titre", entete: "Mission", principal: true },
      { champ: "branch", entete: "Branche", type: "relation", relation: "branch", sousChamp: "label" },
      { champ: "assignes", entete: "Assignés", masquerMobile: true },
      { champ: "lieu", entete: "Lieu", masquerMobile: true },
      { champ: "date", entete: "Date", type: "date" },
      { champ: "autorisePar", entete: "Autorisée par", type: "relation", relation: "autorisePar", sousChamp: "nomRp", masquerMobile: true },
      { champ: "statut", entete: "Statut", type: "statut" },
    ],
    transitions: [
      { vers: "en_cours", label: "Engager", icone: "valider", ton: "succes", droit: P.MISSION_VALIDATE, marqueValideur: true, depuis: ["planifiee"] },
      { vers: "reussie", label: "Réussie", icone: "valider", ton: "succes", droit: P.MISSION_VALIDATE, depuis: ["en_cours", "planifiee"] },
      { vers: "echouee", label: "Échouée", icone: "refuser", ton: "danger", droit: P.MISSION_VALIDATE, depuis: ["en_cours", "planifiee"] },
    ],
  },

  /* ═══ Opérations — objectifs ══════════════════════════════ */
  {
    cle: "objectifs",
    champAuteur: "responsableId",
    chemin: "/operations/objectifs",
    modele: "objective",
    titre: "Objectifs",
    singulier: "objectif",
    surTitre: "Opérations",
    description:
      "Ce que la Maison s'est engagée à atteindre, avec son échéance, son responsable et son avancement.",
    icone: "objectif",
    famille: "objectif",
    champStatut: "statut",
    droits: { lire: P.OBJECTIVE_READ, creer: P.OBJECTIVE_CREATE, valider: P.OBJECTIVE_VALIDATE },
    tri: { echeance: "asc" },
    recherche: ["intitule", "description"],
    include: { responsable: membreRel },
    champs: [
      { nom: "intitule", label: "Intitulé", type: "texte", requis: true, large: true, section: "L'objectif" },
      { nom: "description", label: "Description", type: "zone", large: true, section: "L'objectif" },
      { nom: "responsableId", label: "Responsable", type: "membre", auteur: true, section: "Suivi" },
      { nom: "echeance", label: "Échéance", type: "date", section: "Suivi" },
      { nom: "avancement", label: "Avancement", type: "pourcentage", defaut: "0", min: 0, max: 100, section: "Suivi" },
      { nom: "statut", label: "Statut", type: "select", options: opts("objectif"), defaut: "en_cours", section: "Suivi" },
    ],
    colonnes: [
      { champ: "intitule", entete: "Objectif", principal: true },
      { champ: "responsable", entete: "Responsable", type: "relation", relation: "responsable", sousChamp: "nomRp" },
      { champ: "echeance", entete: "Échéance", type: "date" },
      { champ: "avancement", entete: "Avancement", type: "personnalise" },
      { champ: "statut", entete: "Statut", type: "statut" },
    ],
    transitions: [
      { vers: "atteint", label: "Atteint", icone: "valider", ton: "succes", droit: P.OBJECTIVE_VALIDATE, depuis: ["en_cours"] },
      { vers: "abandonne", label: "Abandonner", icone: "refuser", ton: "danger", droit: P.OBJECTIVE_VALIDATE, depuis: ["en_cours"] },
      { vers: "en_cours", label: "Rouvrir", icone: "retour", ton: "neutre", droit: P.OBJECTIVE_VALIDATE, depuis: ["atteint", "abandonne"] },
    ],
  },

  /* ═══ Opérations — rapports ═══════════════════════════════ */
  {
    cle: "rapports",
    champAuteur: "auteurId",
    chemin: "/operations/rapports",
    modele: "report",
    titre: "Rapports",
    singulier: "rapport",
    surTitre: "Opérations",
    description:
      "Ce qui s'est réellement passé : résumé, pertes, butin et suites à donner. Un rapport visé fait foi devant le Conseil.",
    icone: "rapport",
    famille: "rapport",
    champStatut: "statut",
    droits: { lire: P.REPORT_READ, creer: P.REPORT_CREATE, valider: P.REPORT_VALIDATE },
    tri: { date: "desc" },
    recherche: ["titre", "resume", "butin", "suites"],
    include: { auteur: membreRel, mission: { select: { titre: true } } },
    champs: [
      { nom: "titre", label: "Titre", type: "texte", large: true, section: "Le rapport" },
      { nom: "auteurId", label: "Auteur", type: "membre", auteur: true, section: "Le rapport" },
      { nom: "missionId", label: "Mission liée", type: "mission", section: "Le rapport" },
      { nom: "date", label: "Date", type: "date", requis: true, section: "Le rapport" },
      { nom: "resume", label: "Résumé", type: "zone", requis: true, large: true, section: "Compte rendu" },
      { nom: "pertes", label: "Pertes", type: "zone", section: "Compte rendu" },
      { nom: "butin", label: "Butin", type: "zone", section: "Compte rendu" },
      { nom: "suites", label: "Suites à donner", type: "zone", large: true, section: "Compte rendu" },
      { nom: "statut", label: "Statut", type: "select", options: opts("rapport"), defaut: "depose", section: "Compte rendu" },
    ],
    colonnes: [
      { champ: "titre", entete: "Rapport", principal: true },
      { champ: "auteur", entete: "Auteur", type: "relation", relation: "auteur", sousChamp: "nomRp" },
      { champ: "mission", entete: "Mission", type: "relation", relation: "mission", sousChamp: "titre", masquerMobile: true },
      { champ: "date", entete: "Date", type: "date" },
      { champ: "statut", entete: "Statut", type: "statut" },
    ],
    transitions: [
      { vers: "vise", label: "Viser", icone: "valider", ton: "succes", droit: P.REPORT_VALIDATE, depuis: ["depose"] },
      { vers: "classe", label: "Classer", icone: "archive", ton: "neutre", droit: P.REPORT_VALIDATE, depuis: ["vise", "depose"] },
    ],
  },

  /* ═══ Diplomatie — contrats ═══════════════════════════════ */
  {
    cle: "contrats",
    chemin: "/diplomatie/contrats",
    modele: "contract",
    titre: "Contrats",
    singulier: "contrat",
    surTitre: "Diplomatie",
    description:
      "Engagements pris au nom de la Maison. La signature est réservée aux Patriarches et aux membres expressément autorisés (règlement §IV).",
    icone: "contrat",
    famille: "contrat",
    champStatut: "statut",
    droits: { lire: P.CONTRACT_READ, creer: P.CONTRACT_CREATE, valider: P.CONTRACT_SIGN },
    tri: { createdAt: "desc" },
    recherche: ["titre", "parties", "objet", "clauses"],
    include: { signePar: membreRel },
    champValideur: "signeParId",
    champs: [
      { nom: "titre", label: "Titre", type: "texte", requis: true, large: true, section: "Le contrat" },
      { nom: "parties", label: "Parties", type: "texte", requis: true, large: true, section: "Le contrat", aide: "Ex. : Maison Givrelune ↔ Compagnie du Loup Gris." },
      { nom: "objet", label: "Objet", type: "zone", large: true, section: "Le contrat" },
      { nom: "clauses", label: "Clauses", type: "zone", large: true, section: "Le contrat" },
      { nom: "contrepartie", label: "Contrepartie", type: "texte", section: "Termes" },
      { nom: "montant", label: "Montant", type: "septims", defaut: "0", section: "Termes" },
      { nom: "dateSignature", label: "Date de signature", type: "date", section: "Termes" },
      { nom: "echeance", label: "Échéance", type: "date", section: "Termes" },
      { nom: "signeParId", label: "Signé par", type: "membre", section: "Termes" },
      { nom: "statut", label: "Statut", type: "select", options: opts("contrat"), defaut: "brouillon", section: "Termes" },
    ],
    colonnes: [
      { champ: "titre", entete: "Contrat", principal: true },
      { champ: "parties", entete: "Parties" },
      { champ: "montant", entete: "Montant", type: "septims" },
      { champ: "dateSignature", entete: "Signé le", type: "date", masquerMobile: true },
      { champ: "echeance", entete: "Échéance", type: "date" },
      { champ: "signePar", entete: "Signé par", type: "relation", relation: "signePar", sousChamp: "nomRp", masquerMobile: true },
      { champ: "statut", entete: "Statut", type: "statut" },
    ],
    transitions: [
      { vers: "signe", label: "Signer", icone: "contrat", ton: "succes", droit: P.CONTRACT_SIGN, marqueValideur: true, depuis: ["brouillon"] },
      { vers: "rompu", label: "Rompre", icone: "refuser", ton: "danger", droit: P.CONTRACT_SIGN, depuis: ["signe"] },
      { vers: "expire", label: "Marquer expiré", icone: "horloge", ton: "neutre", droit: P.CONTRACT_SIGN, depuis: ["signe"] },
    ],
  },

  /* ═══ Diplomatie — alliances ══════════════════════════════ */
  {
    cle: "alliances",
    champAuteur: "referentId",
    chemin: "/diplomatie/alliances",
    modele: "alliance",
    titre: "Alliances",
    singulier: "alliance",
    surTitre: "Diplomatie",
    description: "Factions amies, nature du lien et termes convenus. Chaque alliance a un référent au sein de la Maison.",
    icone: "alliance",
    famille: "alliance",
    champStatut: "statut",
    droits: { lire: P.ALLIANCE_READ, creer: P.ALLIANCE_CREATE, valider: P.ALLIANCE_VALIDATE },
    tri: { date: "desc" },
    recherche: ["faction", "nature", "termes"],
    include: { referent: membreRel },
    champs: [
      { nom: "faction", label: "Faction alliée", type: "texte", requis: true, large: true, section: "L'alliance" },
      { nom: "nature", label: "Nature", type: "texte", large: true, section: "L'alliance", aide: "Ex. : alliance martiale, accord de comptoir." },
      { nom: "termes", label: "Termes", type: "zone", large: true, section: "L'alliance" },
      { nom: "date", label: "Date", type: "date", requis: true, section: "Suivi" },
      { nom: "referentId", label: "Référent", type: "membre", auteur: true, section: "Suivi" },
      { nom: "statut", label: "Statut", type: "select", options: opts("alliance"), defaut: "pressentie", section: "Suivi" },
    ],
    colonnes: [
      { champ: "faction", entete: "Faction", principal: true },
      { champ: "nature", entete: "Nature" },
      { champ: "date", entete: "Depuis", type: "date" },
      { champ: "referent", entete: "Référent", type: "relation", relation: "referent", sousChamp: "nomRp", masquerMobile: true },
      { champ: "statut", entete: "Statut", type: "statut" },
    ],
    transitions: [
      { vers: "active", label: "Sceller", icone: "alliance", ton: "succes", droit: P.ALLIANCE_VALIDATE, depuis: ["pressentie", "suspendue"] },
      { vers: "suspendue", label: "Suspendre", icone: "horloge", ton: "neutre", droit: P.ALLIANCE_VALIDATE, depuis: ["active"] },
      { vers: "rompue", label: "Rompre", icone: "refuser", ton: "danger", droit: P.ALLIANCE_VALIDATE, depuis: ["active", "suspendue"] },
    ],
  },

  /* ═══ Diplomatie — correspondances ════════════════════════ */
  {
    cle: "correspondances",
    champAuteur: "authorId",
    chemin: "/diplomatie/correspondances",
    modele: "correspondence",
    titre: "Boîte-aux-lettres",
    singulier: "courrier",
    surTitre: "Diplomatie",
    description:
      "Registre des courriers RP reçus et envoyés au nom de la Maison. Chaque pli est consigné avec son expéditeur et son objet.",
    icone: "courrier",
    famille: "correspondance",
    champStatut: "statut",
    droits: { lire: P.CORRESPONDENCE_READ, creer: P.CORRESPONDENCE_CREATE, valider: P.CORRESPONDENCE_CREATE },
    tri: { date: "desc" },
    recherche: ["expediteur", "destinataire", "objet", "contenu"],
    include: { author: membreRel, attachments: { select: { id: true, filename: true, mime: true } } },
    champs: [
      { nom: "expediteur", label: "Expéditeur", type: "texte", requis: true, section: "Le pli" },
      { nom: "destinataire", label: "Destinataire", type: "texte", requis: true, section: "Le pli" },
      { nom: "date", label: "Date", type: "date", requis: true, section: "Le pli" },
      { nom: "statut", label: "Sens", type: "select", options: opts("correspondance"), defaut: "recue", section: "Le pli" },
      { nom: "objet", label: "Objet", type: "texte", requis: true, large: true, section: "Contenu" },
      { nom: "contenu", label: "Contenu", type: "zone", large: true, section: "Contenu" },
      { nom: "authorId", label: "Consigné par", type: "membre", auteur: true, section: "Contenu" },
    ],
    colonnes: [
      { champ: "objet", entete: "Objet", principal: true },
      { champ: "expediteur", entete: "De" },
      { champ: "destinataire", entete: "À" },
      { champ: "date", entete: "Date", type: "date" },
      { champ: "statut", entete: "Sens", type: "statut" },
    ],
  },

  /* ═══ Économie — commerce ═════════════════════════════════ */
  {
    cle: "commerce",
    champAuteur: "negociateurId",
    chemin: "/economie/commerce",
    modele: "trade",
    titre: "Registre de commerce",
    singulier: "opération",
    surTitre: "Branche commerciale",
    description:
      "Achats, ventes et trocs conclus avec l'extérieur. Chaque opération porte le nom de son négociateur et son montant en Septims.",
    icone: "commerce",
    famille: "commerce",
    champStatut: "statut",
    droits: { lire: P.TRADE_READ, creer: P.TRADE_CREATE, valider: P.TRADE_VALIDATE },
    tri: { date: "desc" },
    recherche: ["partieExterne", "biens", "notes"],
    include: { negociateur: membreRel, craftOrder: { select: { id: true, objets: true } } },
    champs: [
      {
        nom: "type",
        label: "Type",
        type: "select",
        requis: true,
        defaut: "vente",
        options: [
          { value: "achat", label: "Achat" },
          { value: "vente", label: "Vente" },
          { value: "troc", label: "Troc" },
        ],
        section: "L'opération",
      },
      { nom: "partieExterne", label: "Partie externe", type: "texte", requis: true, section: "L'opération" },
      { nom: "biens", label: "Biens", type: "zone", requis: true, large: true, section: "L'opération" },
      { nom: "quantites", label: "Quantités", type: "texte", large: true, section: "L'opération" },
      { nom: "montant", label: "Montant", type: "septims", defaut: "0", section: "Termes" },
      { nom: "date", label: "Date", type: "date", requis: true, section: "Termes" },
      { nom: "negociateurId", label: "Négociateur", type: "membre", auteur: true, section: "Termes" },
      { nom: "statut", label: "Statut", type: "select", options: opts("commerce"), defaut: "propose", section: "Termes" },
      { nom: "notes", label: "Notes", type: "zone", large: true, section: "Termes" },
    ],
    colonnes: [
      { champ: "biens", entete: "Biens", principal: true },
      { champ: "type", entete: "Type" },
      { champ: "partieExterne", entete: "Partie externe" },
      { champ: "montant", entete: "Montant", type: "septims" },
      { champ: "date", entete: "Date", type: "date", masquerMobile: true },
      { champ: "negociateur", entete: "Négociateur", type: "relation", relation: "negociateur", sousChamp: "nomRp", masquerMobile: true },
      { champ: "statut", entete: "Statut", type: "statut" },
    ],
    transitions: [
      { vers: "negocie", label: "En négociation", icone: "commerce", ton: "neutre", droit: P.TRADE_CREATE, depuis: ["propose"] },
      { vers: "conclu", label: "Conclure", icone: "valider", ton: "succes", droit: P.TRADE_VALIDATE, depuis: ["propose", "negocie"] },
      { vers: "annule", label: "Annuler", icone: "refuser", ton: "danger", droit: P.TRADE_VALIDATE, depuis: ["propose", "negocie"] },
    ],
  },
];

export function registre(cle: string): RegistreDef | undefined {
  return REGISTRES.find((r) => r.cle === cle);
}
