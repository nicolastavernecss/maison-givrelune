import type { ReactNode } from "react";

/**
 * Jeu d'icônes de la Maison — tracé linéaire, 24×24, sans dépendance.
 * Une icône par branche, par fonction de Conseil et par métier,
 * pour que chaque espace se reconnaisse d'un coup d'œil.
 */

const T: Record<string, ReactNode> = {
  // ── Navigation
  accueil: <><path d="M3 10.4 12 3l9 7.4" /><path d="M5.6 9.2V21h12.8V9.2" /><path d="M9.8 21v-6.2h4.4V21" /></>,
  tableau: <><rect x="3" y="3" width="7.5" height="7.5" rx="1" /><rect x="13.5" y="3" width="7.5" height="5" rx="1" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1" /><rect x="13.5" y="11" width="7.5" height="10" rx="1" /></>,
  membres: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5.4 6-5.4s6 2.1 6 5.4" /><path d="M16.5 5.6a3 3 0 0 1 0 5.6" /><path d="M18 14.8c1.9.6 3 2.4 3 4.6" /></>,
  organigramme: <><rect x="9" y="2.5" width="6" height="4.5" rx="1" /><rect x="2.5" y="17" width="6" height="4.5" rx="1" /><rect x="15.5" y="17" width="6" height="4.5" rx="1" /><path d="M12 7v4.5M5.5 17v-3a1.5 1.5 0 0 1 1.5-1.5h10a1.5 1.5 0 0 1 1.5 1.5v3" /></>,
  registre: <><path d="M6.5 3h11a1.5 1.5 0 0 1 1.5 1.5V21l-3.2-2-3.3 2-3.3-2-3.2 2V4.5A1.5 1.5 0 0 1 6.5 3Z" /><path d="M9 8h6M9 12h6" /></>,
  passage: <><path d="M3 21V9.5L12 4l9 5.5V21" /><path d="M8 21v-6a4 4 0 0 1 8 0v6" /><path d="M2 21h20" /></>,
  patrouille: <><circle cx="12" cy="12" r="9" /><path d="M15.6 8.4 13.7 13.7 8.4 15.6l1.9-5.3z" /></>,
  permis: <><path d="M12 3a4 4 0 0 1 4 4c0 2-1.2 2.7-1.2 4.2h-5.6C9.2 9.7 8 9 8 7a4 4 0 0 1 4-4Z" /><path d="M8 13.2h8l1.6 3.3H6.4z" /><path d="M4 16.5h16V21H4z" /></>,

  // ── Économie
  matiere: <><path d="M12 2.8 20.5 7v10L12 21.2 3.5 17V7z" /><path d="M3.5 7 12 11.4 20.5 7M12 11.4V21.2" /></>,
  marche: <><path d="M3 3v18h18" /><path d="m6.5 14.5 3.5-4 3.2 2.6L20 6" /><path d="M16.4 6H20v3.6" /></>,
  stock: <><rect x="2.8" y="7" width="18.4" height="13" rx="1.4" /><path d="M2.8 11.4h18.4" /><path d="M9.6 7V4.6a1 1 0 0 1 1-1h2.8a1 1 0 0 1 1 1V7" /><path d="M10.8 15.2h2.4" /></>,
  stash: <><path d="M6.4 8h11.2l1.6 12.2H4.8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  atelier: <><path d="M3.5 9.5h17c0 3-2.4 4.6-5 5l1 5.5H8.5l1-5.5c-2.6-.4-6-2-6-5Z" /><path d="M6 9.5V7.2c0-1 .8-1.7 1.7-1.7h4.6" /></>,
  recette: <><path d="M3.5 5.2c2.6-1.4 5.5-1.4 8.5.3 3-1.7 5.9-1.7 8.5-.3v13c-2.6-1.4-5.5-1.4-8.5.3-3-1.7-5.9-1.7-8.5-.3z" /><path d="M12 5.5v13" /></>,
  commande: <><rect x="4.5" y="4" width="15" height="17" rx="1.5" /><path d="M9 4V2.8h6V4" /><path d="M8.5 10h7M8.5 14h7M8.5 18h4" /></>,
  impaye: <><circle cx="12" cy="12" r="9" /><path d="M12 7.2v6M12 16.4v.2" /></>,
  commerce: <><path d="M12 3v18M7 6.5h10" /><path d="M4 17a3.4 3.4 0 0 0 6.4 0L7.2 9.4z" /><path d="M13.6 15a3.4 3.4 0 0 0 6.4 0l-3.2-7.6z" /></>,
  tresorerie: <><rect x="2.8" y="4.5" width="18.4" height="15" rx="1.6" /><circle cx="12" cy="12" r="3.8" /><path d="M12 8.2V6M12 18v-2.2M15.8 12H18M6 12h2.2" /></>,
  septim: <><circle cx="12" cy="12" r="8.4" /><circle cx="12" cy="12" r="4.6" /><path d="M12 3.6v3M12 17.4v3M20.4 12h-3M6.6 12h-3" /></>,

  // ── Opérations
  mission: <><circle cx="12" cy="12" r="8.6" /><circle cx="12" cy="12" r="4.2" /><circle cx="12" cy="12" r="1" fill="currentColor" /></>,
  objectif: <><path d="M5 21V4.2h11.5l-1.8 3.4 1.8 3.4H5" /><path d="M5 3v18" /></>,
  rapport: <><path d="M6 2.8h8l4.4 4.4V21H6z" /><path d="M14 2.8v4.4h4.4" /><path d="M9 12.6h6M9 16.4h6" /></>,

  // ── Diplomatie
  contrat: <><path d="M6 2.8h8l4.4 4.4V21H6z" /><path d="M14 2.8v4.4h4.4" /><circle cx="12" cy="14.4" r="2.6" /><path d="M10.4 16.6 9.6 20l2.4-1.3 2.4 1.3-.8-3.4" /></>,
  alliance: <><path d="M3 11.5 7 8l3.4 2.6L14 8l3.4 2.6L21 8" /><path d="m7 8-4 4.6 4.4 4.2 2-2.2 2.6 2.2 2.6-2.2 2 2.2L21 12.6 17 8" /></>,
  courrier: <><rect x="2.6" y="5" width="18.8" height="14" rx="1.6" /><path d="m2.9 6.4 9.1 6.6 9.1-6.6" /></>,

  // ── Vie de la Maison
  annonce: <><path d="M4 9.6v4.8h3.6L14 19V5L7.6 9.6z" /><path d="M17.2 8.4a5 5 0 0 1 0 7.2M19.6 5.8a8.4 8.4 0 0 1 0 12.4" /></>,
  calendrier: <><rect x="3.2" y="5" width="17.6" height="16" rx="1.6" /><path d="M3.2 10h17.6M8 3v4M16 3v4" /><path d="M7.6 14h2M11 14h2M14.4 14h2M7.6 17.4h2M11 17.4h2" /></>,
  presence: <><circle cx="10" cy="8" r="3.4" /><path d="M3.4 20.4c0-3.5 2.9-5.8 6.6-5.8 1 0 2 .2 2.8.5" /><path d="m14.6 17.4 2.2 2.2 4.2-4.4" /></>,
  galerie: <><rect x="3" y="4.6" width="18" height="14.8" rx="1.6" /><circle cx="8.6" cy="10" r="1.8" /><path d="m3.4 17.6 5-5.2 4 4 3-2.6 5 4.6" /></>,
  histoire: <><path d="M4 4.4h6.4A2.6 2.6 0 0 1 13 7v13a2.2 2.2 0 0 0-2.2-2H4z" /><path d="M20 4.4h-6.4A2.6 2.6 0 0 0 11 7v13a2.2 2.2 0 0 1 2.2-2H20z" /></>,

  // ── Gouvernance
  sanction: <><path d="m13.6 3.4 7 7-2.6 2.6-7-7z" /><path d="m9.4 7.6 7 7-2.6 2.6-7-7z" /><path d="M3 21h10" /><path d="m8.6 12.4-4 4.4" /></>,
  archive: <><path d="M2.8 4.6h18.4V9H2.8z" /><path d="M4.6 9v11.4h14.8V9" /><path d="M9.6 13h4.8" /></>,
  ticket: <><circle cx="12" cy="12" r="9" /><path d="M9.4 9.4a2.7 2.7 0 1 1 3.6 2.5c-.7.3-1 .9-1 1.6v.4" /><path d="M12 17.4v.2" /></>,
  audit: <><path d="M2.6 12S6 5.8 12 5.8 21.4 12 21.4 12 18 18.2 12 18.2 2.6 12 2.6 12Z" /><circle cx="12" cy="12" r="3" /></>,
  reglement: <><path d="M5 3.4h11.6L19 6v14.6H5z" /><path d="M8.2 8h7.6M8.2 11.6h7.6M8.2 15.2h4.6" /></>,
  demande: <><path d="M6 2.8h8l4.4 4.4V21H6z" /><path d="M14 2.8v4.4h4.4" /><path d="M12 11v6M9 14h6" /></>,

  // ── Branches
  militaire: <><path d="M12 2.6 19.6 6v6.2c0 4.4-3.2 7.6-7.6 9.2-4.4-1.6-7.6-4.8-7.6-9.2V6z" /><path d="m9.2 11.8 2 2.2 4-4.6" /></>,
  garde_chasse: <><path d="M4 20 20 4" /><path d="M17.4 4H20v2.6" /><path d="M5.6 4.4A13.6 13.6 0 0 1 19.6 18.4" /><path d="M4 17.4V20h2.6" /></>,
  commerciale: <><circle cx="12" cy="12" r="8.4" /><path d="M12 7v10M14.6 9.2c-.6-.9-1.6-1.3-2.6-1.3-1.5 0-2.6.8-2.6 2s1 1.7 2.6 2.1c1.7.4 2.8 1 2.8 2.2s-1.2 2-2.8 2c-1.2 0-2.2-.5-2.7-1.4" /></>,
  artisanat: <><path d="m14.4 3.4 6.2 6.2-2.8 2.8-6.2-6.2z" /><path d="m12.2 7.6-8 8a2.4 2.4 0 0 0 3.4 3.4l8-8" /><path d="m4.6 5 2.8-1.6L9 5 7.4 7.8z" /></>,

  // ── Conseil
  senechal: <><circle cx="8.4" cy="8.4" r="4.4" /><path d="m11.6 11.6 8.4 8.4M17 17l2-2M14.6 14.6l1.6-1.6" /></>,
  champion: <><path d="M14.6 3.4 20.6 3l-.4 6-9.4 9.4-5.6-5.6z" /><path d="m5.2 12.8-2.6 2.6 5.6 5.6 2.6-2.6" /></>,
  intendant: <><path d="M12 3v18M7 6.5h10" /><path d="M4 17a3.4 3.4 0 0 0 6.4 0L7.2 9.4z" /><path d="M13.6 15a3.4 3.4 0 0 0 6.4 0l-3.2-7.6z" /></>,
  pretre: <><path d="M12 2.6v18.8M7.4 8h9.2" /><path d="M9 21.4h6" /></>,
  mage: <><path d="m12 2.6 2.4 6 6.4.5-4.9 4.2 1.5 6.2-5.4-3.3-5.4 3.3 1.5-6.2L3.2 9.1l6.4-.5z" /></>,

  // ── Métiers
  mineur: <><path d="M3.4 6.4c4.6-3 12.4-3 17.2 0" /><path d="M4.6 5.2 12 12.6M19.4 5.2 12 12.6" /><path d="m12 12.6 3 3-4.4 4.4-3-3z" /></>,
  bucheron: <><path d="M4 20 14 10" /><path d="M13 4.6 20 8l-2 5.4-5.6-5.6z" /><path d="m11.4 8.6 4 4" /></>,
  chasseur: <><path d="M4 20 20 4" /><path d="M17.4 4H20v2.6" /><path d="M5.6 4.4A13.6 13.6 0 0 1 19.6 18.4" /></>,
  pecheur: <><path d="M2.6 12c3-4 6.4-6 10-6s7 2 8.8 6c-1.8 4-5.2 6-8.8 6s-7-2-10-6Z" /><path d="M17.6 12h.2" /><path d="m2.6 12 3.4-3.4M2.6 12 6 15.4" /></>,
  fermier: <><path d="M12 21V8" /><path d="M12 8c0-2.6-1.6-4.6-4-5.4-.4 2.8.8 4.8 4 5.4Z" /><path d="M12 8c0-2.6 1.6-4.6 4-5.4.4 2.8-.8 4.8-4 5.4Z" /><path d="M12 14c0-2.4-1.6-4-4-4.6-.4 2.6.8 4 4 4.6Z" /><path d="M12 14c0-2.4 1.6-4 4-4.6.4 2.6-.8 4-4 4.6Z" /></>,
  herboriste: <><path d="M20.4 3.6C13 3 7 6 5.4 11.6c-1 3.6.6 7 3.6 8.4 3.6-6.4 6.6-9.4 11.4-16.4Z" /><path d="M9 20c.6-4.4 3-8.4 6.6-11.4" /></>,
  forgeron: <><path d="m14.4 3.4 6.2 6.2-2.8 2.8-6.2-6.2z" /><path d="m12.2 7.6-8 8a2.4 2.4 0 0 0 3.4 3.4l8-8" /></>,
  couturier: <><path d="m4 20 12.6-12.6" /><ellipse cx="18.4" cy="5.6" rx="2.4" ry="1.4" transform="rotate(-45 18.4 5.6)" /><path d="M4 20v-3.4l1.8 1.6z" /></>,
  bijoutier: <><path d="m6.6 3.4h10.8L21.4 9 12 21 2.6 9z" /><path d="M2.6 9h18.8M9 3.4 7 9l5 12 5-12-2-5.6" /></>,
  alchimiste: <><path d="M9.4 2.8h5.2M10.4 2.8v6.4L5 18.6A2 2 0 0 0 6.8 21.6h10.4a2 2 0 0 0 1.8-3l-5.4-9.4V2.8" /><path d="M7.4 15h9.2" /></>,
  cuisinier: <><path d="M3.4 9.6h17.2v3.6a6.4 6.4 0 0 1-6.4 6.4h-4.4a6.4 6.4 0 0 1-6.4-6.4z" /><path d="M2 9.6h20" /><path d="M8.6 6.4c0-1.4 1.4-1.4 1.4-2.8M13 6.4c0-1.4 1.4-1.4 1.4-2.8" /></>,
  enchanteur: <><path d="m12 3 1.8 4.6 4.6 1.8-4.6 1.8L12 15.8l-1.8-4.6-4.6-1.8 4.6-1.8z" /><path d="M18.4 15.4l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" /></>,
  marchand: <><circle cx="9" cy="9.6" r="5.4" /><path d="M13.4 6.2a5.4 5.4 0 1 1 1.6 10.4" /><path d="M9 7v5.2M7 8.4h4M7 11h4" /></>,
  mercenaire: <><path d="M14.6 3.4 20.6 3l-.4 6-9.4 9.4-5.6-5.6z" /><path d="m5.2 12.8-2.6 2.6 5.6 5.6 2.6-2.6" /></>,
  garde: <><path d="M12 2.6 19.6 6v6.2c0 4.4-3.2 7.6-7.6 9.2-4.4-1.6-7.6-4.8-7.6-9.2V6z" /></>,
  barde: <><circle cx="8.4" cy="17.4" r="3.4" /><path d="M11.8 17.4V5.6l8.2-2.2v11.4" /><circle cx="17" cy="14.8" r="3" /><path d="M11.8 9.2 20 7" /></>,

  // ── Actions
  plus: <><path d="M12 5v14M5 12h14" /></>,
  recherche: <><circle cx="10.6" cy="10.6" r="6.6" /><path d="m15.6 15.6 4.8 4.8" /></>,
  filtre: <><path d="M3 5h18l-7 8.4V20l-4 1.4v-8z" /></>,
  valider: <><path d="m4.6 12.6 5 5L19.4 6.6" /></>,
  refuser: <><path d="M6 6l12 12M18 6 6 18" /></>,
  modifier: <><path d="M4 20h4.2L20 8.2 15.8 4 4 15.8z" /><path d="m14.4 5.4 4.2 4.2" /></>,
  supprimer: <><path d="M4.6 6.6h14.8" /><path d="M8.6 6.6V4.4h6.8v2.2" /><path d="M6.4 6.6 7.4 21h9.2l1-14.4" /><path d="M10.4 10.4v6.6M13.6 10.4v6.6" /></>,
  retour: <><path d="M20 12H4" /><path d="m10 6-6 6 6 6" /></>,
  chevron: <><path d="m8 5 7 7-7 7" /></>,
  bas: <><path d="m5 8.5 7 7 7-7" /></>,
  telecharger: <><path d="M12 3v12" /><path d="m7 10.4 5 5 5-5" /><path d="M4 20h16" /></>,
  photo: <><rect x="2.6" y="6.4" width="18.8" height="14" rx="2" /><circle cx="12" cy="13.4" r="4" /><path d="M8.4 6.4 9.8 3.6h4.4l1.4 2.8" /></>,
  alerte: <><path d="M12 3.4 22 20.6H2z" /><path d="M12 9.6v5M12 17.6v.2" /></>,
  parametres: <><circle cx="12" cy="12" r="3.2" /><path d="M12 2.6v2.6M12 18.8v2.6M21.4 12h-2.6M5.2 12H2.6M18.6 5.4l-1.8 1.8M7.2 16.8l-1.8 1.8M18.6 18.6l-1.8-1.8M7.2 7.2 5.4 5.4" /></>,
  sortie: <><path d="M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5" /><path d="M10 8 6 12l4 4" /><path d="M6 12h10" /></>,
  discord: <><path d="M8.6 6.6a14 14 0 0 1 6.8 0" /><path d="M9 17.4a14 14 0 0 0 6 0" /><path d="M8.6 6.6C6 7.4 4.2 9.4 3.6 12.6c-.4 2.2-.2 3.8.2 4.6 1 .8 2.4 1.6 3.6 2l1-2" /><path d="M15.4 6.6c2.6.8 4.4 2.8 5 6 .4 2.2.2 3.8-.2 4.6-1 .8-2.4 1.6-3.6 2l-1-2" /><circle cx="9.4" cy="13" r="1.3" /><circle cx="14.6" cy="13" r="1.3" /></>,
  lune: <><path d="M20 14.4A8.6 8.6 0 0 1 9.6 4 8.8 8.8 0 1 0 20 14.4Z" /></>,
  givre: <><path d="M12 2v20M3.4 7 20.6 17M20.6 7 3.4 17" /><path d="M9 4.4 12 6.6l3-2.2M9 19.6l3-2.2 3 2.2" /><path d="m4.6 10.6.4 3.4 3-1.4M19.4 10.6l-.4 3.4-3-1.4M4.6 13.4l-.4-3.4 3 1.4M19.4 13.4l.4-3.4-3 1.4" /></>,
  loup: <><path d="M4 8.4 6.6 3l3.4 3.4h4L17.4 3 20 8.4c0 6-3.6 8.6-8 12.6-4.4-4-8-6.6-8-12.6Z" /><path d="M9 11h.2M15 11h-.2M12 14.4l-1.4 1.4 1.4 1.2 1.4-1.2z" /></>,
  horloge: <><circle cx="12" cy="12" r="9" /><path d="M12 6.8V12l3.4 2.2" /></>,
  lieu: <><path d="M12 21.4s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" /><circle cx="12" cy="10.2" r="2.6" /></>,
};

const REPLI = (
  <>
    <path d="m12 3.6 4.4 8.4L12 20.4 7.6 12z" />
  </>
);

export type NomIcone = keyof typeof T | string;

export function Icone({
  nom,
  taille = 18,
  className = "",
  epaisseur = 1.5,
}: {
  nom: NomIcone;
  taille?: number;
  className?: string;
  epaisseur?: number;
}) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={epaisseur}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`shrink-0 ${className}`}
    >
      {T[nom] ?? REPLI}
    </svg>
  );
}

/** Icône d'un métier, avec repli sur l'icône de sa famille. */
export function iconeMetier(key: string, category?: string): string {
  if (T[key]) return key;
  if (key === "pretre_metier") return "pretre";
  if (key === "mage_metier") return "mage";
  if (category === "extraction") return "herboriste";
  if (category === "transformation") return "atelier";
  return "membres";
}
