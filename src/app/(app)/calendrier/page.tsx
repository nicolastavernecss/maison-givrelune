import Link from "next/link";
import type { Metadata } from "next";
import { Avatar, Badge, BadgeStatut, Carte, EnTetePage, LienBouton, Stat, Vide } from "@/components/ui/base";
import { Icone } from "@/components/ui/Icone";
import { Recit } from "@/components/ui/Recit";
import { ActionLigne } from "@/components/ui/form";
import { actionRSVP, actionSupprimerEvenement } from "@/app/actions/vie";
import { exigerDroit, peut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PERMISSIONS as P } from "@/lib/domain";
import { dateLongue, pourInputDate, relatif } from "@/lib/format";
import { FormulaireEvenement } from "./FormulaireEvenement";

export const metadata: Metadata = { title: "Calendrier" };
export const dynamic = "force-dynamic";

const REPONSES = [
  { value: "present", label: "Présent", ton: "succes" as const, icone: "valider" },
  { value: "peut_etre", label: "Peut-être", ton: "neutre" as const, icone: "horloge" },
  { value: "absent", label: "Absent", ton: "danger" as const, icone: "refuser" },
];

export default async function Calendrier({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; passe?: string }>;
}) {
  const membre = await exigerDroit(P.EVENT_READ);
  const f = await searchParams;
  const organise = peut(membre, P.EVENT_CREATE);

  const maintenant = new Date(new Date().setHours(0, 0, 0, 0));
  const evenements = await prisma.event.findMany({
    where: f.passe === "1" ? { date: { lt: maintenant } } : { date: { gte: maintenant } },
    orderBy: { date: f.passe === "1" ? "desc" : "asc" },
    include: {
      createdBy: { select: { id: true, nomRp: true } },
      rsvps: { include: { user: { select: { id: true, nomRp: true, avatarUrl: true } } } },
    },
    take: 60,
  });

  const enEdition = f.edit ? evenements.find((e) => e.id === f.edit) : undefined;
  const totalAVenir = await prisma.event.count({ where: { date: { gte: maintenant } } });
  const mesReponses = evenements.filter((e) => e.rsvps.some((r) => r.userId === membre.id)).length;

  return (
    <>
      <EnTetePage
        surTitre="Vie de la Maison"
        titre="Calendrier"
        icone="calendrier"
        texte="Conseils, patrouilles, cérémonies et banquets. Répondez : les organisateurs comptent sur vos réponses pour prévoir."
        actions={
          <>
            <LienBouton
              href={f.passe === "1" ? "/calendrier" : "/calendrier?passe=1"}
              variante="argent"
              icone="horloge"
            >
              {f.passe === "1" ? "Événements à venir" : "Événements passés"}
            </LienBouton>
            {organise && (
              <LienBouton href="/calendrier#saisie" variante="or" icone="plus">
                Organiser
              </LienBouton>
            )}
          </>
        }
      />

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="À venir" valeur={totalAVenir} icone="calendrier" />
        <Stat label="Mes réponses" valeur={`${mesReponses} / ${evenements.length}`} icone="presence" />
        <Stat
          label="Prochain rendez-vous"
          valeur={evenements[0] && f.passe !== "1" ? relatif(evenements[0].date) : "—"}
          sousTexte={evenements[0] && f.passe !== "1" ? evenements[0].titre : undefined}
          icone="lieu"
          tone="attente"
        />
        <Stat
          label="Participants attendus"
          valeur={evenements.reduce(
            (s, e) => s + e.rsvps.filter((r) => r.reponse === "present").length,
            0,
          )}
          icone="membres"
        />
      </section>

      {evenements.length === 0 ? (
        <Carte padding={false} className="mb-6">
          <Vide
            titre={f.passe === "1" ? "Aucun événement passé" : "Rien de prévu"}
            icone="calendrier"
            texte={organise ? "Inscrivez le premier événement au calendrier." : undefined}
          />
        </Carte>
      ) : (
        <div className="mb-8 space-y-4">
          {evenements.map((e) => {
            const maReponse = e.rsvps.find((r) => r.userId === membre.id)?.reponse;
            const presents = e.rsvps.filter((r) => r.reponse === "present");
            const peutEtre = e.rsvps.filter((r) => r.reponse === "peut_etre");
            const absents = e.rsvps.filter((r) => r.reponse === "absent");

            return (
              <article key={e.id} className="carte carte-texture overflow-hidden">
                <div className="flex flex-wrap gap-5 p-5">
                  {/* Date */}
                  <div className="grid size-[72px] shrink-0 place-content-center place-items-center rounded-[2px] border border-or-500/30 bg-nuit-950/50 text-center">
                    <span className="text-[0.6rem] tracking-[0.2em] text-givre-300/55 uppercase">
                      {new Date(e.date).toLocaleDateString("fr-FR", { weekday: "short" })}
                    </span>
                    <span className="titre-imperial text-2xl leading-none text-or-200">
                      {new Date(e.date).getDate()}
                    </span>
                    <span className="text-[0.6rem] tracking-[0.16em] text-givre-300/55 uppercase">
                      {new Date(e.date).toLocaleDateString("fr-FR", { month: "short" })}
                    </span>
                  </div>

                  <div className="min-w-[220px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="titre-imperial text-[1.05rem] text-givre-50">{e.titre}</h2>
                      <BadgeStatut famille="evenement" valeur={e.statut} />
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.74rem] text-givre-300/65">
                      <span className="flex items-center gap-1.5">
                        <Icone nom="calendrier" taille={12} />
                        {dateLongue(e.date)}
                      </span>
                      {e.heureRdv && (
                        <span className="flex items-center gap-1.5">
                          <Icone nom="horloge" taille={12} />
                          RDV {e.heureRdv}
                          {e.heure && ` · début ${e.heure}`}
                        </span>
                      )}
                      {!e.heureRdv && e.heure && (
                        <span className="flex items-center gap-1.5">
                          <Icone nom="horloge" taille={12} />
                          {e.heure}
                        </span>
                      )}
                      {e.lieu && (
                        <span className="flex items-center gap-1.5">
                          <Icone nom="lieu" taille={12} />
                          {e.lieu}
                        </span>
                      )}
                    </p>

                    {e.description && (
                      <Recit
                        texte={e.description}
                        className="mt-2.5 !text-[0.88rem] text-givre-200/80"
                      />
                    )}

                    {/* Réponses */}
                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                      {[
                        { liste: presents, label: "présents", ton: "succes" as const },
                        { liste: peutEtre, label: "peut-être", ton: "attente" as const },
                        { liste: absents, label: "absents", ton: "neutre" as const },
                      ]
                        .filter((g) => g.liste.length > 0)
                        .map((g) => (
                          <span key={g.label} className="flex items-center gap-2">
                            <Badge tone={g.ton}>
                              {g.liste.length} {g.label}
                            </Badge>
                            <span className="flex -space-x-1.5">
                              {g.liste.slice(0, 6).map((r) => (
                                <Link key={r.id} href={`/membres/${r.user.id}`} title={r.user.nomRp}>
                                  <Avatar nom={r.user.nomRp} url={r.user.avatarUrl} taille={22} />
                                </Link>
                              ))}
                            </span>
                          </span>
                        ))}
                      {e.rsvps.length === 0 && (
                        <span className="text-[0.72rem] text-givre-300/40">Aucune réponse</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-col gap-2">
                    <div className="flex gap-1.5">
                      {REPONSES.map((r) => (
                        <form key={r.value} action={actionRSVP}>
                          <input type="hidden" name="eventId" value={e.id} />
                          <input type="hidden" name="reponse" value={r.value} />
                          <button
                            type="submit"
                            className={`inline-flex items-center gap-1.5 rounded-[2px] border px-2.5 py-1.5 text-[0.72rem] transition-colors ${
                              maReponse === r.value
                                ? r.ton === "succes"
                                  ? "border-succes/50 bg-succes/18 text-[#8fd0a3]"
                                  : r.ton === "danger"
                                    ? "border-danger/50 bg-danger/18 text-[#e69a8c]"
                                    : "border-or-500/45 bg-or-500/14 text-or-200"
                                : "border-argent-500/22 text-givre-300/70 hover:border-or-500/35 hover:text-givre-100"
                            }`}
                          >
                            <Icone nom={r.icone} taille={12} />
                            {r.label}
                          </button>
                        </form>
                      ))}
                    </div>

                    {organise && (
                      <div className="flex gap-1.5">
                        <Link
                          href={`/calendrier?edit=${e.id}#saisie`}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[2px] border border-argent-500/25 px-2 py-1 text-[0.7rem] text-givre-200 transition-colors hover:bg-nuit-600/70"
                        >
                          <Icone nom="modifier" taille={12} />
                          Modifier
                        </Link>
                        <form action={actionSupprimerEvenement}>
                          <input type="hidden" name="id" value={e.id} />
                          <ActionLigne icone="supprimer" ton="danger">
                            <span className="sr-only">Supprimer</span>
                          </ActionLigne>
                        </form>
                      </div>
                    )}

                    {e.createdBy && (
                      <p className="text-right text-[0.66rem] text-givre-300/40">
                        organisé par{" "}
                        <Link href={`/membres/${e.createdBy.id}`} className="hover:text-or-300">
                          {e.createdBy.nomRp}
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {organise && (
        <Carte
          titre={enEdition ? `Modifier — ${enEdition.titre}` : "Organiser un événement"}
          icone={enEdition ? "modifier" : "plus"}
          actions={
            enEdition && (
              <LienBouton href="/calendrier" variante="fantome" taille="sm" icone="refuser">
                Annuler
              </LienBouton>
            )
          }
        >
          <div id="saisie" className="scroll-mt-20">
            <FormulaireEvenement
              key={enEdition?.id ?? "nouveau"}
              id={enEdition?.id}
              valeurs={
                enEdition
                  ? {
                      titre: enEdition.titre,
                      description: enEdition.description,
                      date: pourInputDate(enEdition.date),
                      heure: enEdition.heure,
                      heureRdv: enEdition.heureRdv,
                      lieu: enEdition.lieu,
                      statut: enEdition.statut,
                    }
                  : undefined
              }
            />
          </div>
        </Carte>
      )}
    </>
  );
}
