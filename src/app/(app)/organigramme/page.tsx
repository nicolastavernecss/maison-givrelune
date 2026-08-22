import Link from "next/link";
import type { Metadata } from "next";
import { Avatar, Badge, EnTetePage, LienBouton, Ornement } from "@/components/ui/base";
import { Embleme } from "@/components/ui/Embleme";
import { Icone, iconeMetier } from "@/components/ui/Icone";
import { exigerMembre } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MAISON } from "@/lib/domain";

export const metadata: Metadata = { title: "Organigramme" };

type MembreCarte = {
  id: string;
  nomRp: string;
  avatarUrl: string;
  status: string;
  circle: { label: string } | null;
  presentedBy: { nomRp: string } | null;
  metiers: { id: string; metier: { key: string; label: string; category: string } }[];
};

function Fiche({ m, dore = false }: { m: MembreCarte; dore?: boolean }) {
  return (
    <Link
      href={`/membres/${m.id}`}
      className={`group flex items-center gap-2.5 rounded-[2px] border px-2.5 py-2 transition-all duration-150 ${
        dore
          ? "border-or-500/35 bg-or-500/8 hover:border-or-400/60 hover:bg-or-500/14"
          : "border-argent-500/15 bg-nuit-950/40 hover:border-or-500/30 hover:bg-nuit-700/40"
      }`}
    >
      <Avatar
        nom={m.nomRp}
        url={m.avatarUrl}
        taille={dore ? 34 : 28}
        anneau={dore ? "rgba(210,184,115,0.6)" : undefined}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.8rem] text-givre-50 transition-colors group-hover:text-or-200">
          {m.nomRp}
        </span>
        <span className="block truncate text-[0.64rem] text-givre-300/55">
          {m.circle?.label ?? m.metiers[0]?.metier.label ?? "—"}
          {m.presentedBy && ` · parrain ${m.presentedBy.nomRp}`}
        </span>
      </span>
      {m.status === "essai" && (
        <span className="shrink-0 rounded-full border border-attente/40 bg-attente/12 px-1.5 py-px text-[0.55rem] text-[#e3c47c]">
          essai
        </span>
      )}
      {m.metiers[0] && (
        <Icone
          nom={iconeMetier(m.metiers[0].metier.key, m.metiers[0].metier.category)}
          taille={12}
          className="shrink-0 text-givre-300/35"
        />
      )}
    </Link>
  );
}

export default async function Organigramme() {
  await exigerMembre();

  const inclusion = {
    circle: { select: { label: true } },
    presentedBy: { select: { nomRp: true } },
    metiers: { include: { metier: true }, orderBy: { isPrimary: "desc" } },
  } as const;

  const [patriarches, conseil, branches, sansBranche, cercles] = await Promise.all([
    prisma.user.findMany({
      where: { rank: { key: "patriarche" }, status: { not: "archive" } },
      include: inclusion,
      orderBy: { dateEntree: "asc" },
    }),
    prisma.councilRole.findMany({
      orderBy: { position: "asc" },
      include: {
        users: {
          where: { status: { not: "archive" } },
          include: { ...inclusion, rank: true, branch: true, grade: true },
        },
      },
    }),
    prisma.branch.findMany({
      orderBy: { position: "asc" },
      include: {
        grades: {
          orderBy: { level: "asc" },
          include: {
            users: {
              where: { status: { not: "archive" } },
              include: inclusion,
              orderBy: { nomRp: "asc" },
            },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        status: { not: "archive" },
        branchId: null,
        rank: { key: { not: "patriarche" } },
        councilRoleId: null,
      },
      include: { ...inclusion, rank: true },
      orderBy: [{ rank: { level: "asc" } }, { nomRp: "asc" }],
    }),
    prisma.circle.findMany({
      include: {
        leader: { select: { id: true, nomRp: true } },
        members: { where: { status: { not: "archive" } }, select: { id: true, nomRp: true } },
        branch: { select: { label: true, color: true } },
      },
    }),
  ]);

  return (
    <>
      <EnTetePage
        surTitre="La chaîne d'autorité"
        titre="Organigramme"
        icone="organigramme"
        texte="Des Patriarches aux Fils : qui commande quoi, qui répond à qui. Cliquez sur un nom pour ouvrir sa fiche."
        actions={
          <LienBouton href="/annuaire" variante="argent" icone="membres">
            Annuaire
          </LienBouton>
        }
      />

      {/* ── Les Seigneurs ── */}
      <section className="mb-8">
        <div className="carte carte-texture relative overflow-hidden px-5 py-7">
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              background: "radial-gradient(540px 220px at 50% 0%, rgba(189,156,77,0.14), transparent 70%)",
            }}
          />
          <div className="relative flex flex-col items-center">
            <Embleme taille={72} variante="simple" />
            <p className="sur-titre mt-3">Les Seigneurs de la Maison</p>
            <h2 className="titre-imperial mt-1 text-lg text-or-200">Patriarches</h2>
            <p className="recit mt-2 max-w-lg text-center text-[0.9rem] text-givre-300/65 italic">
              « {MAISON.devise} »
            </p>
            <div className="mt-5 grid w-full max-w-2xl gap-2.5 sm:grid-cols-2">
              {patriarches.map((m) => (
                <Fiche key={m.id} m={m} dore />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Le Conseil ── */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <h2 className="titre-imperial text-[0.95rem] tracking-[0.1em] text-or-300">
            Conseil de la Maison
          </h2>
          <span className="filet flex-1" />
          <span className="text-[0.68rem] text-givre-300/45">Fonctions transverses</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {conseil.map((c) => (
            <div key={c.id} className="carte p-3.5">
              <div className="mb-2.5 flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-full border border-or-500/30 bg-or-500/8 text-or-300">
                  <Icone nom={c.icon} taille={13} />
                </span>
                <p className="titre-imperial text-[0.82rem] text-givre-50">{c.label}</p>
              </div>
              {c.users.length === 0 ? (
                <p className="px-1 py-2 text-[0.7rem] text-givre-300/40">Fonction vacante</p>
              ) : (
                <div className="space-y-1.5">
                  {c.users.map((m) => (
                    <Fiche key={m.id} m={m} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Les branches ── */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <h2 className="titre-imperial text-[0.95rem] tracking-[0.1em] text-or-300">Les branches</h2>
          <span className="filet flex-1" />
          <span className="text-[0.68rem] text-givre-300/45">Grade 1 = chef de branche</span>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {branches.map((b) => {
            const effectif = b.grades.reduce((n, g) => n + g.users.length, 0);
            return (
              <details key={b.id} open className="carte carte-texture group overflow-hidden">
                <summary className="flex cursor-pointer list-none items-center gap-3 border-b border-argent-500/12 bg-nuit-900/40 px-4 py-3">
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-[2px] border"
                    style={{
                      borderColor: `${b.color}55`,
                      background: `${b.color}14`,
                      color: b.color,
                    }}
                  >
                    <Icone nom={b.icon} taille={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="titre-imperial block truncate text-[0.92rem] text-givre-50">
                      {b.label}
                    </span>
                    <span className="block truncate text-[0.68rem] text-givre-300/55 italic">
                      {b.motto}
                    </span>
                  </span>
                  <Badge tone="neutre">{effectif}</Badge>
                  <Icone
                    nom="bas"
                    taille={14}
                    className="text-givre-300/50 transition-transform group-open:rotate-180"
                  />
                </summary>

                <div className="space-y-3 p-4">
                  {b.grades.map((g) => (
                    <div key={g.id}>
                      <div className="mb-1.5 flex items-center gap-2">
                        <span
                          className="grid size-5 shrink-0 place-items-center rounded-full border text-[0.58rem] tabular-nums"
                          style={{
                            borderColor: g.level === 1 ? "rgba(210,184,115,0.6)" : "rgba(147,167,189,0.25)",
                            color: g.level === 1 ? "#e3cd94" : "#93a7bd",
                          }}
                        >
                          {g.level}
                        </span>
                        <span
                          className={`text-[0.74rem] tracking-wide ${
                            g.level === 1 ? "text-or-200" : "text-givre-200/75"
                          }`}
                        >
                          {g.label}
                        </span>
                        <span className="h-px flex-1 bg-argent-500/10" />
                        <span className="text-[0.64rem] tabular-nums text-givre-300/40">
                          {g.users.length}
                        </span>
                      </div>
                      {g.users.length === 0 ? (
                        <p className="pl-7 text-[0.68rem] text-givre-300/30">— personne —</p>
                      ) : (
                        <div className="grid gap-1.5 pl-7 sm:grid-cols-2">
                          {g.users.map((m) => (
                            <Fiche key={m.id} m={m} dore={g.level === 1} />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </section>

      {/* ── Cercles ── */}
      {cercles.length > 0 && (
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <h2 className="titre-imperial text-[0.95rem] tracking-[0.1em] text-or-300">Les cercles</h2>
            <span className="filet flex-1" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {cercles.map((c) => (
              <div key={c.id} className="carte p-4">
                <div className="flex items-center gap-2.5">
                  <Icone nom="loup" taille={17} className="text-or-400" />
                  <p className="titre-imperial text-[0.9rem] text-givre-50">{c.label}</p>
                  {c.branch && (
                    <span
                      className="rounded-full border px-2 py-px text-[0.62rem]"
                      style={{
                        borderColor: `${c.branch.color}55`,
                        background: `${c.branch.color}14`,
                        color: c.branch.color,
                      }}
                    >
                      {c.branch.label}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[0.78rem] leading-relaxed text-givre-300/70">{c.description}</p>
                <Ornement className="my-3" />
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.72rem]">
                  <span className="text-givre-300/50">
                    Chef :{" "}
                    {c.leader ? (
                      <Link href={`/membres/${c.leader.id}`} className="text-or-300 hover:underline">
                        {c.leader.nomRp}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </span>
                  <span className="text-givre-300/50">
                    Membres :{" "}
                    {c.members.length > 0
                      ? c.members.map((m, i) => (
                          <span key={m.id}>
                            {i > 0 && ", "}
                            <Link href={`/membres/${m.id}`} className="text-givre-100 hover:text-or-300">
                              {m.nomRp}
                            </Link>
                          </span>
                        ))
                      : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Hors branche ── */}
      {sansBranche.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-3">
            <h2 className="titre-imperial text-[0.95rem] tracking-[0.1em] text-or-300">
              Sans branche assignée
            </h2>
            <span className="filet flex-1" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {sansBranche.map((m) => (
              <Fiche key={m.id} m={m} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
