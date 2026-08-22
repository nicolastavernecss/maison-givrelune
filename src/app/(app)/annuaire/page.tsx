import Link from "next/link";
import type { Metadata } from "next";
import { Avatar, Badge, Carte, EnTetePage, LienBouton, Vide } from "@/components/ui/base";
import { Filtres } from "@/components/ui/Filtres";
import { Icone, iconeMetier } from "@/components/ui/Icone";
import { exigerMembre, peut } from "@/lib/auth";
import { contient, prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/domain";
import { date, relatif } from "@/lib/format";

export const metadata: Metadata = { title: "Annuaire" };

export default async function Annuaire({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; branche?: string; rang?: string; metier?: string; statut?: string }>;
}) {
  const membre = await exigerMembre();
  const f = await searchParams;

  const [branches, rangs, metiers] = await Promise.all([
    prisma.branch.findMany({ orderBy: { position: "asc" } }),
    prisma.rank.findMany({ orderBy: { level: "asc" } }),
    prisma.metier.findMany({ orderBy: { position: "asc" } }),
  ]);

  const membres = await prisma.user.findMany({
    where: {
      status: f.statut ? f.statut : { not: "archive" },
      ...(f.q ? { OR: [{ nomRp: contient(f.q) }, { login: contient(f.q) }] } : {}),
      ...(f.branche ? { branch: { key: f.branche } } : {}),
      ...(f.rang ? { rank: { key: f.rang } } : {}),
      ...(f.metier ? { metiers: { some: { metier: { key: f.metier } } } } : {}),
    },
    include: {
      rank: true,
      branch: true,
      grade: true,
      councilRole: true,
      circle: true,
      metiers: { include: { metier: true }, orderBy: { isPrimary: "desc" } },
      presentedBy: { select: { nomRp: true, id: true } },
    },
    orderBy: [{ rank: { level: "asc" } }, { grade: { level: "asc" } }, { nomRp: "asc" }],
  });

  return (
    <>
      <EnTetePage
        surTitre="Ceux qui portent le nom"
        titre="Annuaire de la Maison"
        icone="membres"
        texte="Chaque membre, son rang, sa branche, son grade et ses métiers. Cliquez sur une fiche pour le détail."
        actions={
          <>
            <LienBouton href="/organigramme" variante="argent" icone="organigramme">
              Organigramme
            </LienBouton>
            {peut(membre, PERMISSIONS.ADMIN_MEMBERS) && (
              <LienBouton href="/gouvernance/membres" variante="or" icone="parametres">
                Administrer
              </LienBouton>
            )}
          </>
        }
      />

      <Filtres
        action="/annuaire"
        valeurs={f}
        total={membres.length}
        champs={[
          { type: "recherche", nom: "q", placeholder: "Nom RP ou identifiant…" },
          {
            type: "select",
            nom: "branche",
            label: "Branche",
            options: branches.map((b) => ({ value: b.key, label: b.label })),
          },
          {
            type: "select",
            nom: "rang",
            label: "Rang",
            options: rangs.map((r) => ({ value: r.key, label: r.label })),
          },
          {
            type: "select",
            nom: "metier",
            label: "Métier",
            options: metiers.map((m) => ({ value: m.key, label: m.label })),
          },
          {
            type: "select",
            nom: "statut",
            label: "Statut",
            options: [
              { value: "actif", label: "Actif" },
              { value: "essai", label: "Période d'essai" },
              { value: "archive", label: "Archivé" },
            ],
          },
        ]}
      />

      {membres.length === 0 ? (
        <Carte padding={false}>
          <Vide
            titre="Aucun membre ne correspond"
            texte="Élargissez vos critères de recherche."
            icone="membres"
          />
        </Carte>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {membres.map((m) => (
            <Link
              key={m.id}
              href={`/membres/${m.id}`}
              className="carte carte-texture group relative overflow-hidden p-4 transition-colors duration-150 hover:border-or-500/35"
            >
              {m.branch && (
                <span
                  className="absolute inset-y-0 left-0 w-[2px] opacity-70"
                  style={{ background: m.branch.color }}
                />
              )}
              <div className="flex items-start gap-3">
                <Avatar
                  nom={m.nomRp}
                  url={m.avatarUrl}
                  taille={44}
                  anneau={m.rank.level <= 2 ? "rgba(210,184,115,0.6)" : undefined}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="titre-imperial truncate text-[0.95rem] text-givre-50 transition-colors group-hover:text-or-200">
                      {m.nomRp}
                    </p>
                    {m.rank.level <= 2 && <Icone nom="lune" taille={12} className="text-or-400" />}
                  </div>
                  <p className="truncate text-[0.72rem]" style={{ color: m.rank.color }}>
                    {m.rank.label}
                    {m.councilRole && ` · ${m.councilRole.label}`}
                  </p>
                  {m.branch && (
                    <p className="mt-0.5 truncate text-[0.72rem] text-givre-300/65">
                      {m.grade ? `${m.grade.label} — ` : ""}
                      {m.branch.label}
                    </p>
                  )}
                </div>
                {m.status !== "actif" && (
                  <Badge tone={m.status === "essai" ? "attente" : "neutre"}>
                    {m.status === "essai" ? "essai" : "archivé"}
                  </Badge>
                )}
              </div>

              {m.metiers.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-argent-500/10 pt-3">
                  {m.metiers.slice(0, 4).map((um) => (
                    <span
                      key={um.id}
                      className="inline-flex items-center gap-1 rounded-full border border-argent-500/20 bg-nuit-950/40 px-2 py-0.5 text-[0.64rem] text-givre-200/80"
                      title={`${um.metier.label} — ${um.niveau}`}
                    >
                      <Icone nom={iconeMetier(um.metier.key, um.metier.category)} taille={10} />
                      {um.metier.label}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-[0.66rem] text-givre-300/45">
                <span>{m.circle?.label ?? "Sans cercle"}</span>
                <span title={date(m.dateEntree)}>entré {relatif(m.dateEntree)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
