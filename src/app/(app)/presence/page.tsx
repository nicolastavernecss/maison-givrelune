import Link from "next/link";
import type { Metadata } from "next";
import { Avatar, Badge, BadgeStatut, Carte, EnTetePage, LienBouton, Stat, Vide } from "@/components/ui/base";
import { Icone, iconeMetier } from "@/components/ui/Icone";
import { ActionLigne } from "@/components/ui/form";
import { actionFinPoste, actionStatutAbsence, actionSupprimerAbsence } from "@/app/actions/vie";
import { PriseDePoste, RafraichirPresence } from "@/components/presence/PriseDePoste";
import { ComposerPatrouille, type Present } from "@/components/presence/ComposerPatrouille";
import { exigerDroit, peut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { etatPoste, PERMISSIONS as P } from "@/lib/domain";
import { dureePoste, monPoste, postesOuverts, seuilPoste } from "@/lib/presence";
import { date, relatif } from "@/lib/format";
import { FormulaireAbsence } from "./FormulaireAbsence";

export const metadata: Metadata = { title: "Présence & absences" };
export const dynamic = "force-dynamic";

export default async function Presence() {
  const membre = await exigerDroit(P.ATTENDANCE_READ);
  const valide = peut(membre, P.ATTENDANCE_VALIDATE);
  const composePatrouille = peut(membre, P.PATROL_CREATE);

  const maintenant = new Date();
  const debutJour = new Date(new Date().setHours(0, 0, 0, 0));

  const [
    poste,
    presents,
    absences,
    membres,
    actifs,
    cercles,
    zones,
    postesDuJour,
    rondesDuJour,
  ] = await Promise.all([
    monPoste(membre.id),
    postesOuverts(),
    prisma.attendance.findMany({
      orderBy: { dateDebut: "desc" },
      take: 60,
      include: {
        user: {
          select: {
            id: true,
            nomRp: true,
            avatarUrl: true,
            branch: { select: { label: true, color: true } },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { status: { not: "archive" } },
      select: { id: true, nomRp: true },
      orderBy: { nomRp: "asc" },
    }),
    prisma.user.findMany({
      where: { status: { not: "archive" } },
      select: {
        id: true,
        nomRp: true,
        avatarUrl: true,
        lastSeenAt: true,
        branch: { select: { label: true, color: true } },
      },
      orderBy: { nomRp: "asc" },
    }),
    prisma.circle.findMany({ orderBy: { label: "asc" }, select: { id: true, label: true } }),
    prisma.patrol.findMany({
      distinct: ["zone"],
      select: { zone: true },
      orderBy: { date: "desc" },
      take: 30,
    }),
    prisma.dutySession.findMany({
      where: { debutLe: { gte: debutJour } },
      include: { user: { select: { id: true, nomRp: true, avatarUrl: true } } },
      orderBy: { debutLe: "desc" },
      take: 40,
    }),
    prisma.patrol.findMany({
      where: { date: { gte: debutJour } },
      orderBy: { date: "desc" },
      include: { circle: { select: { label: true } } },
      take: 10,
    }),
  ]);

  const idsPresents = new Set(presents.map((p) => p.userId));
  const disponibles = presents.filter((p) => p.etat === "disponible").length;
  const enRonde = presents.filter((p) => p.etat === "en_patrouille").length;

  const absencesEnCours = absences.filter(
    (a) =>
      a.type === "absence" &&
      a.statut !== "refusee" &&
      new Date(a.dateDebut) <= maintenant &&
      (!a.dateFin || new Date(a.dateFin) >= maintenant),
  );
  const idsAbsents = new Set(absencesEnCours.map((a) => a.userId));
  const enAttente = absences.filter((a) => a.statut === "declaree");

  const listePresents: Present[] = presents.map((p) => ({
    id: p.userId,
    nomRp: p.user.nomRp,
    avatarUrl: p.user.avatarUrl,
    branche: p.user.branch?.label ?? null,
    brancheCouleur: p.user.branch?.color ?? null,
    brancheCle: p.user.branch?.key ?? null,
    grade: p.user.grade?.label ?? null,
    cercle: p.user.circle?.label ?? null,
    etat: p.etat,
    duree: dureePoste(p.debutLe),
  }));

  const tempsCumule = presents.reduce(
    (s, p) => s + (Date.now() - p.debutLe.getTime()) / 3_600_000,
    0,
  );

  return (
    <>
      <RafraichirPresence />

      <EnTetePage
        surTitre="Qui est là, maintenant"
        titre="Présence de la Maison"
        icone="presence"
        texte="Chacun déclare sa prise de poste en arrivant. Les gradés voient qui est disponible et composent une ronde en un clic. Les absences prolongées se déclarent plus bas (règlement §VII)."
        actions={
          <LienBouton href="/registres/patrouilles" variante="argent" icone="patrouille">
            Registre des patrouilles
          </LienBouton>
        }
      />

      <PriseDePoste
        poste={poste ? { debutLe: poste.debutLe.toISOString(), etat: poste.etat } : null}
        nomRp={membre.nomRp}
        nbPresents={presents.length}
      />

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="En poste maintenant"
          valeur={presents.length}
          sousTexte={`sur ${actifs.length} membres`}
          icone="presence"
          tone={presents.length ? "succes" : "neutre"}
        />
        <Stat
          label="Disponibles"
          valeur={disponibles}
          sousTexte={enRonde ? `${enRonde} déjà en ronde` : "prêts à être appelés"}
          icone="valider"
          tone={disponibles ? "succes" : "neutre"}
        />
        <Stat
          label="Temps de présence cumulé"
          valeur={`${tempsCumule.toFixed(1).replace(".", ",")} h`}
          sousTexte="postes ouverts en ce moment"
          icone="horloge"
          tone="attente"
        />
        <Stat
          label="Absences déclarées"
          valeur={absencesEnCours.length}
          sousTexte={enAttente.length ? `${enAttente.length} à valider` : "à jour"}
          icone="calendrier"
          tone={enAttente.length ? "attente" : "neutre"}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          {/* ── En poste ── */}
          <Carte
            titre="En poste actuellement"
            sousTitre={
              presents.length
                ? "Le tableau se rafraîchit tout seul"
                : "Personne ne s'est encore déclaré aujourd'hui"
            }
            icone="presence"
            padding={false}
            actions={presents.length > 0 && <Badge tone="succes" point>{presents.length}</Badge>}
          >
            {presents.length === 0 ? (
              <Vide
                titre="La Grande Salle est vide"
                icone="lune"
                texte="Soyez le premier à prendre votre poste — les autres verront que vous êtes là."
              />
            ) : (
              <ul className="divide-y divide-argent-500/10">
                {presents.map((p) => {
                  const e = etatPoste(p.etat);
                  return (
                    <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                      <span className="relative shrink-0">
                        <Avatar
                          nom={p.user.nomRp}
                          url={p.user.avatarUrl}
                          taille={38}
                          anneau={p.user.rank.level <= 2 ? "rgba(210,184,115,0.6)" : undefined}
                        />
                        <span
                          className={`absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-nuit-850 ${
                            p.etat === "disponible"
                              ? "bg-succes"
                              : p.etat === "en_patrouille"
                                ? "bg-actif"
                                : "bg-attente"
                          }`}
                        />
                      </span>

                      <div className="min-w-[150px] flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/membres/${p.userId}`}
                            className="text-[0.88rem] text-givre-50 transition-colors hover:text-or-300"
                          >
                            {p.user.nomRp}
                          </Link>
                          {p.user.branch && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full border px-1.5 py-px text-[0.6rem]"
                              style={{
                                borderColor: `${p.user.branch.color}55`,
                                color: p.user.branch.color,
                              }}
                            >
                              <Icone nom={p.user.branch.icon} taille={9} />
                              {p.user.branch.label}
                            </span>
                          )}
                          {p.user.circle && <Badge tone="actif">{p.user.circle.label}</Badge>}
                        </div>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 text-[0.7rem] text-givre-300/55">
                          <span>{p.user.grade?.label ?? p.user.rank.label}</span>
                          {p.user.metiers.slice(0, 2).map((um) => (
                            <span key={um.id} className="inline-flex items-center gap-1">
                              <Icone
                                nom={iconeMetier(um.metier.key, um.metier.category)}
                                taille={10}
                              />
                              {um.metier.label}
                            </span>
                          ))}
                        </p>
                      </div>

                      <Badge tone={e.tone} point>
                        {e.label}
                      </Badge>

                      <span className="w-16 shrink-0 text-right text-[0.74rem] tabular-nums text-givre-300/60">
                        {dureePoste(p.debutLe)}
                      </span>

                      {(valide || p.userId === membre.id) && (
                        <form action={actionFinPoste} className="shrink-0">
                          <input type="hidden" name="userId" value={p.userId} />
                          <ActionLigne icone="sortie" ton="danger">
                            <span className="sr-only">Clore le poste de {p.user.nomRp}</span>
                          </ActionLigne>
                        </form>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Carte>

          {/* ── Composition de patrouille ── */}
          {composePatrouille && (
            <Carte
              titre="Composer une ronde depuis les présents"
              sousTitre="Cochez qui part, donnez la zone : la patrouille est créée et consignée au registre."
              icone="patrouille"
            >
              <ComposerPatrouille
                presents={listePresents}
                cercles={cercles.map((c) => ({ value: c.id, label: c.label }))}
                zonesConnues={[...new Set(zones.map((z) => z.zone))].filter(Boolean)}
              />
            </Carte>
          )}

          {/* ── Registre des absences ── */}
          <Carte
            titre="Registre des absences"
            sousTitre="Absences annoncées à l'avance, comme l'impose le règlement §VII"
            icone="registre"
            padding={false}
          >
            {absences.length === 0 ? (
              <Vide titre="Registre vide" icone="calendrier" texte="Aucune absence déclarée." />
            ) : (
              <ul className="divide-y divide-argent-500/10">
                {absences.map((a) => {
                  const active =
                    new Date(a.dateDebut) <= maintenant &&
                    (!a.dateFin || new Date(a.dateFin) >= maintenant);
                  return (
                    <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                      <Avatar nom={a.user.nomRp} url={a.user.avatarUrl} taille={32} />
                      <div className="min-w-[160px] flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/membres/${a.user.id}`}
                            className="text-[0.86rem] text-givre-50 hover:text-or-300"
                          >
                            {a.user.nomRp}
                          </Link>
                          {a.user.branch && (
                            <span
                              className="rounded-full border px-1.5 py-px text-[0.6rem]"
                              style={{
                                borderColor: `${a.user.branch.color}55`,
                                color: a.user.branch.color,
                              }}
                            >
                              {a.user.branch.label}
                            </span>
                          )}
                          {active && a.type === "absence" && a.statut !== "refusee" && (
                            <Badge tone="alerte" point>
                              absent
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-[0.72rem] text-givre-300/60">
                          {a.type === "absence" ? "Absence" : "Retour"} du {date(a.dateDebut)}
                          {a.dateFin ? ` au ${date(a.dateFin)}` : " (durée indéterminée)"}
                        </p>
                        {a.motif && (
                          <p className="mt-0.5 text-[0.72rem] text-givre-300/45 italic">{a.motif}</p>
                        )}
                      </div>

                      <BadgeStatut famille="absence" valeur={a.statut} />

                      <div className="flex shrink-0 gap-1.5">
                        {valide && a.statut === "declaree" && (
                          <>
                            <form action={actionStatutAbsence}>
                              <input type="hidden" name="id" value={a.id} />
                              <input type="hidden" name="statut" value="validee" />
                              <ActionLigne icone="valider" ton="succes">
                                Valider
                              </ActionLigne>
                            </form>
                            <form action={actionStatutAbsence}>
                              <input type="hidden" name="id" value={a.id} />
                              <input type="hidden" name="statut" value="refusee" />
                              <ActionLigne icone="refuser" ton="danger">
                                Refuser
                              </ActionLigne>
                            </form>
                          </>
                        )}
                        {(valide || a.userId === membre.id) && (
                          <form action={actionSupprimerAbsence}>
                            <input type="hidden" name="id" value={a.id} />
                            <ActionLigne icone="supprimer" ton="danger">
                              <span className="sr-only">Supprimer</span>
                            </ActionLigne>
                          </form>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Carte>
        </div>

        {/* ── Colonne latérale ── */}
        <div className="space-y-6">
          <Carte
            titre="Toute la Maison"
            sousTitre="Vert : en poste · Orange : absent déclaré"
            icone="membres"
            padding={false}
          >
            <ul className="max-h-[380px] divide-y divide-argent-500/10 overflow-y-auto">
              {[...actifs]
                .sort((a, b) => {
                  const pa = idsPresents.has(a.id) ? 0 : idsAbsents.has(a.id) ? 2 : 1;
                  const pb = idsPresents.has(b.id) ? 0 : idsAbsents.has(b.id) ? 2 : 1;
                  return pa - pb || a.nomRp.localeCompare(b.nomRp);
                })
                .map((u) => {
                  const present = idsPresents.has(u.id);
                  const absent = idsAbsents.has(u.id);
                  return (
                    <li key={u.id} className="flex items-center gap-2.5 px-4 py-2">
                      <span
                        className={`size-2 shrink-0 rounded-full ${
                          present ? "bg-succes" : absent ? "bg-alerte" : "bg-argent-500/30"
                        }`}
                        aria-hidden
                      />
                      <Avatar nom={u.nomRp} url={u.avatarUrl} taille={24} />
                      <Link
                        href={`/membres/${u.id}`}
                        className={`min-w-0 flex-1 truncate text-[0.8rem] transition-colors hover:text-or-300 ${
                          present ? "text-givre-50" : "text-givre-300/65"
                        }`}
                      >
                        {u.nomRp}
                      </Link>
                      <span className="shrink-0 text-[0.66rem] text-givre-300/45">
                        {present
                          ? "en poste"
                          : absent
                            ? "absent"
                            : u.lastSeenAt
                              ? relatif(u.lastSeenAt)
                              : "—"}
                      </span>
                    </li>
                  );
                })}
            </ul>
          </Carte>

          {rondesDuJour.length > 0 && (
            <Carte titre="Rondes du jour" icone="patrouille" padding={false}>
              <ul className="divide-y divide-argent-500/10">
                {rondesDuJour.map((r) => (
                  <li key={r.id} className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Link
                        href="/registres/patrouilles"
                        className="min-w-0 flex-1 truncate text-[0.82rem] text-givre-50 hover:text-or-300"
                      >
                        {r.zone}
                      </Link>
                      <BadgeStatut famille="patrouille" valeur={r.statut} />
                    </div>
                    <p className="mt-0.5 truncate text-[0.68rem] text-givre-300/55">
                      {r.heureDebut && `${r.heureDebut} · `}
                      {r.patrouilleurs}
                      {r.circle && ` · ${r.circle.label}`}
                    </p>
                  </li>
                ))}
              </ul>
            </Carte>
          )}

          <Carte
            titre="Postes du jour"
            sousTitre="Qui est passé depuis minuit"
            icone="horloge"
            padding={false}
          >
            {postesDuJour.length === 0 ? (
              <Vide titre="Personne aujourd'hui" icone="lune" />
            ) : (
              <ul className="max-h-64 divide-y divide-argent-500/10 overflow-y-auto">
                {postesDuJour.map((p) => (
                  <li key={p.id} className="flex items-center gap-2.5 px-4 py-2">
                    <Avatar nom={p.user.nomRp} url={p.user.avatarUrl} taille={22} />
                    <Link
                      href={`/membres/${p.user.id}`}
                      className="min-w-0 flex-1 truncate text-[0.78rem] text-givre-100 hover:text-or-300"
                    >
                      {p.user.nomRp}
                    </Link>
                    <span className="shrink-0 text-[0.68rem] tabular-nums text-givre-300/55">
                      {dureePoste(p.debutLe, p.finLe)}
                    </span>
                    <span className="w-14 shrink-0 text-right text-[0.64rem] text-givre-300/40">
                      {p.finLe ? "terminé" : p.debutLe < seuilPoste() ? "oublié" : "en cours"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Carte>

          <Carte titre="Déclarer une absence" icone="calendrier">
            <FormulaireAbsence
              membres={membres.map((m) => ({ value: m.id, label: m.nomRp }))}
              pourAutrui={valide}
            />
          </Carte>

          <Carte titre="Rappel du règlement" icone="reglement">
            <p className="recit text-[0.92rem] text-givre-200/80">
              « Une absence prolongée se déclare à l'avance au registre de présence. Un membre absent
              sans avis pendant une longue période voit son rang gelé, puis son dossier versé aux
              archives. »
            </p>
            <p className="mt-2 flex items-center justify-end gap-1.5 text-[0.7rem] text-or-400/70">
              <Icone nom="reglement" taille={11} />
              Règlement, §VII
            </p>
          </Carte>
        </div>
      </div>
    </>
  );
}
