import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Avatar,
  Badge,
  BadgeStatut,
  Carte,
  Definitions,
  LienBouton,
  Ornement,
  Stat,
  Vide,
} from "@/components/ui/base";
import { Icone, iconeMetier } from "@/components/ui/Icone";
import { Recit } from "@/components/ui/Recit";
import { Tableau } from "@/components/ui/Tableau";
import { exigerMembre, peut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { METIER_NIVEAUX, PERMISSIONS as P } from "@/lib/domain";
import { date, nombre, relatif, septims } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const u = await prisma.user.findUnique({ where: { id }, select: { nomRp: true } });
  return { title: u?.nomRp ?? "Membre" };
}

export default async function FicheMembre({ params }: { params: Promise<{ id: string }> }) {
  const moi = await exigerMembre();
  const { id } = await params;

  const m = await prisma.user.findUnique({
    where: { id },
    include: {
      rank: true,
      branch: true,
      grade: true,
      councilRole: true,
      circle: true,
      metiers: { include: { metier: true }, orderBy: { isPrimary: "desc" } },
      presentedBy: { select: { id: true, nomRp: true } },
      filleuls: { select: { id: true, nomRp: true, status: true } },
      ledCircles: { select: { id: true, label: true } },
    },
  });
  if (!m) notFound();

  const cestMoi = m.id === moi.id;
  const voitStash = cestMoi || peut(moi, P.INVENTORY_HOUSE_MANAGE, P.ADMIN_MEMBERS);
  const voitSanctions = peut(moi, P.ADMIN_SANCTIONS);

  const [stash, commandes, permis, rapports, sanctions, mouvements] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { ownerType: "membre", ownerUserId: m.id },
      include: { material: true },
      orderBy: { quantity: "desc" },
    }),
    prisma.craftOrder.findMany({
      where: { artisanId: m.id },
      orderBy: { dateCommande: "desc" },
      take: 6,
    }),
    prisma.harvestPermit.findMany({
      where: { demandeurId: m.id },
      include: { material: true },
      orderBy: { dateEmission: "desc" },
      take: 5,
    }),
    prisma.report.findMany({
      where: { auteurId: m.id },
      orderBy: { date: "desc" },
      take: 4,
    }),
    voitSanctions
      ? prisma.sanction.findMany({
          where: { userId: m.id },
          include: { decidePar: { select: { nomRp: true } } },
          orderBy: { date: "desc" },
        })
      : [],
    prisma.inventoryMovement.count({ where: { userId: m.id } }),
  ]);

  const valeurStash = stash.reduce((s, i) => s + i.quantity * (i.unitValue ?? 0), 0);
  const du = commandes.filter((c) => c.resteAPayer > 0 && c.etat !== "annulee");

  return (
    <>
      {/* ── En-tête de fiche ── */}
      <section className="carte carte-texture relative mb-6 overflow-hidden">
        {m.branch && (
          <span
            className="absolute inset-x-0 top-0 h-[2px]"
            style={{ background: `linear-gradient(90deg, transparent, ${m.branch.color}, transparent)` }}
          />
        )}
        <div className="flex flex-wrap items-start gap-5 p-5 sm:p-6">
          <Avatar
            nom={m.nomRp}
            url={m.avatarUrl}
            taille={84}
            anneau={m.rank.level <= 2 ? "rgba(210,184,115,0.6)" : undefined}
          />
          <div className="min-w-0 flex-1">
            <p className="sur-titre">{m.rank.label}</p>
            <h1 className="titre-imperial mt-1 flex flex-wrap items-center gap-3 text-2xl text-givre-50">
              {m.nomRp}
              {m.rank.level <= 2 && <Icone nom="lune" taille={18} className="text-or-400" />}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {m.councilRole && (
                <Badge tone="attente">
                  <Icone nom={m.councilRole.icon} taille={10} />
                  {m.councilRole.label}
                </Badge>
              )}
              {m.branch && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.68rem]"
                  style={{
                    borderColor: `${m.branch.color}55`,
                    background: `${m.branch.color}14`,
                    color: m.branch.color,
                  }}
                >
                  <Icone nom={m.branch.icon} taille={11} />
                  {m.grade ? `${m.grade.label} — ${m.branch.label}` : m.branch.label}
                </span>
              )}
              {m.circle && <Badge tone="actif">{m.circle.label}</Badge>}
              {m.ledCircles.map((c) => (
                <Badge key={c.id} tone="attente">
                  Chef — {c.label}
                </Badge>
              ))}
              <BadgeStatut famille="membre" valeur={m.status} />
            </div>

            {m.metiers.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {m.metiers.map((um) => (
                  <Link
                    key={um.id}
                    href={um.metier.isProducer ? `/economie/ateliers/${um.metier.key}` : "/economie/ateliers"}
                    className="inline-flex items-center gap-1.5 rounded-[2px] border border-argent-500/20 bg-nuit-950/40 px-2.5 py-1 text-[0.72rem] text-givre-200/85 transition-colors hover:border-or-500/35 hover:text-or-200"
                  >
                    <Icone nom={iconeMetier(um.metier.key, um.metier.category)} taille={12} />
                    {um.metier.label}
                    <span className="text-givre-300/45">
                      · {METIER_NIVEAUX.find((n) => n.value === um.niveau)?.label ?? um.niveau}
                    </span>
                    {um.isPrimary && <Icone nom="lune" taille={9} className="text-or-400/70" />}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-2">
            {cestMoi && (
              <LienBouton href="/economie/mon-stash" variante="or" taille="sm" icone="stash">
                Mon stash
              </LienBouton>
            )}
            {peut(moi, P.ADMIN_MEMBERS) && (
              <LienBouton
                href={`/gouvernance/membres?edit=${m.id}`}
                variante="argent"
                taille="sm"
                icone="modifier"
              >
                Modifier la fiche
              </LienBouton>
            )}
            <LienBouton href="/organigramme" variante="fantome" taille="sm" icone="organigramme">
              Organigramme
            </LienBouton>
          </div>
        </div>

        {m.bio && (
          <div className="border-t border-argent-500/12 px-5 py-4 sm:px-6">
            <Recit texte={m.bio} className="!text-[0.95rem] text-givre-200/85" />
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* ── Chiffres ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Lignes de stash" valeur={stash.length} icone="stash" />
            {voitStash && <Stat label="Valeur du stash" valeur={septims(valeurStash)} icone="septim" />}
            <Stat label="Commandes" valeur={commandes.length} icone="commande" />
            <Stat
              label="Impayés"
              valeur={septims(du.reduce((s, c) => s + c.resteAPayer, 0))}
              icone="impaye"
              tone={du.length > 0 ? "danger" : "succes"}
            />
          </div>

          {/* ── Stash ── */}
          {voitStash ? (
            <Carte
              titre="Stash personnel"
              sousTitre={`${nombre(mouvements)} mouvement(s) enregistré(s) au stock commun`}
              icone="stash"
              padding={false}
            >
              <Tableau
                donnees={stash}
                cle={(i) => i.id}
                vide="Stash vide"
                videIcone="stash"
                videTexte="Aucune matière déclarée pour l'instant."
                colonnes={[
                  {
                    cle: "matiere",
                    entete: "Matière",
                    principal: true,
                    rendu: (i) => (
                      <span className="text-givre-50">{i.material?.label ?? i.customLabel}</span>
                    ),
                  },
                  {
                    cle: "cat",
                    entete: "Catégorie",
                    masquerMobile: true,
                    rendu: (i) => (
                      <span className="text-givre-300/70">{i.material?.category ?? i.category}</span>
                    ),
                  },
                  {
                    cle: "qte",
                    entete: "Quantité",
                    numerique: true,
                    rendu: (i) => (
                      <span>
                        {nombre(i.quantity)}{" "}
                        <span className="text-givre-300/50">{i.unit}</span>
                      </span>
                    ),
                  },
                  {
                    cle: "val",
                    entete: "Valeur",
                    numerique: true,
                    rendu: (i) => septims(i.quantity * (i.unitValue ?? 0)),
                  },
                ]}
              />
            </Carte>
          ) : (
            <Carte titre="Stash personnel" icone="stash">
              <p className="text-[0.82rem] text-givre-300/60">
                {stash.length} ligne(s) d'inventaire. Le détail d'un stash n'est visible que par son
                propriétaire et par l'Intendant.
              </p>
            </Carte>
          )}

          {/* ── Commandes ── */}
          <Carte titre="Commandes de l'artisan" icone="commande" padding={false}>
            <Tableau
              donnees={commandes}
              cle={(c) => c.id}
              vide="Aucune commande"
              videIcone="commande"
              colonnes={[
                { cle: "objet", entete: "Objet", principal: true, rendu: (c) => c.objets },
                { cle: "client", entete: "Client", rendu: (c) => c.clientNomRp },
                {
                  cle: "prix",
                  entete: "Prix",
                  numerique: true,
                  rendu: (c) => septims(c.prixConvenu),
                },
                {
                  cle: "reste",
                  entete: "Reste dû",
                  numerique: true,
                  rendu: (c) =>
                    c.resteAPayer > 0 ? (
                      <span className="text-[#e69a8c]">{septims(c.resteAPayer)}</span>
                    ) : (
                      <span className="text-[#8fd0a3]">soldé</span>
                    ),
                },
                {
                  cle: "etat",
                  entete: "État",
                  rendu: (c) => <BadgeStatut famille="commande" valeur={c.etat} />,
                },
              ]}
            />
          </Carte>

          {/* ── Permis ── */}
          <Carte titre="Permis de récolte" icone="permis" padding={false}>
            <Tableau
              donnees={permis}
              cle={(p) => p.id}
              vide="Aucun permis"
              videIcone="permis"
              colonnes={[
                {
                  cle: "res",
                  entete: "Ressource",
                  principal: true,
                  rendu: (p) => p.material?.label ?? p.ressource,
                },
                { cle: "zone", entete: "Zone", rendu: (p) => p.zone || "—" },
                {
                  cle: "qte",
                  entete: "Récolté / autorisé",
                  numerique: true,
                  rendu: (p) => `${nombre(p.quantiteRecoltee)} / ${nombre(p.quantiteAutorisee)}`,
                },
                {
                  cle: "statut",
                  entete: "Statut",
                  rendu: (p) => <BadgeStatut famille="permis" valeur={p.statut} />,
                },
              ]}
            />
          </Carte>

          {rapports.length > 0 && (
            <Carte titre="Rapports déposés" icone="rapport" padding={false}>
              <ul className="divide-y divide-argent-500/10">
                {rapports.map((r) => (
                  <li key={r.id} className="px-4 py-3">
                    <p className="text-[0.86rem] text-givre-50">{r.titre || "Rapport"}</p>
                    <p className="mt-1 text-[0.76rem] leading-relaxed text-givre-300/70">{r.resume}</p>
                    <p className="mt-1 text-[0.68rem] text-givre-300/45">{date(r.date)}</p>
                  </li>
                ))}
              </ul>
            </Carte>
          )}
        </div>

        {/* ── Colonne latérale ── */}
        <div className="space-y-6">
          <Carte titre="État civil" icone="registre">
            <Definitions
              colonnes={1}
              items={[
                ["Rang", m.rank.label],
                ["Branche", m.branch?.label ?? "—"],
                ["Grade", m.grade?.label ?? "—"],
                ["Fonction de Conseil", m.councilRole?.label ?? "—"],
                ["Cercle", m.circle?.label ?? "—"],
                [
                  "Présenté par",
                  m.presentedBy ? (
                    <Link href={`/membres/${m.presentedBy.id}`} className="text-or-300 hover:underline">
                      {m.presentedBy.nomRp}
                    </Link>
                  ) : (
                    "—"
                  ),
                ],
                ["Entré dans la Maison", `${date(m.dateEntree)} · ${relatif(m.dateEntree)}`],
                ...(m.dateSortie ? ([["Sortie", date(m.dateSortie)]] as [string, string][]) : []),
                ["Discord", m.discordUsername || "—"],
                ["Dernière présence", m.lastSeenAt ? relatif(m.lastSeenAt) : "—"],
              ]}
            />
          </Carte>

          {m.filleuls.length > 0 && (
            <Carte titre="Membres parrainés" icone="membres" padding={false}>
              <ul className="divide-y divide-argent-500/10">
                {m.filleuls.map((f) => (
                  <li key={f.id}>
                    <Link
                      href={`/membres/${f.id}`}
                      className="flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-nuit-700/40"
                    >
                      <Avatar nom={f.nomRp} taille={26} />
                      <span className="flex-1 truncate text-[0.82rem] text-givre-100">{f.nomRp}</span>
                      {f.status === "essai" && <Badge tone="attente">essai</Badge>}
                    </Link>
                  </li>
                ))}
              </ul>
            </Carte>
          )}

          {voitSanctions && (
            <Carte titre="Dossier disciplinaire" icone="sanction" padding={false}>
              {sanctions.length === 0 ? (
                <Vide titre="Dossier vierge" icone="valider" texte="Aucune sanction prononcée." />
              ) : (
                <ul className="divide-y divide-argent-500/10">
                  {sanctions.map((s) => (
                    <li key={s.id} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[0.82rem] text-givre-50">
                          {s.type.replace(/_/g, " ")}
                        </span>
                        <BadgeStatut famille="sanction" valeur={s.statut} />
                      </div>
                      <p className="mt-1 text-[0.76rem] text-givre-300/70">{s.motif}</p>
                      <p className="mt-1 text-[0.66rem] text-givre-300/45">
                        {date(s.date)} · {s.decidePar?.nomRp ?? "—"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Carte>
          )}

          <Carte titre="La devise" icone="lune">
            <Ornement />
            <p className="recit my-4 text-center text-[0.95rem] text-givre-200/80 italic">
              « Nés sans titre, élevés par nos actes. »
            </p>
            <Ornement />
          </Carte>
        </div>
      </div>
    </>
  );
}
