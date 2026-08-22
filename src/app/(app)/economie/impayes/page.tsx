import Link from "next/link";
import type { Metadata } from "next";
import { Badge, BadgeStatut, Carte, EnTetePage, Jauge, LienBouton, Message, Stat, Vide } from "@/components/ui/base";
import { Icone } from "@/components/ui/Icone";
import { ActionLigne } from "@/components/ui/form";
import { actionPaiement } from "@/app/actions/commandes";
import { exigerDroit, peut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PERMISSIONS as P } from "@/lib/domain";
import { date, relatif, septims } from "@/lib/format";

export const metadata: Metadata = { title: "Impayés" };
export const dynamic = "force-dynamic";

export default async function Impayes({
  searchParams,
}: {
  searchParams: Promise<{ mien?: string }>;
}) {
  const membre = await exigerDroit(P.ORDER_READ);
  const { mien } = await searchParams;

  const impayes = await prisma.craftOrder.findMany({
    where: {
      resteAPayer: { gt: 0 },
      etat: { not: "annulee" },
      ...(mien === "1" ? { artisanId: membre.id } : {}),
    },
    include: {
      artisan: { select: { id: true, nomRp: true } },
      metier: { select: { label: true } },
    },
    orderBy: [{ resteAPayer: "desc" }],
  });

  const soldees = await prisma.craftOrder.count({
    where: { resteAPayer: 0, etat: { not: "annulee" } },
  });

  const total = impayes.reduce((s, c) => s + c.resteAPayer, 0);
  const peutEncaisser = peut(membre, P.ORDER_CREATE, P.ORDER_VALIDATE);

  // Regroupement par client : c'est la vue utile pour relancer.
  const parClient = new Map<
    string,
    { nom: string; maison: string; contact: string; total: number; commandes: typeof impayes }
  >();
  for (const c of impayes) {
    const cle = `${c.clientNomRp}|${c.clientMaison}`;
    const e = parClient.get(cle);
    if (e) {
      e.total += c.resteAPayer;
      e.commandes.push(c);
    } else {
      parClient.set(cle, {
        nom: c.clientNomRp,
        maison: c.clientMaison,
        contact: c.clientContact,
        total: c.resteAPayer,
        commandes: [c],
      });
    }
  }
  const clients = [...parClient.values()].sort((a, b) => b.total - a.total);

  const enRetard = impayes.filter(
    (c) => c.dateLivraisonPrevue && new Date(c.dateLivraisonPrevue) < new Date() && c.etat !== "livree",
  );
  const livreesNonPayees = impayes.filter((c) => c.etat === "livree");

  return (
    <>
      <EnTetePage
        surTitre="Suivi des créances"
        titre="Impayés"
        icone="impaye"
        texte="Toute commande dont le reste à payer dépasse zéro. C'est ce que la Maison attend encore, client par client."
        actions={
          <>
            <LienBouton
              href={mien === "1" ? "/economie/impayes" : "/economie/impayes?mien=1"}
              variante="argent"
              icone="filtre"
            >
              {mien === "1" ? "Toute la Maison" : "Mes commandes seulement"}
            </LienBouton>
            <LienBouton href="/economie/commandes" variante="or" icone="commande">
              Carnet de commandes
            </LienBouton>
          </>
        }
      />

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Total dû à la Maison"
          valeur={septims(total)}
          sousTexte={`${impayes.length} commande(s)`}
          icone="impaye"
          tone={total > 0 ? "danger" : "succes"}
        />
        <Stat label="Clients débiteurs" valeur={clients.length} icone="membres" />
        <Stat
          label="Livrées non réglées"
          valeur={livreesNonPayees.length}
          sousTexte={septims(livreesNonPayees.reduce((s, c) => s + c.resteAPayer, 0))}
          icone="alerte"
          tone={livreesNonPayees.length ? "alerte" : "succes"}
        />
        <Stat label="Commandes soldées" valeur={soldees} icone="valider" tone="succes" />
      </section>

      {enRetard.length > 0 && (
        <div className="mb-6">
          <Message tone="alerte" titre={`${enRetard.length} commande(s) au-delà de la date de livraison`}>
            {enRetard.map((c) => (
              <span key={c.id} className="mr-3 inline-block">
                {c.clientNomRp} ({septims(c.resteAPayer)})
              </span>
            ))}
          </Message>
        </div>
      )}

      {impayes.length === 0 ? (
        <Carte padding={false}>
          <Vide
            titre="Aucun impayé"
            icone="valider"
            texte={
              mien === "1"
                ? "Personne ne vous doit rien. Tout est soldé."
                : "Toutes les commandes de la Maison sont réglées. Rare et méritant."
            }
            action={
              <LienBouton href="/economie/commandes" variante="argent" icone="commande">
                Voir le carnet de commandes
              </LienBouton>
            }
          />
        </Carte>
      ) : (
        <div className="space-y-4">
          {clients.map((cl) => (
            <Carte
              key={`${cl.nom}|${cl.maison}`}
              titre={cl.nom}
              sousTitre={[cl.maison, cl.contact].filter(Boolean).join(" · ") || "Contact non renseigné"}
              icone="membres"
              padding={false}
              actions={
                <Badge tone="danger" point>
                  {septims(cl.total)} dus
                </Badge>
              }
            >
              <ul className="divide-y divide-argent-500/10">
                {cl.commandes.map((c) => {
                  const paye = c.prixConvenu > 0 ? (c.acompte / c.prixConvenu) * 100 : 0;
                  const retard =
                    c.dateLivraisonPrevue &&
                    new Date(c.dateLivraisonPrevue) < new Date() &&
                    c.etat !== "livree";
                  return (
                    <li key={c.id} className="px-4 py-3.5">
                      <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
                        <div className="min-w-[200px] flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[0.88rem] text-givre-50">{c.objets}</span>
                            {c.quantite > 1 && (
                              <span className="text-[0.75rem] text-givre-300/60">×{c.quantite}</span>
                            )}
                            <BadgeStatut famille="commande" valeur={c.etat} />
                            {retard && <Badge tone="alerte">en retard</Badge>}
                          </div>
                          <p className="mt-1 text-[0.72rem] text-givre-300/55">
                            Commandée le {date(c.dateCommande)}
                            {c.dateLivraisonPrevue && ` · livraison ${relatif(c.dateLivraisonPrevue)}`}
                            {c.artisan && (
                              <>
                                {" · "}
                                <Link
                                  href={`/membres/${c.artisan.id}`}
                                  className="hover:text-or-300"
                                >
                                  {c.artisan.nomRp}
                                </Link>
                              </>
                            )}
                            {c.metier && ` · ${c.metier.label}`}
                          </p>
                          {c.observations && (
                            <p className="mt-1 text-[0.72rem] text-givre-300/45 italic">
                              {c.observations}
                            </p>
                          )}
                        </div>

                        <div className="w-52 shrink-0">
                          <div className="mb-1 flex items-baseline justify-between text-[0.72rem]">
                            <span className="text-givre-300/60">
                              {septims(c.acompte)} / {septims(c.prixConvenu)}
                            </span>
                            <span className="text-[#e69a8c] tabular-nums">
                              reste {septims(c.resteAPayer)}
                            </span>
                          </div>
                          <Jauge valeur={paye} tone={paye >= 100 ? "succes" : paye > 0 ? "attente" : "danger"} />
                        </div>

                        {peutEncaisser && (
                          <form
                            action={actionPaiement}
                            className="flex shrink-0 flex-wrap items-center gap-1.5"
                          >
                            <input type="hidden" name="id" value={c.id} />
                            <input
                              type="number"
                              name="montant"
                              min="1"
                              max={c.resteAPayer}
                              defaultValue={c.resteAPayer}
                              aria-label={`Montant encaissé pour ${c.clientNomRp}`}
                              className="champ !w-24 !py-1 text-right text-[0.78rem]"
                            />
                            {peut(membre, P.TREASURY_MANAGE) && (
                              <label
                                className="flex cursor-pointer items-center gap-1 text-[0.66rem] text-givre-300/60"
                                title="Verser directement au coffre de la Maison"
                              >
                                <input
                                  type="checkbox"
                                  name="verserAuCoffre"
                                  defaultChecked
                                  className="size-3 accent-[var(--color-or-500)]"
                                />
                                coffre
                              </label>
                            )}
                            <ActionLigne icone="septim" ton="succes">
                              Encaisser
                            </ActionLigne>
                          </form>
                        )}

                        <Link
                          href={`/economie/commandes?edit=${c.id}#saisie`}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-[2px] border border-argent-500/25 px-2 py-1 text-[0.7rem] text-givre-200 transition-colors hover:bg-nuit-600/70"
                        >
                          <Icone nom="modifier" taille={12} />
                          Ouvrir
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Carte>
          ))}
        </div>
      )}
    </>
  );
}
