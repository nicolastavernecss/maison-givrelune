"use client";

import { useActionState } from "react";
import { actionAbsence, type EtatVie } from "@/app/actions/vie";
import { BoutonEnvoi, Champ, GrilleChamps, Saisie, Selection, Zone } from "@/components/ui/form";
import { Message } from "@/components/ui/base";

export function FormulaireAbsence({
  membres,
  pourAutrui,
}: {
  membres: { value: string; label: string }[];
  pourAutrui: boolean;
}) {
  const [etat, action] = useActionState<EtatVie, FormData>(actionAbsence, {});

  return (
    <form action={action}>
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
        {pourAutrui && (
          <Champ label="Membre" aide="Vide = pour vous-même.">
            <Selection name="userId" options={membres} vide="— Moi-même —" />
          </Champ>
        )}

        <Champ label="Nature">
          <Selection
            name="type"
            defaultValue="absence"
            options={[
              { value: "absence", label: "Absence annoncée" },
              { value: "retour", label: "Retour de la Maison" },
            ]}
          />
        </Champ>

        <Champ label="Du" requis>
          <Saisie
            name="dateDebut"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </Champ>

        <Champ label="Au" aide="Vide si la durée est indéterminée.">
          <Saisie name="dateFin" type="date" />
        </Champ>

        <Champ label="Motif" large aide="Le règlement §VII impose de déclarer les absences prolongées.">
          <Zone name="motif" rows={2} maxLength={600} placeholder="Affaires familiales à Faillaise…" />
        </Champ>
      </GrilleChamps>

      <div className="flex justify-end border-t border-argent-500/12 pt-4">
        <BoutonEnvoi icone="presence">Déclarer</BoutonEnvoi>
      </div>
    </form>
  );
}
