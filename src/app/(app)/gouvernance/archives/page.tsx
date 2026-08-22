import Link from "next/link";
import type { Metadata } from "next";
import { Avatar, Badge, BadgeStatut, Carte, EnTetePage, Stat, Vide } from "@/components/ui/base";
import { Tableau } from "@/components/ui/Tableau";
import { ChiffresProduction, ComptesRendus } from "@/components/economie/ComptesRendus";
import { exigerDroit } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PERMISSIONS as P } from "@/lib/domain";
import { date, relatif, septims } from "@/lib/format";

export const metadata: Metadata = { title: "Archives" };
export const dynamic = "force-dynamic";

export default async function Archives({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string; metier?: string }>;
}) {
  await exigerDroit(P.ARCHIVES_READ);
  const f = await searchParams;

  const [partis, commandes, missions, contrats, permis, patrouilles] = await Promise.all([
    prisma.user.findMany({
      where: { status: "archive" },
      include: {
        rank: true,
        branch: true,
        grade: true,
        presentedBy: { select: { nomRp: true } },
      },
      orderBy: { dateSortie: "desc" },
    }),
    prisma.craftOrder.findMany({
      where: { etat: { in: ["livree", "annulee"] } },
      orderBy: { dateCommande: "desc" },
      take: 60,
      include: { artisan: { select: { id: true, nomRp: true } } },
    }),
    prisma.mission.findMany({
      where: { statut: { in: ["reussie", "echouee"] } },
      orderBy: { date: "desc" },
      take: 40,
      include: { branch: { select: { label: true } } },
    }),
    prisma.contract.findMany({
      where: { statut: { in: ["rompu", "expire"] } },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
    prisma.harvestPermit.findMany({
      where: { statut: { in: ["expire", "refuse"] } },
      orderBy: { dateEmission: "desc" },
      take: 40,
      include: { demandeur: { select: { id: true, nomRp: true } } },
    }),
    prisma.patrol.findMany({
      where: { statut: { in: ["effectuee", "annulee"] } },
      orderBy: { date: "desc" },
      take: 40,
    }),
  ]);

  return (
    <>
      <EnTetePage
        surTitre="Mémoire de la Maison"
        titre="Archives"
        icone="archive"
        texte="Les comptes rendus de production, les membres partis et les entrées clôturées. Rien ne s'efface : ce qui a été fait reste consigné."
      />

      <ChiffresProduction />

      <div className="mb-6">
        <ComptesRendus periode={f.periode} metierCle={f.metier} />
      </div>

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Membres archivés" valeur={partis.length} icone="membres" />
        <Stat label="Commandes closes" valeur={commandes.length} icone="commande" />
        <Stat label="Missions closes" valeur={missions.length} icone="mission" />
        <Stat label="Permis clos" valeur={permis.length} icone="permis" />
      </section>

      <div className="space-y-6">
        <Carte
          titre="Membres partis"
          sousTitre="Ceux qui ont porté le nom de Givrelune"
          icone="membres"
          padding={false}
        >
          {partis.length === 0 ? (
            <Vide titre="Personne n'est parti" icone="membres" texte="La Maison est au complet." />
          ) : (
            <ul className="divide-y divide-argent-500/10">
              {partis.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                  <Avatar nom={m.nomRp} url={m.avatarUrl} taille={34} />
                  <div className="min-w-[180px] flex-1">
                    <Link
                      href={`/membres/${m.id}`}
                      className="text-[0.88rem] text-givre-50 hover:text-or-300"
                    >
                      {m.nomRp}
                    </Link>
                    <p className="mt-0.5 text-[0.72rem] text-givre-300/60">
                      {m.rank.label}
                      {m.branch && ` · ${m.grade ? `${m.grade.label} — ` : ""}${m.branch.label}`}
                      {m.presentedBy && ` · présenté par ${m.presentedBy.nomRp}`}
                    </p>
                  </div>
                  <span className="text-[0.72rem] text-givre-300/50">
                    Entré {date(m.dateEntree)}
                    {m.dateSortie && ` · sorti ${date(m.dateSortie)}`}
                  </span>
                  <BadgeStatut famille="membre" valeur={m.status} />
                </li>
              ))}
            </ul>
          )}
        </Carte>

        <Carte titre="Commandes livrées ou annulées" icone="commande" padding={false}>
          <Tableau
            donnees={commandes}
            cle={(c) => c.id}
            vide="Aucune commande close"
            videIcone="commande"
            colonnes={[
              { cle: "objets", entete: "Objet(s)", principal: true, rendu: (c) => c.objets },
              { cle: "client", entete: "Client", rendu: (c) => c.clientNomRp },
              {
                cle: "artisan",
                entete: "Artisan",
                masquerMobile: true,
                rendu: (c) =>
                  c.artisan ? (
                    <Link href={`/membres/${c.artisan.id}`} className="hover:text-or-300">
                      {c.artisan.nomRp}
                    </Link>
                  ) : (
                    "—"
                  ),
              },
              {
                cle: "prix",
                entete: "Prix",
                numerique: true,
                rendu: (c) => septims(c.prixConvenu),
              },
              { cle: "date", entete: "Commandée", rendu: (c) => date(c.dateCommande) },
              {
                cle: "etat",
                entete: "État",
                rendu: (c) => <BadgeStatut famille="commande" valeur={c.etat} />,
              },
            ]}
          />
        </Carte>

        <div className="grid gap-6 lg:grid-cols-2">
          <Carte titre="Missions closes" icone="mission" padding={false}>
            <Tableau
              donnees={missions}
              cle={(m) => m.id}
              vide="Aucune mission close"
              videIcone="mission"
              colonnes={[
                { cle: "titre", entete: "Mission", principal: true, rendu: (m) => m.titre },
                {
                  cle: "branche",
                  entete: "Branche",
                  rendu: (m) => m.branch?.label ?? "—",
                },
                { cle: "date", entete: "Date", rendu: (m) => date(m.date) },
                {
                  cle: "statut",
                  entete: "Issue",
                  rendu: (m) => <BadgeStatut famille="mission" valeur={m.statut} />,
                },
              ]}
            />
          </Carte>

          <Carte titre="Contrats rompus ou expirés" icone="contrat" padding={false}>
            <Tableau
              donnees={contrats}
              cle={(c) => c.id}
              vide="Aucun contrat clos"
              videIcone="contrat"
              colonnes={[
                { cle: "titre", entete: "Contrat", principal: true, rendu: (c) => c.titre },
                { cle: "parties", entete: "Parties", rendu: (c) => c.parties },
                {
                  cle: "montant",
                  entete: "Montant",
                  numerique: true,
                  rendu: (c) => septims(c.montant),
                },
                {
                  cle: "statut",
                  entete: "Statut",
                  rendu: (c) => <BadgeStatut famille="contrat" valeur={c.statut} />,
                },
              ]}
            />
          </Carte>

          <Carte titre="Permis clos" icone="permis" padding={false}>
            <Tableau
              donnees={permis}
              cle={(p) => p.id}
              vide="Aucun permis clos"
              videIcone="permis"
              colonnes={[
                { cle: "res", entete: "Ressource", principal: true, rendu: (p) => p.ressource || "—" },
                {
                  cle: "dem",
                  entete: "Demandeur",
                  rendu: (p) => p.demandeur?.nomRp ?? p.demandeurNom ?? "—",
                },
                { cle: "date", entete: "Émis", rendu: (p) => date(p.dateEmission) },
                {
                  cle: "statut",
                  entete: "Statut",
                  rendu: (p) => <BadgeStatut famille="permis" valeur={p.statut} />,
                },
              ]}
            />
          </Carte>

          <Carte titre="Patrouilles closes" icone="patrouille" padding={false}>
            <Tableau
              donnees={patrouilles}
              cle={(p) => p.id}
              vide="Aucune patrouille close"
              videIcone="patrouille"
              colonnes={[
                { cle: "zone", entete: "Zone", principal: true, rendu: (p) => p.zone },
                { cle: "pat", entete: "Patrouilleurs", rendu: (p) => p.patrouilleurs },
                {
                  cle: "date",
                  entete: "Date",
                  rendu: (p) => (
                    <span title={date(p.date)}>{relatif(p.date)}</span>
                  ),
                },
                {
                  cle: "statut",
                  entete: "Statut",
                  rendu: (p) => <BadgeStatut famille="patrouille" valeur={p.statut} />,
                },
              ]}
            />
          </Carte>
        </div>
      </div>
    </>
  );
}
