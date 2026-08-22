import Link from "next/link";
import type { Metadata } from "next";
import { Avatar, Badge, Carte, EnTetePage, Stat, Vide } from "@/components/ui/base";
import { Filtres } from "@/components/ui/Filtres";
import { Icone } from "@/components/ui/Icone";
import { ACTIONS } from "@/lib/audit";
import { exigerDroit } from "@/lib/auth";
import { contient, prisma } from "@/lib/db";
import { PERMISSIONS as P } from "@/lib/domain";
import { dateHeure, relatif } from "@/lib/format";

export const metadata: Metadata = { title: "Journal d'audit" };
export const dynamic = "force-dynamic";

const ICONES: Record<string, string> = {
  creation: "plus",
  modification: "modifier",
  suppression: "supprimer",
  validation: "valider",
  refus: "refuser",
  octroi: "permis",
  revocation: "refuser",
  tresorerie: "tresorerie",
  stock: "stock",
  sanction: "sanction",
  membre: "membres",
  connexion: "loup",
};

export default async function Journal({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; action?: string; entite?: string; membre?: string }>;
}) {
  await exigerDroit(P.AUDIT_READ);
  const f = await searchParams;

  const [entrees, membres, entites, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        ...(f.q ? { OR: [{ label: contient(f.q) }, { details: contient(f.q) }] } : {}),
        ...(f.action ? { action: f.action } : {}),
        ...(f.entite ? { entityType: f.entite } : {}),
        ...(f.membre ? { userId: f.membre } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 300,
      include: { user: { select: { id: true, nomRp: true, avatarUrl: true } } },
    }),
    prisma.user.findMany({
      select: { id: true, nomRp: true },
      orderBy: { nomRp: "asc" },
    }),
    prisma.auditLog.groupBy({ by: ["entityType"], _count: true }),
    prisma.auditLog.count(),
  ]);

  const vingtQuatreH = entrees.filter(
    (e) => e.createdAt.getTime() > Date.now() - 86_400_000,
  ).length;
  const sensibles = entrees.filter((e) =>
    ["tresorerie", "sanction", "suppression", "revocation"].includes(e.action),
  ).length;

  return (
    <>
      <EnTetePage
        surTitre="Traçabilité"
        titre="Journal d'audit"
        icone="audit"
        texte="Toutes les actions sensibles : octrois et révocations, validations, mouvements de trésorerie et de stocks, sanctions. Rien ne se fait sans laisser de trace."
      />

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Entrées au journal" valeur={total} icone="registre" />
        <Stat label="Dernières 24 h" valeur={vingtQuatreH} icone="horloge" tone="actif" />
        <Stat
          label="Actions sensibles affichées"
          valeur={sensibles}
          icone="alerte"
          tone={sensibles ? "alerte" : "succes"}
        />
        <Stat label="Types d'entités suivies" valeur={entites.length} icone="matiere" />
      </section>

      <Filtres
        action="/gouvernance/journal"
        valeurs={f}
        total={entrees.length}
        champs={[
          { type: "recherche", nom: "q", placeholder: "Libellé ou détail…" },
          {
            type: "select",
            nom: "action",
            label: "Action",
            options: Object.entries(ACTIONS).map(([value, a]) => ({ value, label: a.label })),
          },
          {
            type: "select",
            nom: "entite",
            label: "Entité",
            options: entites
              .filter((e) => e.entityType)
              .map((e) => ({ value: e.entityType, label: `${e.entityType} (${e._count})` })),
          },
          {
            type: "select",
            nom: "membre",
            label: "Auteur",
            options: membres.map((m) => ({ value: m.id, label: m.nomRp })),
          },
        ]}
      />

      <Carte padding={false}>
        {entrees.length === 0 ? (
          <Vide titre="Journal vide" icone="audit" texte="Aucune action ne correspond à ces critères." />
        ) : (
          <ul className="divide-y divide-argent-500/10">
            {entrees.map((e) => {
              const def = ACTIONS[e.action] ?? { label: e.action, ton: "neutre" as const };
              return (
                <li key={e.id} className="flex items-start gap-3 px-4 py-2.5">
                  <span
                    className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border ${
                      def.ton === "danger"
                        ? "border-danger/35 bg-danger/10 text-[#e69a8c]"
                        : def.ton === "succes"
                          ? "border-succes/35 bg-succes/10 text-[#8fd0a3]"
                          : def.ton === "alerte"
                            ? "border-alerte/35 bg-alerte/10 text-[#e5a877]"
                            : "border-argent-500/25 bg-nuit-950/40 text-givre-300/70"
                    }`}
                  >
                    <Icone nom={ICONES[e.action] ?? "registre"} taille={12} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[0.83rem] text-givre-100">
                      {e.label || `${def.label} — ${e.entityType}`}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[0.68rem] text-givre-300/50">
                      <Badge tone={def.ton === "alerte" ? "alerte" : def.ton}>{def.label}</Badge>
                      {e.entityType && <span>{e.entityType}</span>}
                      {e.details && <span className="text-givre-300/40">· {e.details}</span>}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 text-right">
                    {e.user ? (
                      <>
                        <span className="hidden text-[0.72rem] text-givre-300/60 sm:block">
                          <Link href={`/membres/${e.user.id}`} className="hover:text-or-300">
                            {e.user.nomRp}
                          </Link>
                        </span>
                        <Avatar nom={e.user.nomRp} url={e.user.avatarUrl} taille={22} />
                      </>
                    ) : (
                      <span className="text-[0.72rem] text-givre-300/35">système</span>
                    )}
                    <span
                      className="w-20 text-right text-[0.66rem] text-givre-300/45"
                      title={dateHeure(e.createdAt)}
                    >
                      {relatif(e.createdAt)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Carte>

      <p className="mt-4 text-[0.72rem] text-givre-300/45">
        Les 300 entrées les plus récentes correspondant aux filtres sont affichées.
      </p>
    </>
  );
}
