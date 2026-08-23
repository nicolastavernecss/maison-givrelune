import Link from "next/link";
import type { Metadata } from "next";
import { Badge, BadgeStatut, Carte, Definitions, EnTetePage, LienBouton, Message, Stat, Vide } from "@/components/ui/base";
import { Icone } from "@/components/ui/Icone";
import { ActionLigne } from "@/components/ui/form";
import {
  actionCreerCompteDepuisDemande,
  actionExaminerDemande,
} from "@/app/actions/gouvernance";
import { exigerDroit, peut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PERMISSIONS as P, STATUSES } from "@/lib/domain";
import { dateHeure, relatif } from "@/lib/format";

export const metadata: Metadata = { title: "Demandes de rôle" };
export const dynamic = "force-dynamic";

/** Ce qui peut empêcher l'ouverture d'un compte, dit en clair. */
const MOTIFS: Record<string, string> = {
  introuvable: "Cette demande n'existe plus dans le registre.",
  non_acceptee: "La demande doit d'abord être acceptée avant d'ouvrir le compte.",
  sans_identifiant:
    "Cette demande ne porte pas d'identifiant : elle date d'avant leur saisie. Créez la fiche à la main depuis l'administration des membres.",
  sans_mot_de_passe:
    "Aucun mot de passe n'est attaché à cette demande — le compte a sans doute déjà été ouvert.",
  identifiant_pris: "Cet identifiant est déjà utilisé par un membre de la Maison.",
  rang_fils_absent:
    "Le rang « Fils » est absent du référentiel : impossible d'y rattacher le nouveau membre.",
};

export default async function Demandes({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; probleme?: string }>;
}) {
  const membre = await exigerDroit(P.ROLE_REQUEST_READ);
  const { statut, probleme } = await searchParams;
  const examine = peut(membre, P.ROLE_REQUEST_REVIEW);
  const decide = peut(membre, P.ROLE_REQUEST_APPROVE);

  const demandes = await prisma.roleRequest.findMany({
    where: statut ? { statut } : {},
    orderBy: [{ statut: "asc" }, { createdAt: "desc" }],
    include: { examinePar: { select: { id: true, nomRp: true } } },
  });

  const toutes = await prisma.roleRequest.groupBy({ by: ["statut"], _count: true });
  const compte = (s: string) => toutes.find((t) => t.statut === s)?._count ?? 0;

  return (
    <>
      <EnTetePage
        surTitre="Gouvernance"
        titre="Demandes de rôle"
        icone="demande"
        texte="Les candidatures arrivées par le formulaire public. Un gradé les examine, un Patriarche tranche. L'entrée se fait en période d'essai."
        actions={
          peut(membre, P.ADMIN_MEMBERS) && (
            <LienBouton href="/gouvernance/membres" variante="argent" icone="membres">
              Créer un membre
            </LienBouton>
          )
        }
      />

      {probleme && (
        <div className="mb-5">
          <Message tone="danger" titre="Le compte n'a pas pu être ouvert">
            {MOTIFS[probleme] ?? "L'opération a été interrompue pour une raison inattendue."}
          </Message>
        </div>
      )}

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="En attente"
          valeur={compte("en_attente")}
          icone="horloge"
          tone={compte("en_attente") ? "attente" : "succes"}
        />
        <Stat label="Examinées" valeur={compte("examinee")} icone="audit" tone="actif" />
        <Stat label="Acceptées" valeur={compte("acceptee")} icone="valider" tone="succes" />
        <Stat label="Refusées" valeur={compte("refusee")} icone="refuser" tone="danger" />
      </section>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/gouvernance/demandes"
          className={`rounded-full border px-3 py-1 text-[0.72rem] transition-colors ${
            !statut
              ? "border-or-500/45 bg-or-500/12 text-or-200"
              : "border-argent-500/20 text-givre-300/70 hover:border-or-500/30"
          }`}
        >
          Toutes
        </Link>
        {STATUSES.demande.map((s) => (
          <Link
            key={s.value}
            href={`/gouvernance/demandes?statut=${s.value}`}
            className={`rounded-full border px-3 py-1 text-[0.72rem] transition-colors ${
              statut === s.value
                ? "border-or-500/45 bg-or-500/12 text-or-200"
                : "border-argent-500/20 text-givre-300/70 hover:border-or-500/30"
            }`}
          >
            {s.label} · {compte(s.value)}
          </Link>
        ))}
      </div>

      {demandes.length === 0 ? (
        <Carte padding={false}>
          <Vide
            titre="Aucune demande"
            icone="demande"
            texte="Le formulaire public alimente ce registre automatiquement."
            action={
              <LienBouton href="/rejoindre" variante="argent" icone="chevron">
                Voir le formulaire public
              </LienBouton>
            }
          />
        </Carte>
      ) : (
        <div className="space-y-4">
          {demandes.map((d) => (
            <Carte
              key={d.id}
              titre={d.nomRp}
              sousTitre={`Reçue ${relatif(d.createdAt)} · ${dateHeure(d.createdAt)}`}
              icone="demande"
              actions={<BadgeStatut famille="demande" valeur={d.statut} />}
            >
              <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                <div>
                  <p className="recit rounded-[2px] border-l-2 border-or-500/40 bg-nuit-950/40 px-4 py-3 text-[0.92rem] text-givre-200/85">
                    {d.message}
                  </p>

                  {d.statut !== "en_attente" && (
                    <div className="mt-3 text-[0.75rem] text-givre-300/60">
                      {d.examinePar && (
                        <span>
                          Examinée par{" "}
                          <Link href={`/membres/${d.examinePar.id}`} className="text-or-300 hover:underline">
                            {d.examinePar.nomRp}
                          </Link>
                        </span>
                      )}
                      {d.decisionNote && (
                        <p className="mt-1 text-givre-300/70 italic">« {d.decisionNote} »</p>
                      )}
                    </div>
                  )}

                  {examine && (
                    <form
                      action={actionExaminerDemande.bind(null, d.id, "examinee")}
                      className="mt-4"
                    >
                      <div className="flex flex-wrap items-end gap-2">
                        <label className="min-w-[220px] flex-1">
                          <span className="mb-1 block text-[0.62rem] tracking-[0.16em] text-givre-300/50 uppercase">
                            Note de décision
                          </span>
                          <input
                            name="decisionNote"
                            defaultValue={d.decisionNote}
                            maxLength={600}
                            placeholder="Motif, conditions, période d'essai…"
                            className="champ"
                          />
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="submit"
                            formAction={actionExaminerDemande.bind(null, d.id, "examinee")}
                            className="inline-flex items-center gap-1.5 rounded-[2px] border border-argent-500/25 px-2.5 py-1.5 text-[0.74rem] text-givre-200 transition-colors hover:bg-nuit-600/70"
                          >
                            <Icone nom="audit" taille={12} />
                            Marquer examinée
                          </button>
                          {decide && (
                            <>
                              <button
                                type="submit"
                                formAction={actionExaminerDemande.bind(null, d.id, "acceptee")}
                                className="inline-flex items-center gap-1.5 rounded-[2px] border border-succes/40 bg-succes/12 px-2.5 py-1.5 text-[0.74rem] text-[#8fd0a3] transition-colors hover:bg-succes/22"
                              >
                                <Icone nom="valider" taille={12} />
                                Accepter
                              </button>
                              <button
                                type="submit"
                                formAction={actionExaminerDemande.bind(null, d.id, "refusee")}
                                className="inline-flex items-center gap-1.5 rounded-[2px] border border-danger/40 bg-danger/12 px-2.5 py-1.5 text-[0.74rem] text-[#e69a8c] transition-colors hover:bg-danger/22"
                              >
                                <Icone nom="refuser" taille={12} />
                                Refuser
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {!decide && (
                        <p className="mt-2 text-[0.7rem] text-givre-300/45">
                          La décision finale revient aux Patriarches et au Sénéchal.
                        </p>
                      )}
                    </form>
                  )}

                  {d.statut === "acceptee" && peut(membre, P.ADMIN_MEMBERS) && (
                    <div className="mt-4 rounded-[2px] border border-succes/30 bg-succes/8 px-3.5 py-3">
                      {d.passwordHash && d.loginSouhaite ? (
                        <>
                          <p className="text-[0.78rem] text-[#8fd0a3]">
                            Demande acceptée. Le candidat a déjà choisi son identifiant et son mot
                            de passe — ouvrez son compte, il n'y a rien à lui transmettre.
                          </p>
                          <form
                            action={actionCreerCompteDepuisDemande.bind(null, d.id)}
                            className="mt-2"
                          >
                            <button
                              type="submit"
                              className="inline-flex items-center gap-2 rounded-[2px] border border-succes/40 bg-succes/15 px-3.5 py-1.5 text-[0.82rem] text-[#8fd0a3] transition-colors hover:bg-succes/25"
                            >
                              <Icone nom="valider" taille={14} />
                              Ouvrir le compte de {d.nomRp} ({d.loginSouhaite})
                            </button>
                          </form>
                          <p className="mt-2 text-[0.7rem] text-givre-300/50">
                            Le compte sera créé au rang de Fils, en période d'essai, avec la branche
                            et le parrain indiqués dans la demande.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-[0.78rem] text-[#8fd0a3]">
                            {d.loginSouhaite
                              ? "Le compte a déjà été ouvert pour cette demande."
                              : "Demande acceptée — cette demande date d'avant la saisie des identifiants, créez la fiche à la main."}
                          </p>
                          <LienBouton
                            href="/gouvernance/membres#saisie"
                            variante="argent"
                            taille="sm"
                            icone="membres"
                            className="mt-2"
                          >
                            Ouvrir l'administration des membres
                          </LienBouton>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-[2px] border border-argent-500/12 bg-nuit-950/30 p-4">
                  <Definitions
                    colonnes={1}
                    items={[
                      ["Nom RP", d.nomRp],
                      ["Email", d.email || <span className="text-givre-300/40">non renseigné</span>],
                      [
                        "Identifiant souhaité",
                        d.loginSouhaite ? (
                          <code className="text-or-200">{d.loginSouhaite}</code>
                        ) : (
                          <span className="text-givre-300/40">—</span>
                        ),
                      ],
                      [
                        "Mot de passe",
                        d.passwordHash ? (
                          <span className="text-[#8fd0a3]">choisi par le candidat, chiffré</span>
                        ) : (
                          <span className="text-givre-300/40">à définir</span>
                        ),
                      ],
                      ["Discord", d.discordTag || "—"],
                      ["Autre contact", d.contact || "—"],
                      ["Branche souhaitée", d.branche || "— aucune préférence —"],
                      ["Grade actuel", d.gradeSouhaite || "—"],
                      ["Cercle", d.cercle || "—"],
                      ["Métiers", d.metiers || "—"],
                      [
                        "Présenté par",
                        d.presentePar ? (
                          <span className="text-or-200">{d.presentePar}</span>
                        ) : (
                          <span className="text-givre-300/45">sans parrain</span>
                        ),
                      ],
                    ]}
                  />
                </div>
              </div>
            </Carte>
          ))}
        </div>
      )}
    </>
  );
}
