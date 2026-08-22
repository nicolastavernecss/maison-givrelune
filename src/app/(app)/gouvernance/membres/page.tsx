import Link from "next/link";
import type { Metadata } from "next";
import { Avatar, Badge, BadgeStatut, Carte, EnTetePage, LienBouton, Stat } from "@/components/ui/base";
import { Filtres } from "@/components/ui/Filtres";
import { Icone } from "@/components/ui/Icone";
import { Tableau } from "@/components/ui/Tableau";
import { actionDroitMembre } from "@/app/actions/gouvernance";
import { exigerDroit, peut } from "@/lib/auth";
import { contient, prisma } from "@/lib/db";
import { PERMISSION_CATALOG, PERMISSIONS as P } from "@/lib/domain";
import { date, relatif } from "@/lib/format";
import { FormulaireMembre } from "./FormulaireMembre";

export const metadata: Metadata = { title: "Membres & rôles" };
export const dynamic = "force-dynamic";

export default async function AdminMembres({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; statut?: string; edit?: string; droits?: string }>;
}) {
  const admin = await exigerDroit(P.ADMIN_MEMBERS);
  const f = await searchParams;
  const gereRoles = peut(admin, P.ADMIN_ROLES);

  const [membres, rangs, branches, grades, conseils, cercles, metiers, permissions] =
    await Promise.all([
      prisma.user.findMany({
        where: {
          ...(f.q ? { OR: [{ nomRp: contient(f.q) }, { login: contient(f.q) }] } : {}),
          ...(f.statut ? { status: f.statut } : {}),
        },
        include: {
          rank: true,
          branch: true,
          grade: true,
          councilRole: true,
          circle: true,
          metiers: { include: { metier: true } },
          presentedBy: { select: { nomRp: true } },
        },
        orderBy: [{ rank: { level: "asc" } }, { nomRp: "asc" }],
      }),
      prisma.rank.findMany({ orderBy: { level: "asc" } }),
      prisma.branch.findMany({ orderBy: { position: "asc" } }),
      prisma.grade.findMany({ orderBy: { level: "asc" } }),
      prisma.councilRole.findMany({ orderBy: { position: "asc" } }),
      prisma.circle.findMany({ orderBy: { label: "asc" } }),
      prisma.metier.findMany({ orderBy: { position: "asc" } }),
      prisma.permission.findMany({ orderBy: { category: "asc" } }),
    ]);

  const enEdition = f.edit ? membres.find((m) => m.id === f.edit) : undefined;
  const cibleDroits = f.droits
    ? await prisma.user.findUnique({
        where: { id: f.droits },
        include: {
          rank: { include: { permissions: { include: { permission: true } } } },
          grade: { include: { permissions: { include: { permission: true } } } },
          councilRole: { include: { permissions: { include: { permission: true } } } },
          permissions: { include: { permission: true } },
        },
      })
    : null;

  // Droits hérités du rang, du grade et de la fonction de Conseil.
  const herites = new Set<string>();
  if (cibleDroits) {
    for (const rp of cibleDroits.rank.permissions) herites.add(rp.permission.key);
    for (const gp of cibleDroits.grade?.permissions ?? []) herites.add(gp.permission.key);
    for (const cp of cibleDroits.councilRole?.permissions ?? []) herites.add(cp.permission.key);
  }
  const surcharges = new Map(
    (cibleDroits?.permissions ?? []).map((up) => [up.permission.key, up.granted]),
  );

  return (
    <>
      <EnTetePage
        surTitre="Administration"
        titre="Membres & rôles"
        icone="parametres"
        texte="Créer un compte, attribuer un rang, une branche, un grade, une fonction de Conseil et des métiers. Réservé aux Patriarches et au Sénéchal."
        actions={
          <>
            <LienBouton href="/annuaire" variante="argent" icone="membres">
              Annuaire
            </LienBouton>
            <LienBouton href="/gouvernance/membres#saisie" variante="or" icone="plus">
              Nouveau membre
            </LienBouton>
          </>
        }
      />

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Membres" valeur={membres.filter((m) => m.status !== "archive").length} icone="membres" />
        <Stat
          label="En période d'essai"
          valeur={membres.filter((m) => m.status === "essai").length}
          icone="horloge"
          tone="attente"
        />
        <Stat
          label="Archivés"
          valeur={membres.filter((m) => m.status === "archive").length}
          icone="archive"
        />
        <Stat label="Comptes Discord liés" valeur={membres.filter((m) => m.discordId).length} icone="discord" />
      </section>

      <Filtres
        action="/gouvernance/membres"
        valeurs={f}
        total={membres.length}
        champs={[
          { type: "recherche", nom: "q", placeholder: "Nom RP ou identifiant…" },
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

      <Carte padding={false} className="mb-6">
        <Tableau
          donnees={membres}
          cle={(m) => m.id}
          lien={(m) => `/membres/${m.id}`}
          vide="Aucun membre"
          videIcone="membres"
          colonnes={[
            {
              cle: "nom",
              entete: "Membre",
              principal: true,
              rendu: (m) => (
                <span className="flex items-center gap-2.5">
                  <Avatar
                    nom={m.nomRp}
                    url={m.avatarUrl}
                    taille={26}
                    anneau={m.rank.level <= 2 ? "rgba(210,184,115,0.6)" : undefined}
                  />
                  <span>
                    <span className="block text-givre-50">{m.nomRp}</span>
                    <span className="block text-[0.68rem] text-givre-300/45">{m.login}</span>
                  </span>
                </span>
              ),
            },
            {
              cle: "rang",
              entete: "Rang",
              rendu: (m) => (
                <span style={{ color: m.rank.color }} className="text-[0.8rem]">
                  {m.rank.label}
                </span>
              ),
            },
            {
              cle: "branche",
              entete: "Branche & grade",
              rendu: (m) =>
                m.branch ? (
                  <span className="text-[0.78rem]" style={{ color: m.branch.color }}>
                    {m.grade ? `${m.grade.label} — ` : ""}
                    {m.branch.label}
                  </span>
                ) : (
                  <span className="text-givre-300/30">—</span>
                ),
            },
            {
              cle: "conseil",
              entete: "Conseil",
              masquerMobile: true,
              rendu: (m) =>
                m.councilRole ? <Badge tone="attente">{m.councilRole.label}</Badge> : <span className="text-givre-300/30">—</span>,
            },
            {
              cle: "metiers",
              entete: "Métiers",
              masquerMobile: true,
              rendu: (m) => (
                <span className="text-[0.74rem] text-givre-300/65">
                  {m.metiers.map((um) => um.metier.label).join(", ") || "—"}
                </span>
              ),
            },
            {
              cle: "entree",
              entete: "Entré",
              masquerMobile: true,
              rendu: (m) => (
                <span className="text-[0.74rem] text-givre-300/60" title={date(m.dateEntree)}>
                  {relatif(m.dateEntree)}
                </span>
              ),
            },
            {
              cle: "statut",
              entete: "Statut",
              rendu: (m) => <BadgeStatut famille="membre" valeur={m.status} />,
            },
          ]}
          actions={(m) => (
            <>
              <Link
                href={`/gouvernance/membres?edit=${m.id}#saisie`}
                className="inline-flex items-center gap-1.5 rounded-[2px] border border-argent-500/25 px-2 py-1 text-[0.7rem] text-givre-200 transition-colors hover:bg-nuit-600/70"
              >
                <Icone nom="modifier" taille={12} />
                Modifier
              </Link>
              {gereRoles && (
                <Link
                  href={`/gouvernance/membres?droits=${m.id}#droits`}
                  className="inline-flex items-center gap-1.5 rounded-[2px] border border-or-500/30 px-2 py-1 text-[0.7rem] text-or-200 transition-colors hover:bg-or-500/12"
                >
                  <Icone nom="senechal" taille={12} />
                  Droits
                </Link>
              )}
            </>
          )}
        />
      </Carte>

      {/* ── Droits individuels ── */}
      {cibleDroits && gereRoles && (
        <Carte
          titre={`Droits de ${cibleDroits.nomRp}`}
          sousTitre="Les droits hérités viennent du rang, du grade et de la fonction de Conseil. Vous pouvez en accorder ou en retirer un individuellement."
          icone="senechal"
          className="mb-6"
          actions={
            <LienBouton href="/gouvernance/membres" variante="fantome" taille="sm" icone="refuser">
              Fermer
            </LienBouton>
          }
        >
          <div id="droits" className="scroll-mt-20 space-y-5">
            {[...new Set(PERMISSION_CATALOG.map((p) => p.category))].map((cat) => (
              <div key={cat}>
                <p className="mb-2 text-[0.66rem] tracking-[0.16em] text-or-400/60 uppercase">{cat}</p>
                <div className="grid gap-1.5 lg:grid-cols-2">
                  {PERMISSION_CATALOG.filter((p) => p.category === cat).map((p) => {
                    const perm = permissions.find((x) => x.key === p.key);
                    if (!perm) return null;
                    const surcharge = surcharges.get(p.key);
                    const herite = herites.has(p.key);
                    const effectif = surcharge ?? herite;

                    return (
                      <div
                        key={p.key}
                        className={`flex items-center gap-2 rounded-[2px] border px-2.5 py-1.5 ${
                          effectif ? "border-succes/25 bg-succes/6" : "border-argent-500/12"
                        }`}
                      >
                        <Icone
                          nom={effectif ? "valider" : "refuser"}
                          taille={12}
                          className={effectif ? "text-[#8fd0a3]" : "text-givre-300/30"}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[0.76rem] text-givre-100">
                            {p.label}
                          </span>
                          <span className="block text-[0.6rem] text-givre-300/40">
                            {surcharge === true
                              ? "accordé individuellement"
                              : surcharge === false
                                ? "retiré individuellement"
                                : herite
                                  ? "hérité du rôle"
                                  : "non accordé"}
                          </span>
                        </span>
                        <form action={actionDroitMembre} className="flex shrink-0 gap-1">
                          <input type="hidden" name="userId" value={cibleDroits.id} />
                          <input type="hidden" name="permissionId" value={perm.id} />
                          <button
                            type="submit"
                            name="mode"
                            value="accorder"
                            title="Accorder"
                            className="grid size-6 place-items-center rounded-[2px] border border-succes/30 text-[#8fd0a3] transition-colors hover:bg-succes/15"
                          >
                            <Icone nom="valider" taille={11} />
                          </button>
                          <button
                            type="submit"
                            name="mode"
                            value="retirer"
                            title="Retirer"
                            className="grid size-6 place-items-center rounded-[2px] border border-danger/30 text-[#e69a8c] transition-colors hover:bg-danger/15"
                          >
                            <Icone nom="refuser" taille={11} />
                          </button>
                          <button
                            type="submit"
                            name="mode"
                            value="defaut"
                            title="Revenir au rôle"
                            className="grid size-6 place-items-center rounded-[2px] border border-argent-500/25 text-givre-300/70 transition-colors hover:bg-nuit-600/70"
                          >
                            <Icone nom="retour" taille={11} />
                          </button>
                        </form>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Carte>
      )}

      <Carte
        titre={enEdition ? `Modifier — ${enEdition.nomRp}` : "Créer un membre"}
        sousTitre="L'inscription libre est interdite : les comptes sont créés ici, par les Patriarches et le Sénéchal."
        icone={enEdition ? "modifier" : "plus"}
        actions={
          enEdition && (
            <LienBouton href="/gouvernance/membres" variante="fantome" taille="sm" icone="refuser">
              Annuler
            </LienBouton>
          )
        }
      >
        <div id="saisie" className="scroll-mt-20">
          <FormulaireMembre
            key={enEdition?.id ?? "nouveau"}
            id={enEdition?.id}
            rangs={rangs.map((r) => ({ value: r.id, label: r.label }))}
            branches={branches.map((b) => ({ value: b.id, label: b.label }))}
            grades={grades.map((g) => ({
              value: g.id,
              label: g.label,
              branchId: g.branchId,
              level: g.level,
            }))}
            conseils={conseils.map((c) => ({ value: c.id, label: c.label }))}
            cercles={cercles.map((c) => ({ value: c.id, label: c.label }))}
            membres={membres.map((m) => ({ value: m.id, label: m.nomRp }))}
            metiers={metiers.map((m) => ({ value: m.id, label: m.label, category: m.category }))}
            metiersInitiaux={enEdition?.metiers.map((um) => ({
              metierId: um.metierId,
              niveau: um.niveau,
            }))}
            valeurs={
              enEdition
                ? {
                    nomRp: enEdition.nomRp,
                    login: enEdition.login,
                    discordUsername: enEdition.discordUsername ?? "",
                    rankId: enEdition.rankId,
                    branchId: enEdition.branchId ?? "",
                    gradeId: enEdition.gradeId ?? "",
                    councilRoleId: enEdition.councilRoleId ?? "",
                    circleId: enEdition.circleId ?? "",
                    status: enEdition.status,
                    presentedById: enEdition.presentedById ?? "",
                    bio: enEdition.bio,
                  }
                : undefined
            }
          />
        </div>
      </Carte>
    </>
  );
}
