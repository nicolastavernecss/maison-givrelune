"use client";

import { useActionState } from "react";
import { actionChangerMotDePasse, type EtatMotDePasse } from "@/app/actions/auth";
import { BoutonEnvoi, Champ, GrilleChamps, Saisie } from "@/components/ui/form";
import { ChampMotDePasse } from "@/components/ui/ChampMotDePasse";
import { Message } from "@/components/ui/base";

export function FormulaireMotDePasse() {
  const [etat, action] = useActionState<EtatMotDePasse, FormData>(actionChangerMotDePasse, {});

  return (
    <form action={action}>
      {etat.erreur && (
        <div className="mb-5">
          <Message
            tone="danger"
            titre={etat.erreurs && etat.erreurs.length > 1 ? "Mot de passe refusé" : undefined}
          >
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
          <Message tone="succes" icone="valider">
            {etat.succes}
          </Message>
        </div>
      )}

      <GrilleChamps>
        <Champ
          label="Mot de passe actuel"
          requis
          large
          aide="Exigé même si vous êtes déjà connecté : une session dérobée ne doit pas suffire à s'emparer du compte."
        >
          <Saisie
            name="ancien"
            type="password"
            required
            autoComplete="current-password"
            maxLength={200}
          />
        </Champ>

        <ChampMotDePasse nom="nouveau" label="Nouveau mot de passe" />

        <Champ label="Confirmer le nouveau mot de passe" requis>
          <Saisie
            name="confirmation"
            type="password"
            required
            minLength={12}
            maxLength={200}
            autoComplete="new-password"
          />
        </Champ>
      </GrilleChamps>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-argent-500/12 pt-5">
        <p className="max-w-sm text-[0.72rem] text-givre-300/55">
          Changer votre mot de passe ferme toutes vos autres sessions — y compris celle d'un intrus
          éventuel.
        </p>
        <BoutonEnvoi icone="senechal">Changer le mot de passe</BoutonEnvoi>
      </div>
    </form>
  );
}
