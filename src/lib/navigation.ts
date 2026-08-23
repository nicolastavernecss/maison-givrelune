import { PERMISSIONS as P } from "./domain";

export type Entree = {
  href: string;
  label: string;
  icone: string;
  /** Permission requise pour voir l'entrée. Vide = tous les membres. */
  droit?: string;
  /** Clé du compteur de rappel calculé par la coquille applicative. */
  pastille?: "impayes" | "demandes" | "permisAttente" | "tickets" | "patrouilles";
  exact?: boolean;
};

export type Section = { titre: string; entrees: Entree[] };

export const NAVIGATION: Section[] = [
  {
    titre: "",
    entrees: [{ href: "/tableau-de-bord", label: "Tableau de bord", icone: "tableau", exact: true }],
  },
  {
    titre: "La Maison",
    entrees: [
      { href: "/annuaire", label: "Annuaire", icone: "membres" },
      { href: "/organigramme", label: "Organigramme", icone: "organigramme" },
      { href: "/annonces", label: "Annonces", icone: "annonce", droit: P.ANNOUNCEMENT_READ },
      { href: "/calendrier", label: "Calendrier", icone: "calendrier", droit: P.EVENT_READ },
      { href: "/presence", label: "Présence & absences", icone: "presence", droit: P.ATTENDANCE_READ },
      { href: "/histoire", label: "Histoire", icone: "histoire" },
      { href: "/reglement", label: "Règlement", icone: "reglement" },
    ],
  },
  {
    titre: "Registres",
    entrees: [
      { href: "/registres/patrouilles", label: "Patrouilles", icone: "patrouille", droit: P.PATROL_READ, pastille: "patrouilles" },
      { href: "/registres/permis-de-recolte", label: "Permis de récolte", icone: "permis", droit: P.HARVEST_READ, pastille: "permisAttente" },
    ],
  },
  {
    titre: "Économie",
    entrees: [
      { href: "/economie/cours-du-marche", label: "Cours du marché", icone: "marche", droit: P.MARKET_READ },
      { href: "/economie/matieres", label: "Matières", icone: "matiere", droit: P.MATERIAL_READ },
      { href: "/economie/stocks", label: "Stock commun", icone: "stock", droit: P.INVENTORY_HOUSE_READ },
      { href: "/economie/mon-stash", label: "Mon stash", icone: "stash", droit: P.INVENTORY_OWN },
      { href: "/economie/craft", label: "Craft", icone: "atelier", droit: P.RECIPE_READ },
      { href: "/economie/ateliers", label: "Recettes & coûts", icone: "recette", droit: P.RECIPE_READ },
      { href: "/economie/commandes", label: "Commandes", icone: "commande", droit: P.ORDER_READ },
      { href: "/economie/impayes", label: "Impayés", icone: "impaye", droit: P.ORDER_READ, pastille: "impayes" },
      { href: "/economie/commerce", label: "Commerce", icone: "commerce", droit: P.TRADE_READ },
      { href: "/economie/tresorerie", label: "Trésorerie", icone: "tresorerie", droit: P.TREASURY_READ },
    ],
  },
  {
    titre: "Opérations",
    entrees: [
      { href: "/operations/missions", label: "Missions", icone: "mission", droit: P.MISSION_READ },
      { href: "/operations/objectifs", label: "Objectifs", icone: "objectif", droit: P.OBJECTIVE_READ },
      { href: "/operations/rapports", label: "Rapports", icone: "rapport", droit: P.REPORT_READ },
    ],
  },
  {
    titre: "Diplomatie",
    entrees: [
      { href: "/diplomatie/contrats", label: "Contrats", icone: "contrat", droit: P.CONTRACT_READ },
      { href: "/diplomatie/alliances", label: "Alliances", icone: "alliance", droit: P.ALLIANCE_READ },
      { href: "/diplomatie/correspondances", label: "Boîte-aux-lettres", icone: "courrier", droit: P.CORRESPONDENCE_READ },
    ],
  },
  {
    titre: "Gouvernance",
    entrees: [
      { href: "/gouvernance/demandes", label: "Demandes de rôle", icone: "demande", droit: P.ROLE_REQUEST_READ, pastille: "demandes" },
      { href: "/gouvernance/membres", label: "Membres & rôles", icone: "parametres", droit: P.ADMIN_MEMBERS },
      { href: "/gouvernance/sanctions", label: "Sanctions", icone: "sanction", droit: P.ADMIN_SANCTIONS },
      { href: "/gouvernance/tickets", label: "Tickets", icone: "ticket", droit: P.TICKET_READ, pastille: "tickets" },
      { href: "/gouvernance/archives", label: "Archives", icone: "archive", droit: P.ARCHIVES_READ },
      { href: "/gouvernance/journal", label: "Journal d'audit", icone: "audit", droit: P.AUDIT_READ },
    ],
  },
];

export type Compteurs = Partial<Record<NonNullable<Entree["pastille"]>, number>>;
