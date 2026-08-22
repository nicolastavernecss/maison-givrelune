"use client";

import { useActionState, useState } from "react";
import { actionEnregistrerMembre, type EtatMembre } from "@/app/actions/gouvernance";
import { BoutonEnvoi, Champ, GrilleChamps, Saisie, Selection, Zone } from "@/components/ui/form";
import { ChampMotDePasse } from "@/components/ui/ChampMotDePasse";
import { Message } from "@/components/ui/base";
import { Icone } from "@/components/ui/Icone";
import { METIER_NIVEAUX } from "@/lib/domain";

type Opt = { value: string; label: string };
type GradeOpt = Opt & { branchId: string; level: number };
type MetierOpt = Opt & { category: string };

export function FormulaireMembre({
  rangs,
  branches,
  grades,
  conseils,
  cercles,
  membres,
  metiers,
  valeurs,
  metiersInitiaux,
  id,
}: {
  rangs: Opt[];
  branches: Opt[];
  grades: GradeOpt[];
  conseils: Opt[];
  cercles: Opt[];
  membres: Opt[];
  metiers: MetierOpt[];
  valeurs?: Record<string, string>;
  metiersInitiaux?: { metierId: string; niveau: string }[];
  id?: string;
}) {
  const [etat, action] = useActionState<EtatMembre, FormData>(actionEnregistrerMembre, {});
  const [branchId, setBranchId] = useState(valeurs?.branchId ?? "");
  const [choix, setChoix] = useState<Record<string, string>>(
    Object.fromEntries((metiersInitiaux ?? []).map((m) => [m.metierId, m.niveau])),
  );

  const gradesDispo = branchId ? grades.filter((g) => g.branchId === branchId) : [];

  const basculer = (metierId: string) =>
    setChoix((c) => {
      const suivant = { ...c };
      if (suivant[metierId]) delete suivant[metierId];
      else suivant[metierId] = "apprenti";
      return suivant;
    });

  const familles = [
    { cle: "extraction", label: "Extraction & récolte" },
    { cle: "transformation", label: "Transformation & production" },
    { cle: "service", label: "Services & protection" },
  ];

  return (
    <form action={action}>
      {id && <input type="hidden" name="id" value={id} />}

      {etat.erreur && (
        <div className="mb-5">
          <Message tone="danger" titre={etat.erreurs && etat.erreurs.length > 1 ? "Mot de passe refusé" : undefined}>
            {etat.erreurs && etat.erreurs.length > 1 ? (
              <ul className="mt-1 space-y-1">
                {etat.erreurs.map((e) => (
                  <li key={e}>• {e}</li>
                ))}
              </ul>
            ) : (
              etat.erreur
            )}
          </Message>
        </div>
      )}
      {etat.succes && (
        <div className="mb-5">
          <Message tone="succes">{etat.succes}</Message>
        </div>
      )}

      <GrilleChamps titre="Identité">
        <Champ label="Nom RP" requis>
          <Saisie name="nomRp" required defaultValue={valeurs?.nomRp ?? ""} maxLength={80} />
        </Champ>
        <Champ label="Identifiant de connexion" requis aide="Minuscules, chiffres, point, tiret.">
          <Saisie
            name="login"
            required
            defaultValue={valeurs?.login ?? ""}
            maxLength={40}
            pattern="[a-z0-9._-]+"
            placeholder="prenom.nom"
          />
        </Champ>
        <Champ
          label="Pseudo Discord"
          aide="Permet au membre de se connecter avec Discord dès son premier passage."
        >
          <Saisie name="discordUsername" defaultValue={valeurs?.discordUsername ?? ""} maxLength={60} />
        </Champ>
        {id ? (
          <ChampMotDePasse
            label="Nouveau mot de passe"
            requis={false}
            aide="Laissez vide pour ne pas le changer. Le changer ferme toutes les sessions ouvertes de ce membre."
          />
        ) : (
          <ChampMotDePasse
            label="Mot de passe initial"
            aide="Même exigence que pour les membres : au moins 12 caractères, refusé s'il figure dans une fuite connue."
          />
        )}
      </GrilleChamps>

      <GrilleChamps titre="Place dans la Maison">
        <Champ label="Rang" requis>
          <Selection name="rankId" required options={rangs} defaultValue={valeurs?.rankId ?? ""} />
        </Champ>
        <Champ label="Statut" requis>
          <Selection
            name="status"
            required
            defaultValue={valeurs?.status ?? "essai"}
            options={[
              { value: "actif", label: "Actif" },
              { value: "essai", label: "Période d'essai" },
              { value: "archive", label: "Archivé" },
            ]}
          />
        </Champ>

        <Champ label="Branche">
          <select
            name="branchId"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="champ"
          >
            <option value="">— Aucune —</option>
            {branches.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </Champ>

        <Champ label="Grade" aide={branchId ? undefined : "Choisissez d'abord une branche."}>
          <Selection
            name="gradeId"
            options={gradesDispo}
            defaultValue={valeurs?.gradeId ?? ""}
            vide="— Aucun —"
            disabled={!branchId}
          />
        </Champ>

        <Champ label="Fonction de Conseil">
          <Selection
            name="councilRoleId"
            options={conseils}
            defaultValue={valeurs?.councilRoleId ?? ""}
            vide="— Aucune —"
          />
        </Champ>

        <Champ label="Cercle">
          <Selection
            name="circleId"
            options={cercles}
            defaultValue={valeurs?.circleId ?? ""}
            vide="— Aucun —"
          />
        </Champ>

        <Champ label="Présenté par" aide="Le parrain qui répond de lui devant les Patriarches.">
          <Selection
            name="presentedById"
            options={membres.filter((m) => m.value !== id)}
            defaultValue={valeurs?.presentedById ?? ""}
            vide="— Personne —"
          />
        </Champ>

        <Champ label="Biographie RP" large aide="Affichée sur sa fiche. Mise en forme acceptée.">
          <Zone name="bio" rows={3} defaultValue={valeurs?.bio ?? ""} maxLength={2000} />
        </Champ>
      </GrilleChamps>

      {/* ── Métiers ── */}
      <fieldset className="mb-6">
        <legend className="sur-titre mb-3 block w-full border-b border-or-600/25 pb-2">
          Métiers — le premier coché est le métier principal
        </legend>

        {Object.entries(choix).map(([metierId, niveau]) => (
          <input key={metierId} type="hidden" name="metiers" value={`${metierId}:${niveau}`} />
        ))}

        <div className="space-y-4">
          {familles.map((f) => (
            <div key={f.cle}>
              <p className="mb-2 text-[0.66rem] tracking-[0.16em] text-or-400/60 uppercase">
                {f.label}
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {metiers
                  .filter((m) => m.category === f.cle)
                  .map((m) => {
                    const actif = Boolean(choix[m.value]);
                    return (
                      <div
                        key={m.value}
                        className={`flex items-center gap-2 rounded-[2px] border px-2.5 py-1.5 transition-colors ${
                          actif
                            ? "border-or-500/40 bg-or-500/8"
                            : "border-argent-500/15 bg-nuit-950/30"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => basculer(m.value)}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        >
                          <span
                            className={`grid size-4 shrink-0 place-items-center rounded-[2px] border ${
                              actif ? "border-or-400 bg-or-500/30 text-or-200" : "border-argent-500/35"
                            }`}
                          >
                            {actif && <Icone nom="valider" taille={10} />}
                          </span>
                          <span
                            className={`truncate text-[0.78rem] ${
                              actif ? "text-givre-50" : "text-givre-300/70"
                            }`}
                          >
                            {m.label}
                          </span>
                        </button>
                        {actif && (
                          <select
                            value={choix[m.value]}
                            onChange={(e) =>
                              setChoix((c) => ({ ...c, [m.value]: e.target.value }))
                            }
                            className="champ !w-auto !py-0.5 !text-[0.7rem]"
                          >
                            {METIER_NIVEAUX.map((n) => (
                              <option key={n.value} value={n.value}>
                                {n.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <div className="flex justify-end border-t border-argent-500/12 pt-5">
        <BoutonEnvoi icone="membres">
          {id ? "Enregistrer la fiche" : "Créer le membre"}
        </BoutonEnvoi>
      </div>
    </form>
  );
}
