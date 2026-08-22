import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Icone, type NomIcone } from "./Icone";
import { Ornement } from "./Embleme";
import { statusDef, type StatusFamily, type StatusTone } from "@/lib/domain";

/* ══════════════════════════════════════════════════════════════
   Cartes
   ══════════════════════════════════════════════════════════════ */

export function Carte({
  titre,
  sousTitre,
  icone,
  actions,
  children,
  className = "",
  padding = true,
  texture = true,
}: {
  titre?: ReactNode;
  sousTitre?: ReactNode;
  icone?: NomIcone;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  padding?: boolean;
  texture?: boolean;
}) {
  return (
    <section className={`carte ${texture ? "carte-texture" : ""} overflow-hidden ${className}`}>
      {(titre || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-argent-500/12 bg-nuit-900/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {icone && (
              <span className="grid size-8 place-items-center rounded-[2px] border border-or-500/25 bg-nuit-950/50 text-or-400">
                <Icone nom={icone} taille={16} />
              </span>
            )}
            <div className="min-w-0">
              {titre && (
                <h2 className="titre-imperial truncate text-[0.95rem] text-givre-50">{titre}</h2>
              )}
              {sousTitre && (
                <p className="truncate text-xs text-givre-300/70">{sousTitre}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={padding ? "p-4" : ""}>{children}</div>
    </section>
  );
}

/** Surface parchemin : documents, lore, contrats. */
export function Parchemin({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`parchemin px-6 py-7 sm:px-10 sm:py-9 ${className}`}>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   En-tête de page
   ══════════════════════════════════════════════════════════════ */

export function EnTetePage({
  surTitre,
  titre,
  texte,
  icone,
  actions,
}: {
  surTitre?: string;
  titre: string;
  texte?: ReactNode;
  icone?: NomIcone;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {surTitre && <p className="sur-titre mb-1.5">{surTitre}</p>}
          <h1 className="titre-imperial flex items-center gap-3 text-2xl text-givre-50 sm:text-[1.75rem]">
            {icone && <Icone nom={icone} taille={26} className="text-or-400" epaisseur={1.3} />}
            {titre}
          </h1>
          {texte && <p className="mt-2 max-w-3xl text-sm text-givre-300/80">{texte}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <Ornement className="mt-5" />
    </header>
  );
}

/* ══════════════════════════════════════════════════════════════
   Boutons
   ══════════════════════════════════════════════════════════════ */

type Variante = "or" | "argent" | "fantome" | "danger" | "succes";
type Taille = "sm" | "md";

const VARIANTES: Record<Variante, string> = {
  or: "bg-gradient-to-b from-or-400 to-or-600 text-nuit-950 border-or-300/50 hover:from-or-300 hover:to-or-500 font-semibold shadow-[0_6px_18px_-10px_rgba(210,184,115,0.9)]",
  argent:
    "bg-nuit-700/70 text-givre-100 border-argent-500/25 hover:bg-nuit-600/80 hover:border-argent-400/40",
  fantome: "bg-transparent text-givre-200/85 border-transparent hover:bg-nuit-700/60 hover:text-givre-50",
  danger: "bg-danger/15 text-[#e69a8c] border-danger/35 hover:bg-danger/25",
  succes: "bg-succes/15 text-[#8fd0a3] border-succes/35 hover:bg-succes/25",
};

const TAILLES: Record<Taille, string> = {
  sm: "px-2.5 py-1 text-xs gap-1.5",
  md: "px-3.5 py-1.5 text-[0.82rem] gap-2",
};

const BASE =
  "inline-flex items-center justify-center rounded-[2px] border transition-all duration-150 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or-400/50 " +
  "disabled:opacity-45 disabled:pointer-events-none whitespace-nowrap";

export function Bouton({
  variante = "argent",
  taille = "md",
  icone,
  className = "",
  children,
  ...props
}: ComponentProps<"button"> & { variante?: Variante; taille?: Taille; icone?: NomIcone }) {
  return (
    <button className={`${BASE} ${VARIANTES[variante]} ${TAILLES[taille]} ${className}`} {...props}>
      {icone && <Icone nom={icone} taille={taille === "sm" ? 13 : 15} />}
      {children}
    </button>
  );
}

export function LienBouton({
  href,
  variante = "argent",
  taille = "md",
  icone,
  className = "",
  children,
  ...props
}: ComponentProps<typeof Link> & { variante?: Variante; taille?: Taille; icone?: NomIcone }) {
  return (
    <Link href={href} className={`${BASE} ${VARIANTES[variante]} ${TAILLES[taille]} ${className}`} {...props}>
      {icone && <Icone nom={icone} taille={taille === "sm" ? 13 : 15} />}
      {children}
    </Link>
  );
}

/* ══════════════════════════════════════════════════════════════
   Badges & statuts
   ══════════════════════════════════════════════════════════════ */

const TONS: Record<StatusTone, string> = {
  neutre: "border-argent-500/30 bg-argent-500/10 text-argent-300",
  attente: "border-attente/40 bg-attente/12 text-[#e3c47c]",
  actif: "border-actif/40 bg-actif/12 text-[#93bfe4]",
  succes: "border-succes/40 bg-succes/12 text-[#8fd0a3]",
  alerte: "border-alerte/40 bg-alerte/12 text-[#e5a877]",
  danger: "border-danger/45 bg-danger/12 text-[#e69a8c]",
};

export function Badge({
  tone = "neutre",
  children,
  className = "",
  point = false,
}: {
  tone?: StatusTone;
  children: ReactNode;
  className?: string;
  point?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.68rem] font-medium tracking-wide ${TONS[tone]} ${className}`}
    >
      {point && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function BadgeStatut({
  famille,
  valeur,
  point = true,
}: {
  famille: StatusFamily;
  valeur: string;
  point?: boolean;
}) {
  const def = statusDef(famille, valeur);
  return (
    <Badge tone={def.tone} point={point}>
      {def.label}
    </Badge>
  );
}

/** Marque d'or discrète pour les gradés. */
export function MarqueRang({ rang, level }: { rang: string; level: number }) {
  const doree = level <= 2;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[0.7rem] tracking-wide ${
        doree ? "text-or-300" : "text-givre-300/80"
      }`}
    >
      {doree && <Icone nom="lune" taille={11} />}
      {rang}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════
   Chiffres clés
   ══════════════════════════════════════════════════════════════ */

export function Stat({
  label,
  valeur,
  sousTexte,
  icone,
  tone,
  href,
}: {
  label: string;
  valeur: ReactNode;
  sousTexte?: ReactNode;
  icone?: NomIcone;
  tone?: StatusTone;
  href?: string;
}) {
  const corps = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="sur-titre !text-[0.6rem] !tracking-[0.22em] text-givre-300/60">{label}</p>
        {icone && (
          <Icone
            nom={icone}
            taille={16}
            className={tone ? TONS[tone].split(" ").pop() : "text-or-400/70"}
          />
        )}
      </div>
      <p className="titre-imperial mt-2 text-xl text-givre-50 tabular-nums sm:text-2xl">{valeur}</p>
      {sousTexte && <p className="mt-1 text-[0.72rem] text-givre-300/60">{sousTexte}</p>}
    </>
  );

  const classes =
    "carte carte-texture block p-3.5 transition-colors duration-150" +
    (href ? " hover:border-or-500/35 hover:bg-nuit-700/40" : "");

  return href ? (
    <Link href={href} className={classes}>
      {corps}
    </Link>
  ) : (
    <div className={classes}>{corps}</div>
  );
}

/** Pastille de rappel (impayés, demandes en attente…). */
export function Pastille({ n, tone = "danger" }: { n: number; tone?: StatusTone }) {
  if (!n) return null;
  return (
    <span
      className={`ml-auto inline-flex min-w-[1.15rem] items-center justify-center rounded-full border px-1.5 py-px text-[0.62rem] font-semibold tabular-nums ${TONS[tone]}`}
    >
      {n > 99 ? "99+" : n}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════
   États vides & messages
   ══════════════════════════════════════════════════════════════ */

export function Vide({
  titre = "Registre vide",
  texte,
  icone = "registre",
  action,
}: {
  titre?: string;
  texte?: ReactNode;
  icone?: NomIcone;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-full border border-or-500/20 bg-nuit-950/50 text-or-500/50">
        <Icone nom={icone} taille={24} epaisseur={1.2} />
      </span>
      <p className="titre-imperial text-sm text-givre-200">{titre}</p>
      {texte && <p className="max-w-md text-xs text-givre-300/60">{texte}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export function Message({
  tone = "neutre",
  titre,
  children,
  icone,
}: {
  tone?: StatusTone;
  titre?: string;
  children?: ReactNode;
  icone?: NomIcone;
}) {
  return (
    <div className={`flex gap-3 rounded-[2px] border px-3.5 py-3 text-[0.82rem] ${TONS[tone]}`}>
      <Icone nom={icone ?? (tone === "danger" || tone === "alerte" ? "alerte" : "recette")} taille={16} className="mt-0.5" />
      <div className="min-w-0">
        {titre && <p className="font-semibold">{titre}</p>}
        {children && <div className="text-current/85">{children}</div>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Divers
   ══════════════════════════════════════════════════════════════ */

export function Avatar({
  nom,
  url,
  taille = 36,
  anneau,
}: {
  nom: string;
  url?: string | null;
  taille?: number;
  anneau?: string;
}) {
  const init = nom
    .split(/[\s'-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase())
    .join("");
  return (
    <span
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-full border bg-gradient-to-br from-nuit-600 to-nuit-850 font-[var(--font-imperial)] text-givre-100"
      style={{
        width: taille,
        height: taille,
        fontSize: taille * 0.36,
        borderColor: anneau ?? "rgba(147,167,189,0.28)",
      }}
      aria-hidden
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="size-full object-cover" />
      ) : (
        init
      )}
    </span>
  );
}

/** Liste clé → valeur, utilisée sur toutes les fiches. */
export function Definitions({
  items,
  colonnes = 2,
}: {
  items: [ReactNode, ReactNode][];
  colonnes?: 1 | 2 | 3;
}) {
  const grille = { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3" }[colonnes];
  return (
    <dl className={`grid grid-cols-1 gap-x-6 gap-y-3.5 ${grille}`}>
      {items.map(([cle, valeur], i) => (
        <div key={i} className="min-w-0">
          <dt className="sur-titre !text-[0.58rem] !tracking-[0.2em] text-givre-300/50">{cle}</dt>
          <dd className="mt-0.5 text-[0.86rem] text-givre-100">{valeur ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Barre de progression (objectifs, permis consommés, seuils de stock). */
export function Jauge({
  valeur,
  max = 100,
  tone = "actif",
  hauteur = 6,
  etiquette,
}: {
  valeur: number;
  max?: number;
  tone?: StatusTone;
  hauteur?: number;
  etiquette?: ReactNode;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (valeur / max) * 100)) : 0;
  const couleurs: Record<StatusTone, string> = {
    neutre: "bg-argent-400",
    attente: "bg-attente",
    actif: "bg-actif",
    succes: "bg-succes",
    alerte: "bg-alerte",
    danger: "bg-danger",
  };
  return (
    <div className="w-full">
      {etiquette && (
        <div className="mb-1 flex items-center justify-between text-[0.7rem] text-givre-300/70">
          {etiquette}
        </div>
      )}
      <div
        className="w-full overflow-hidden rounded-full bg-nuit-950/70 ring-1 ring-inset ring-argent-500/15"
        style={{ height: hauteur }}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${couleurs[tone]}`}
          style={{ width: `${pct}%`, opacity: 0.85 }}
        />
      </div>
    </div>
  );
}

export { Ornement };
