import Link from "next/link";
import type { Metadata } from "next";
import { Avatar, Badge, BadgeStatut, Carte, EnTetePage, Stat, Vide } from "@/components/ui/base";
import { Icone } from "@/components/ui/Icone";
import { actionTicket } from "@/app/actions/gouvernance";
import { exigerDroit, peut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PERMISSIONS as P, STATUSES } from "@/lib/domain";
import { dateHeure, relatif } from "@/lib/format";

export const metadata: Metadata = { title: "Tickets" };
export const dynamic = "force-dynamic";

const CATEGORIES = [
  { value: "question", label: "Question" },
  { value: "acces", label: "Accès & droits" },
  { value: "probleme", label: "Problème" },
  { value: "suggestion", label: "Suggestion" },
  { value: "signalement", label: "Signalement" },
];

export default async function Tickets({
  searchParams,
}: {
  searchParams: Promise<{ ouvert?: string; statut?: string }>;
}) {
  const membre = await exigerDroit(P.TICKET_READ);
  const f = await searchParams;
  const gere = peut(membre, P.TICKET_MANAGE);

  const tickets = await prisma.ticket.findMany({
    where: {
      ...(gere ? {} : { auteurId: membre.id }),
      ...(f.statut ? { statut: f.statut } : {}),
    },
    orderBy: [{ statut: "asc" }, { updatedAt: "desc" }],
    include: {
      auteur: { select: { id: true, nomRp: true, avatarUrl: true } },
      assigne: { select: { id: true, nomRp: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, nomRp: true, avatarUrl: true } } },
      },
    },
  });

  const ouvert = f.ouvert ? tickets.find((t) => t.id === f.ouvert) : undefined;
  const enCours = tickets.filter((t) => t.statut === "ouvert" || t.statut === "en_cours");

  return (
    <>
      <EnTetePage
        surTitre="Support interne"
        titre="Tickets"
        icone="ticket"
        texte={
          gere
            ? "Les demandes des membres : accès, problèmes, suggestions, signalements. Traitez-les et clôturez."
            : "Une question, un accès manquant, un problème ? Ouvrez un ticket : un gradé vous répondra."
        }
      />

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="À traiter"
          valeur={enCours.length}
          icone="ticket"
          tone={enCours.length ? "attente" : "succes"}
        />
        <Stat label="Total" valeur={tickets.length} icone="registre" />
        <Stat
          label="Résolus"
          valeur={tickets.filter((t) => t.statut === "resolu").length}
          icone="valider"
          tone="succes"
        />
        <Stat
          label="Messages échangés"
          valeur={tickets.reduce((s, t) => s + t.messages.length, 0)}
          icone="courrier"
        />
      </section>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/gouvernance/tickets"
          className={`rounded-full border px-3 py-1 text-[0.72rem] transition-colors ${
            !f.statut
              ? "border-or-500/45 bg-or-500/12 text-or-200"
              : "border-argent-500/20 text-givre-300/70 hover:border-or-500/30"
          }`}
        >
          Tous · {tickets.length}
        </Link>
        {STATUSES.ticket.map((s) => (
          <Link
            key={s.value}
            href={`/gouvernance/tickets?statut=${s.value}`}
            className={`rounded-full border px-3 py-1 text-[0.72rem] transition-colors ${
              f.statut === s.value
                ? "border-or-500/45 bg-or-500/12 text-or-200"
                : "border-argent-500/20 text-givre-300/70 hover:border-or-500/30"
            }`}
          >
            {s.label} · {tickets.filter((t) => t.statut === s.value).length}
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <Carte padding={false}>
              <Vide titre="Aucun ticket" icone="ticket" texte="Rien à signaler pour l'instant." />
            </Carte>
          ) : (
            tickets.map((t) => {
              const deplie = ouvert?.id === t.id;
              return (
                <Carte
                  key={t.id}
                  titre={t.titre}
                  sousTitre={`${CATEGORIES.find((c) => c.value === t.categorie)?.label ?? t.categorie} · ${relatif(t.createdAt)}`}
                  icone="ticket"
                  actions={
                    <>
                      <BadgeStatut famille="ticket" valeur={t.statut} />
                      <Link
                        href={deplie ? "/gouvernance/tickets" : `/gouvernance/tickets?ouvert=${t.id}`}
                        className="inline-flex items-center gap-1.5 rounded-[2px] border border-argent-500/25 px-2 py-1 text-[0.7rem] text-givre-200 transition-colors hover:bg-nuit-600/70"
                      >
                        <Icone nom={deplie ? "bas" : "chevron"} taille={12} />
                        {deplie ? "Replier" : "Ouvrir"}
                      </Link>
                    </>
                  }
                >
                  <div className="flex items-start gap-3">
                    {t.auteur && <Avatar nom={t.auteur.nomRp} url={t.auteur.avatarUrl} taille={30} />}
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.85rem] leading-relaxed text-givre-200/85">{t.contenu}</p>
                      <p className="mt-1.5 text-[0.68rem] text-givre-300/50">
                        {t.auteur && (
                          <Link href={`/membres/${t.auteur.id}`} className="hover:text-or-300">
                            {t.auteur.nomRp}
                          </Link>
                        )}
                        {" · "}
                        {dateHeure(t.createdAt)}
                        {t.assigne && (
                          <>
                            {" · assigné à "}
                            <Link href={`/membres/${t.assigne.id}`} className="hover:text-or-300">
                              {t.assigne.nomRp}
                            </Link>
                          </>
                        )}
                      </p>
                    </div>
                    {t.messages.length > 0 && (
                      <Badge tone="neutre">{t.messages.length} réponse(s)</Badge>
                    )}
                  </div>

                  {deplie && (
                    <>
                      {t.messages.length > 0 && (
                        <ul className="mt-4 space-y-3 border-t border-argent-500/12 pt-4">
                          {t.messages.map((m) => (
                            <li key={m.id} className="flex items-start gap-3">
                              {m.user && (
                                <Avatar nom={m.user.nomRp} url={m.user.avatarUrl} taille={26} />
                              )}
                              <div className="min-w-0 flex-1 rounded-[2px] border border-argent-500/12 bg-nuit-950/35 px-3 py-2">
                                <p className="text-[0.8rem] text-givre-200/85">{m.contenu}</p>
                                <p className="mt-1 text-[0.65rem] text-givre-300/45">
                                  {m.user?.nomRp} · {relatif(m.createdAt)}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}

                      <form action={actionTicket} className="mt-4 border-t border-argent-500/12 pt-4">
                        <input type="hidden" name="id" value={t.id} />
                        <textarea
                          name="reponse"
                          rows={3}
                          maxLength={3000}
                          placeholder="Votre réponse…"
                          className="champ resize-y"
                        />
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          {gere ? (
                            <select name="statut" defaultValue={t.statut} className="champ !w-auto !py-1">
                              {STATUSES.ticket.map((s) => (
                                <option key={s.value} value={s.value}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span />
                          )}
                          <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-[2px] border border-or-300/50 bg-gradient-to-b from-or-400 to-or-600 px-3.5 py-1.5 text-[0.82rem] font-semibold text-nuit-950 transition-all hover:from-or-300 hover:to-or-500"
                          >
                            <Icone nom="courrier" taille={14} />
                            Répondre
                          </button>
                        </div>
                      </form>
                    </>
                  )}
                </Carte>
              );
            })
          )}
        </div>

        <Carte titre="Ouvrir un ticket" icone="plus">
          <form action={actionTicket} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[0.72rem] font-medium text-givre-200/85">
                Titre <span className="text-or-400">*</span>
              </span>
              <input name="titre" required maxLength={160} className="champ" />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[0.72rem] font-medium text-givre-200/85">
                Catégorie
              </span>
              <select name="categorie" defaultValue="question" className="champ">
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[0.72rem] font-medium text-givre-200/85">
                Votre demande <span className="text-or-400">*</span>
              </span>
              <textarea name="contenu" required rows={5} maxLength={4000} className="champ resize-y" />
            </label>

            <div className="flex justify-end border-t border-argent-500/12 pt-4">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-[2px] border border-or-300/50 bg-gradient-to-b from-or-400 to-or-600 px-3.5 py-1.5 text-[0.82rem] font-semibold text-nuit-950 transition-all hover:from-or-300 hover:to-or-500"
              >
                <Icone nom="ticket" taille={14} />
                Ouvrir le ticket
              </button>
            </div>
          </form>
        </Carte>
      </div>
    </>
  );
}
