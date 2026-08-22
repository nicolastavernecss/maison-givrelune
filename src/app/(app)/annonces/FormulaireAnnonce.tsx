"use client";

import { useActionState } from "react";
import { actionAnnonce, type EtatVie } from "@/app/actions/vie";
import { BoutonEnvoi, Case, Champ, GrilleChamps, Saisie, Selection, Zone } from "@/components/ui/form";
import { Message } from "@/components/ui/base";

export function FormulaireAnnonce({
  branches,
  valeurs,
  id,
}: {
  branches: { value: string; label: string }[];
  valeurs?: Record<string, string>;
  id?: string;
}) {
  const [etat, action] = useActionState<EtatVie, FormData>(actionAnnonce, {});

  return (
    <form action={action}>
      {id && <input type="hidden" name="id" value={id} />}

      {etat.erreur && (
        <div className="mb-4">
          <Message tone="danger">{etat.erreur}</Message>
        </div>
      )}
      {etat.succes && (
        <div className="mb-4">
          <Message tone="succes">{etat.succes}</Message>
        </div>
      )}

      <GrilleChamps>
        <Champ label="Titre" requis large>
          <Saisie name="titre" required defaultValue={valeurs?.titre ?? ""} maxLength={180} />
        </Champ>

        <Champ label="Branche concernée" aide="Vide = annonce pour toute la Maison.">
          <Selection
            name="branchId"
            options={branches}
            defaultValue={valeurs?.branchId ?? ""}
            vide="— Toute la Maison —"
          />
        </Champ>

        <div className="flex items-end">
          <Case
            name="epingle"
            label="Épingler en tête"
            aide="L'annonce reste au sommet du tableau d'affichage."
            defaultChecked={valeurs?.epingle === "true"}
          />
        </div>

        <Champ
          label="Contenu"
          requis
          large
          aide="Mise en forme acceptée : ## titre, - liste, **gras**, > citation."
        >
          <Zone name="contenu" required rows={8} defaultValue={valeurs?.contenu ?? ""} maxLength={8000} />
        </Champ>
      </GrilleChamps>

      <div className="flex justify-end border-t border-argent-500/12 pt-4">
        <BoutonEnvoi icone="annonce">{id ? "Enregistrer" : "Publier l'annonce"}</BoutonEnvoi>
      </div>
    </form>
  );
}
