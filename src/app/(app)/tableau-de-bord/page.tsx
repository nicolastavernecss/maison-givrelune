import Link from "next/link";
import type { Metadata } from "next";
import {
  Badge,
  BadgeStatut,
  Carte,
  Definitions,
  Jauge,
  LienBouton,
  Message,
  Ornement,
  Stat,
  Vide,
} from "@/components/ui/base";
import { Icone, iconeMetier } from "@/components/ui/Icone";
import { actionPrisePoste } from "@/app/actions/vie";
import { exigerMembre, peut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MAISON, etatPoste, PERMISSIONS as P } from "@/lib/domain";
import { dureePoste, monPoste, postesOuverts } from "@/lib/presence";
import { date, nombre, relatif, septims, tronquer } from "@/lib/format";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function TableauDeBord({
  searchParams,
}: {
  searchParams: Promise<{ refus?: string }>;
}) {
  const membre = await exigerMembre();
  const { refus } = await searchParams;

  const [
    mesCommandes,
    mesImpayes,
    mesPermis,
    mesObjectifs,
    mesPatrouilles,
    annonces,
    evenements,
    monStash,
    totalDu,
    tresorerie,
    alertesStock,
    demandes,
    dernieresBranche,
    monPosteOuvert,
    presents,
  ] = await Promise.all([
    prisma.craftOrder.findMany({
      where: { artisanId: membre.id, etat: { in: ["en_attente", "en_fabrication", "prete"] } },
      orderBy: { dateLivraisonPrevue: "asc" },
      take: 5,
      include: { metier: true },
    }),
    prisma.craftOrder.findMany({
      where: { artisanId: membre.id, resteAPayer: { gt: 0 }, etat: { not: "annulee" } },
      select: { id: true, clientNomRp: true, resteAPayer: true, etat: true },
    }),
    prisma.harvestPermit.findMany({
      where: { demandeurId: membre.id, statut: { in: ["en_attente", "accorde"] } },
      orderBy: { dateEmission: "desc" },
      take: 4,
      include: { material: true },
    }),
    prisma.objective.findMany({
      where: { responsableId: membre.id, statut: "en_cours" },
      orderBy: { echeance: "asc" },
      take: 3,
    }),
    prisma.patrol.findMany({
      where: { statut: "planifiee", date: { gte: new Date(Date.now() - 86_400_000) } },
      orderBy: { date: "asc" },
      take: 3,
      include: { circle: true },
    }),
    prisma.announcement.findMany({
      where: membre.branchId ? { OR: [{ branchId: null }, { branchId: membre.branchId }] } : {},
      orderBy: [{ epingle: "desc" }, { createdAt: "desc" }],
      take: 3,
      include: { auteur: { select: { nomRp: true } }, branch: { select: { label: true } } },
    }),
    prisma.event.findMany({
      where: { date: { gte: new Date() }, statut: { not: "annule" } },
      orderBy: { date: "asc" },
      take: 3,
      include: { rsvps: { where: { userId: membre.id } }, _count: { select: { rsvps: true } } },
    }),
    prisma.inventoryItem.findMany({
      where: { ownerType: "membre", ownerUserId: membre.id },
      select: { quantity: true, unitValue: true },
    }),
    peut(membre, P.ORDER_READ)
      ? prisma.craftOrder.aggregate({
          where: { resteAPayer: { gt: 0 }, etat: { not: "annulee" } },
          _sum: { resteAPayer: true },
          _count: true,
        })
      : null,
    peut(membre, P.TREASURY_READ) ? prisma.treasury.findUnique({ where: { id: "maison" } }) : null,
    peut(membre, P.INVENTORY_HOUSE_READ)
      ? prisma.inventoryItem.findMany({
          where: { ownerType: "maison", seuilBas: { not: null } },
          include: { material: true },
        })
      : [],
    peut(membre, P.ROLE_REQUEST_READ)
      ? prisma.roleRequest.count({ where: { statut: "en_attente" } })
      : 0,
    membre.branchId
      ? prisma.mission.findMany({
          where: { branchId: membre.branchId },
          orderBy: { createdAt: "desc" },
          take: 4,
        })
      : [],
    monPoste(membre.id),
    postesOuverts(),
  ]);

  const valeurStash = monStash.reduce((s, i) => s + i.quantity * (i.unitValue ?? 0), 0);
  const monDu = mesImpayes.reduce((s, c) => s + c.resteAPayer, 0);
  const sousSeuil = alertesStock.filter((i) => i.seuilBas !== null && i.quantity < i.seuilBas);

  const heure = new Date().getHours();
  const salut = heure < 6 ? "Nuit calme" : heure < 12 ? "Bonjour" : heure < 18 ? "Bon jour" : "Bonsoir";

  return (
    <>
      {/* ── Bandeau d'accueil ── */}
      <section className="carte carte-texture relative mb-6 overflow-hidden px-5 py-6 sm:px-7">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(520px 200px at 8% 0%, rgba(42,61,99,0.55), transparent 70%), radial-gradient(380px 200px at 92% 100%, rgba(189,156,77,0.09), transparent 70%)",
          }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="sur-titre">{salut}</p>
            <h1 className="titre-imperial mt-1.5 text-2xl text-givre-50 sm:text-3xl">
              {membre.nomRp}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone={membre.rank.level <= 2 ? "attente" : "neutre"}>{membre.rank.label}</Badge>
              {membre.councilRole && <Badge tone="attente">{membre.councilRole.label}</Badge>}
              {membre.branch && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.68rem]"
                  style={{
                    borderColor: `${membre.branch.color}55`,
                    background: `${membre.branch.color}14`,
                    color: membre.branch.color,
                  }}
                >
                  <Icone nom={membre.branch.icon} taille={11} />
                  {membre.grade ? `${membre.grade.label} — ${membre.branch.label}` : membre.branch.label}
                </span>
              )}
              {membre.circle && <Badge tone="actif">{membre.circle.label}</Badge>}
              {membre.status === "essai" && <Badge tone="attente">Période d'essai</Badge>}
            </div>
            {membre.metiers.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {membre.metiers.map((um) => (
                  <Link
                    key={um.id}
                    href={um.metier.isProducer ? `/economie/ateliers/${um.metier.key}` : "/economie/ateliers"}
                    className="inline-flex items-center gap-1.5 text-[0.74rem] text-givre-300/75 transition-colors hover:text-or-300"
                  >
                    <Icone nom={iconeMetier(um.metier.key, um.metier.category)} taille={13} />
                    {um.metier.label}
                    <span className="text-givre-300/45">· {um.niveau}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ── Prise de poste : la première chose à faire en arrivant ── */}
          <div className="w-full max-w-xs shrink-0 rounded-[2px] border border-argent-500/15 bg-nuit-950/45 p-4">
            {monPosteOuvert ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="size-2 shrink-0 animate-pulse rounded-full bg-succes" />
                  <p className="text-[0.78rem] text-[#8fd0a3]">
                    En poste depuis {dureePoste(monPosteOuvert.debutLe)}
                  </p>
                  <Badge tone={etatPoste(monPosteOuvert.etat).tone}>
                    {etatPoste(monPosteOuvert.etat).label}
                  </Badge>
                </div>
                <p className="mt-2 text-[0.72rem] text-givre-300/60">
                  {presents.length} membre{presents.length > 1 ? "s" : ""} en poste en ce moment
                  {presents.length > 1 &&
                    ` : ${presents
                      .filter((p) => p.userId !== membre.id)
                      .slice(0, 3)
                      .map((p) => p.user.nomRp)
                      .join(", ")}`}
                  .
                </p>
                <LienBouton
                  href="/presence"
                  variante="argent"
                  taille="sm"
                  icone="presence"
                  className="mt-3 w-full"
                >
                  Tableau de présence
                </LienBouton>
              </>
            ) : (
              <>
                <p className="sur-titre !text-[0.58rem]">Vous venez d'arriver</p>
                <p className="mt-1.5 text-[0.78rem] leading-relaxed text-givre-200/80">
                  Déclarez-vous en jeu : les gradés sauront qu'ils peuvent vous appeler sur une ronde.
                  {presents.length > 0 && (
                    <span className="text-[#8fd0a3]">
                      {" "}
                      {presents.length} déjà là.
                    </span>
                  )}
                </p>
                <form action={actionPrisePoste} className="mt-3">
                  <input type="hidden" name="etat" value="disponible" />
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-[2px] border border-or-300/50 bg-gradient-to-b from-or-400 to-or-600 px-3.5 py-2 text-[0.84rem] font-semibold text-nuit-950 transition-all hover:from-or-300 hover:to-or-500"
                  >
                    <Icone nom="valider" taille={15} />
                    Je prends mon poste
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {refus && (
        <div className="mb-6">
          <Message tone="danger" titre="Accès refusé">
            Votre rang ne vous ouvre pas cette porte. Adressez-vous à un gradé si vous pensez qu'il s'agit
            d'une erreur.
          </Message>
        </div>
      )}

      {/* ── Chiffres clés ── */}
      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Mes commandes"
          valeur={mesCommandes.length}
          sousTexte={mesCommandes.length ? "en cours de traitement" : "rien sur l'établi"}
          icone="commande"
          href="/economie/commandes"
        />
        <Stat
          label="Ce qu'on me doit"
          valeur={septims(monDu)}
          sousTexte={`${mesImpayes.length} commande${mesImpayes.length > 1 ? "s" : ""} impayée${mesImpayes.length > 1 ? "s" : ""}`}
          icone="impaye"
          tone={monDu > 0 ? "danger" : "succes"}
          href="/economie/impayes"
        />
        <Stat
          label="Mon stash"
          valeur={septims(valeurStash)}
          sousTexte={`${monStash.length} ligne${monStash.length > 1 ? "s" : ""} d'inventaire`}
          icone="stash"
          href="/economie/mon-stash"
        />
        {tresorerie ? (
          <Stat
            label="Coffre de la Maison"
            valeur={septims(tresorerie.septims)}
            sousTexte={`stock estimé ${septims(tresorerie.valeurStock)}`}
            icone="tresorerie"
            tone="attente"
            href="/economie/tresorerie"
          />
        ) : (
          <Stat
            label="Mes permis"
            valeur={mesPermis.length}
            sousTexte="récolte en cours de validité"
            icone="permis"
            href="/registres/permis-de-recolte"
          />
        )}
      </section>

      {/* ── Rappels ── */}
      {(totalDu?._count || sousSeuil.length > 0 || demandes > 0) && (
        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {totalDu && totalDu._count > 0 && (
            <Link href="/economie/impayes" className="block">
              <Message tone="danger" titre={`${totalDu._count} commande(s) impayée(s)`} icone="impaye">
                {septims(totalDu._sum.resteAPayer ?? 0)} restent dus à la Maison.
              </Message>
            </Link>
          )}
          {sousSeuil.length > 0 && (
            <Link href="/economie/stocks" className="block">
              <Message tone="alerte" titre={`${sousSeuil.length} matière(s) sous le seuil`} icone="stock">
                {sousSeuil
                  .slice(0, 3)
                  .map((i) => i.material?.label ?? i.customLabel)
                  .join(", ")}
                {sousSeuil.length > 3 && "…"}
              </Message>
            </Link>
          )}
          {demandes > 0 && (
            <Link href="/gouvernance/demandes" className="block">
              <Message tone="attente" titre={`${demandes} demande(s) de rôle`} icone="demande">
                En attente d'examen par un gradé.
              </Message>
            </Link>
          )}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* ── Colonne principale ── */}
        <div className="space-y-6">
          <Carte
            titre="Mes tâches"
            sousTitre="Ce qui attend votre main"
            icone="objectif"
            padding={false}
          >
            {mesCommandes.length === 0 && mesPermis.length === 0 && mesObjectifs.length === 0 ? (
              <Vide
                titre="Rien ne vous attend"
                texte="Aucune commande, aucun permis ni objectif à votre nom pour l'instant."
                icone="valider"
              />
            ) : (
              <ul className="divide-y divide-argent-500/10">
                {mesCommandes.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                    <Icone nom="commande" taille={16} className="shrink-0 text-or-400/70" />
                    <Link href="/economie/commandes" className="min-w-0 flex-1">
                      <p className="truncate text-[0.86rem] text-givre-50">{c.objets}</p>
                      <p className="truncate text-[0.72rem] text-givre-300/60">
                        {c.clientNomRp}
                        {c.dateLivraisonPrevue && ` · à livrer ${relatif(c.dateLivraisonPrevue)}`}
                      </p>
                    </Link>
                    <BadgeStatut famille="commande" valeur={c.etat} />
                  </li>
                ))}
                {mesPermis.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <Icone nom="permis" taille={16} className="shrink-0 text-or-400/70" />
                    <Link href="/registres/permis-de-recolte" className="min-w-0 flex-1">
                      <p className="truncate text-[0.86rem] text-givre-50">
                        {p.material?.label ?? p.ressource}
                      </p>
                      <p className="truncate text-[0.72rem] text-givre-300/60">
                        {nombre(p.quantiteRecoltee)} / {nombre(p.quantiteAutorisee)} {p.unite} · {p.zone || "zone libre"}
                      </p>
                    </Link>
                    <BadgeStatut famille="permis" valeur={p.statut} />
                  </li>
                ))}
                {mesObjectifs.map((o) => (
                  <li key={o.id} className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Icone nom="objectif" taille={16} className="shrink-0 text-or-400/70" />
                      <Link href="/operations/objectifs" className="min-w-0 flex-1">
                        <p className="truncate text-[0.86rem] text-givre-50">{o.intitule}</p>
                      </Link>
                      <span className="text-[0.72rem] tabular-nums text-givre-300/60">
                        {o.avancement} %
                      </span>
                    </div>
                    <div className="mt-2 pl-7">
                      <Jauge valeur={o.avancement} tone={o.avancement >= 75 ? "succes" : "actif"} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Carte>

          <Carte
            titre="Annonces"
            icone="annonce"
            padding={false}
            actions={
              <LienBouton href="/annonces" variante="fantome" taille="sm" icone="chevron">
                Toutes
              </LienBouton>
            }
          >
            {annonces.length === 0 ? (
              <Vide titre="Aucune annonce" icone="annonce" />
            ) : (
              <ul className="divide-y divide-argent-500/10">
                {annonces.map((a) => (
                  <li key={a.id} className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      {a.epingle && <Icone nom="lune" taille={12} className="text-or-400" />}
                      <p className="titre-imperial text-[0.88rem] text-givre-50">{a.titre}</p>
                      {a.branch && <Badge tone="neutre">{a.branch.label}</Badge>}
                    </div>
                    <p className="mt-1.5 text-[0.8rem] leading-relaxed text-givre-200/75">
                      {tronquer(a.contenu.replace(/\n+/g, " "), 190)}
                    </p>
                    <p className="mt-1.5 text-[0.68rem] text-givre-300/50">
                      {a.auteur?.nomRp} · {relatif(a.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Carte>

          {dernieresBranche.length > 0 && membre.branch && (
            <Carte
              titre={`Dernières entrées — ${membre.branch.label}`}
              icone={membre.branch.icon}
              padding={false}
            >
              <ul className="divide-y divide-argent-500/10">
                {dernieresBranche.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                    <Icone nom="mission" taille={15} className="shrink-0 text-givre-300/50" />
                    <Link href="/operations/missions" className="min-w-0 flex-1">
                      <p className="truncate text-[0.84rem] text-givre-50">{m.titre}</p>
                      <p className="truncate text-[0.7rem] text-givre-300/55">
                        {m.lieu || "lieu non précisé"} · {date(m.date)}
                      </p>
                    </Link>
                    <BadgeStatut famille="mission" valeur={m.statut} />
                  </li>
                ))}
              </ul>
            </Carte>
          )}
        </div>

        {/* ── Colonne latérale ── */}
        <div className="space-y-6">
          <Carte
            titre="Prochains événements"
            icone="calendrier"
            padding={false}
            actions={
              <LienBouton href="/calendrier" variante="fantome" taille="sm" icone="chevron">
                Calendrier
              </LienBouton>
            }
          >
            {evenements.length === 0 ? (
              <Vide titre="Rien de prévu" icone="calendrier" />
            ) : (
              <ul className="divide-y divide-argent-500/10">
                {evenements.map((e) => (
                  <li key={e.id} className="flex gap-3 px-4 py-3.5">
                    <div className="grid size-11 shrink-0 place-items-center rounded-[2px] border border-or-500/25 bg-nuit-950/50 text-center">
                      <span className="titre-imperial text-[0.95rem] leading-none text-or-300">
                        {new Date(e.date).getDate()}
                      </span>
                      <span className="text-[0.55rem] tracking-wider text-givre-300/60 uppercase">
                        {new Date(e.date).toLocaleDateString("fr-FR", { month: "short" })}
                      </span>
                    </div>
                    <Link href="/calendrier" className="min-w-0 flex-1">
                      <p className="truncate text-[0.85rem] text-givre-50">{e.titre}</p>
                      <p className="truncate text-[0.7rem] text-givre-300/60">
                        {[e.heure && `${e.heure}`, e.lieu].filter(Boolean).join(" · ")}
                      </p>
                      <p className="mt-1 text-[0.66rem] text-givre-300/45">
                        {e._count.rsvps} réponse{e._count.rsvps > 1 ? "s" : ""}
                        {e.rsvps[0] && ` · vous : ${e.rsvps[0].reponse.replace("_", "-")}`}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Carte>

          {mesPatrouilles.length > 0 && (
            <Carte titre="Patrouilles planifiées" icone="patrouille" padding={false}>
              <ul className="divide-y divide-argent-500/10">
                {mesPatrouilles.map((p) => (
                  <li key={p.id} className="px-4 py-3">
                    <p className="truncate text-[0.84rem] text-givre-50">{p.zone}</p>
                    <p className="mt-0.5 truncate text-[0.7rem] text-givre-300/60">
                      {date(p.date)} {p.heureDebut && `· ${p.heureDebut}`}
                      {p.circle && ` · ${p.circle.label}`}
                    </p>
                    <p className="mt-0.5 truncate text-[0.7rem] text-givre-300/45">{p.patrouilleurs}</p>
                  </li>
                ))}
              </ul>
            </Carte>
          )}

          <Carte titre="Ma fiche" icone="membres">
            <Definitions
              colonnes={1}
              items={[
                ["Rang", membre.rank.label],
                ["Branche & grade", membre.branch ? `${membre.branch.label}${membre.grade ? ` — ${membre.grade.label}` : ""}` : "—"],
                ["Fonction de Conseil", membre.councilRole?.label ?? "—"],
                ["Cercle", membre.circle?.label ?? "—"],
                ["Présenté par", membre.presentedBy?.nomRp ?? "—"],
                ["Entré dans la Maison", `${date(membre.dateEntree)} (${relatif(membre.dateEntree)})`],
                ["Droits accordés", `${membre.estAdmin ? "Tous" : membre.droits.size} permission(s)`],
              ]}
            />
            <Ornement className="my-4" />
            <LienBouton href={`/membres/${membre.id}`} variante="argent" taille="sm" icone="membres">
              Voir ma fiche complète
            </LienBouton>
          </Carte>
        </div>
      </div>
    </>
  );
}
