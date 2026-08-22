"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { EmblemeCompact } from "@/components/ui/Embleme";
import { Icone } from "@/components/ui/Icone";
import { Avatar, Pastille } from "@/components/ui/base";
import type { Compteurs, Section } from "@/lib/navigation";
import { actionDeconnexion } from "@/app/actions/auth";

export type ResumeMembre = {
  id: string;
  nomRp: string;
  rang: string;
  rangLevel: number;
  branche?: string | null;
  grade?: string | null;
  conseil?: string | null;
  avatarUrl?: string | null;
  statut: string;
};

/**
 * Retour visuel immédiat au clic sur un onglet.
 * Sans cela, l'ancienne page reste figée le temps que le serveur réponde et
 * l'on croit que le clic n'a pas été pris en compte.
 */
function EtatLien() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <>
      <span className="pointer-events-none absolute inset-0 rounded-[2px] bg-or-500/12" />
      <span className="pointer-events-none absolute inset-y-[18%] left-0 w-[2px] bg-or-400/80" />
      <span
        className="ml-auto size-3 shrink-0 animate-spin rounded-full border-[1.5px] border-or-300 border-t-transparent"
        aria-hidden
      />
      <span className="sr-only">chargement…</span>
    </>
  );
}

export function Coquille({
  sections,
  compteurs,
  membre,
  children,
}: {
  sections: Section[];
  compteurs: Compteurs;
  membre: ResumeMembre;
  children: React.ReactNode;
}) {
  const chemin = usePathname();
  const [ouvert, setOuvert] = useState(false);

  useEffect(() => setOuvert(false), [chemin]);

  useEffect(() => {
    document.body.style.overflow = ouvert ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [ouvert]);

  const actif = (href: string, exact?: boolean) =>
    exact ? chemin === href : chemin === href || chemin.startsWith(`${href}/`);

  const titreCourant =
    sections.flatMap((s) => s.entrees).find((e) => actif(e.href, e.exact))?.label ?? "Maison Givrelune";

  const nav = (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {sections.map((section, i) => (
        <div key={section.titre || i}>
          {section.titre && (
            <p className="mb-1.5 px-2.5 text-[0.58rem] tracking-[0.24em] text-or-400/55 uppercase">
              {section.titre}
            </p>
          )}
          <ul className="space-y-0.5">
            {section.entrees.map((e) => (
              <li key={e.href}>
                {/* Pas de `prefetch` forcé : avec une trentaine d'entrées, cela
                    déclencherait autant de rendus serveur complets à chaque page.
                    Le préchargement automatique de Next se contente du squelette
                    de chargement — c'est exactement ce qu'il faut. */}
                <Link href={e.href} className="lien-nav" data-actif={actif(e.href, e.exact)}>
                  <Icone nom={e.icone} taille={15} />
                  <span className="truncate">{e.label}</span>
                  {e.pastille && (
                    <Pastille
                      n={compteurs[e.pastille] ?? 0}
                      tone={e.pastille === "impayes" ? "danger" : "attente"}
                    />
                  )}
                  <EtatLien />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  const pied = (
    <div className="border-t border-argent-500/12 p-3">
      <Link
        href={`/membres/${membre.id}`}
        className="flex items-center gap-2.5 rounded-[2px] p-2 transition-colors hover:bg-nuit-700/50"
      >
        <Avatar
          nom={membre.nomRp}
          url={membre.avatarUrl}
          taille={34}
          anneau={membre.rangLevel <= 2 ? "rgba(210,184,115,0.55)" : undefined}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.82rem] text-givre-50">{membre.nomRp}</span>
          <span className="block truncate text-[0.66rem] text-givre-300/60">
            {[membre.conseil, membre.grade ?? membre.rang].filter(Boolean).join(" · ")}
          </span>
        </span>
        {membre.statut === "essai" && (
          <span className="rounded-full border border-attente/40 bg-attente/12 px-1.5 py-px text-[0.55rem] text-[#e3c47c]">
            essai
          </span>
        )}
      </Link>
      <Link
        href="/mon-compte"
        className="mt-1 flex w-full items-center gap-2.5 rounded-[2px] px-2.5 py-1.5 text-[0.76rem] text-givre-300/60 transition-colors hover:bg-nuit-700/50 hover:text-givre-100"
      >
        <Icone nom="senechal" taille={14} />
        Mon compte
      </Link>
      <form action={actionDeconnexion}>
        <button
          type="submit"
          className="flex w-full items-center gap-2.5 rounded-[2px] px-2.5 py-1.5 text-[0.76rem] text-givre-300/60 transition-colors hover:bg-nuit-700/50 hover:text-[#e69a8c]"
        >
          <Icone nom="sortie" taille={14} />
          Quitter la Grande Salle
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-[264px]">
      {/* ── Barre latérale (écrans larges) ── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-argent-500/12 bg-nuit-900/70 backdrop-blur-sm lg:flex">
        <Link
          href="/tableau-de-bord"
          className="flex h-16 shrink-0 items-center gap-2.5 border-b border-argent-500/12 px-4"
        >
          <EmblemeCompact taille={28} />
          <span className="titre-imperial text-[0.86rem] tracking-[0.14em] text-givre-50">GIVRELUNE</span>
        </Link>
        {nav}
        {pied}
      </aside>

      {/* ── Barre supérieure (mobile) ── */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-argent-500/12 bg-nuit-950/90 px-4 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setOuvert(true)}
          aria-label="Ouvrir la navigation"
          className="grid size-9 place-items-center rounded-[2px] border border-argent-500/20 text-givre-200"
        >
          <span className="flex w-4 flex-col gap-[3px]">
            <span className="h-px w-full bg-current" />
            <span className="h-px w-full bg-current" />
            <span className="h-px w-full bg-current" />
          </span>
        </button>
        <EmblemeCompact taille={24} />
        <span className="titre-imperial truncate text-[0.82rem] text-givre-50">{titreCourant}</span>
        <Link href={`/membres/${membre.id}`} className="ml-auto">
          <Avatar nom={membre.nomRp} url={membre.avatarUrl} taille={30} />
        </Link>
      </header>

      {/* ── Tiroir (mobile) ── */}
      {ouvert && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fermer la navigation"
            onClick={() => setOuvert(false)}
            className="absolute inset-0 bg-nuit-950/80 backdrop-blur-sm"
          />
          <div className="animer-monter absolute inset-y-0 left-0 flex w-[278px] max-w-[85vw] flex-col border-r border-or-600/25 bg-nuit-900">
            <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-argent-500/12 px-4">
              <EmblemeCompact taille={26} />
              <span className="titre-imperial text-[0.82rem] tracking-[0.14em] text-givre-50">
                GIVRELUNE
              </span>
              <button
                type="button"
                onClick={() => setOuvert(false)}
                aria-label="Fermer"
                className="ml-auto text-givre-300/70 hover:text-givre-50"
              >
                <Icone nom="refuser" taille={18} />
              </button>
            </div>
            {nav}
            {pied}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
    </div>
  );
}
