"use client";

import { useActionState } from "react";
import { actionRelevePrix, type EtatEco } from "@/app/actions/economie";
import { BoutonEnvoi, Champ, GrilleChamps, Saisie, Selection } from "@/components/ui/form";
import { Message } from "@/components/ui/base";

export function FormulaireReleve({
  matieres,
  materialId,
  suggestion,
}: {
  matieres: { value: string; label: string; group?: string }[];
  materialId?: string;
  suggestion?: number | null;
}) {
  const [etat, action] = useActionState<EtatEco, FormData>(actionRelevePrix, {});
  const aujourdhui = new Date().toISOString().slice(0, 10);

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

      <GrilleChamps colonnes={2}>
        {materialId ? (
          <input type="hidden" name="materialId" value={materialId} />
        ) : (
          <Champ label="Matière" requis large>
            <Selection name="materialId" options={matieres} required vide="— Choisir une matière —" />
          </Champ>
        )}

        <Champ
          label="Prix unitaire (Septims)"
          requis
          aide={suggestion ? `Dernier cours connu : ${suggestion} ⊙` : "Le prix que vous avez constaté."}
        >
          <Saisie
            name="price"
            type="number"
            step="0.1"
            min="0.1"
            required
            defaultValue={suggestion ?? ""}
            placeholder="0"
          />
        </Champ>

        <Champ label="Date du relevé">
          <Saisie name="date" type="date" defaultValue={aujourdhui} max={aujourdhui} />
        </Champ>

        <Champ label="Source / vendeur" aide="Comptoir, ville, membre… facultatif.">
          <Saisie name="source" maxLength={120} placeholder="Comptoir de Vendeaume" />
        </Champ>

        <Champ label="Note">
          <Saisie name="note" maxLength={200} placeholder="Vente en gros, prix négocié…" />
        </Champ>
      </GrilleChamps>

      <div className="flex justify-end border-t border-argent-500/12 pt-4">
        <BoutonEnvoi icone="marche">Relever le cours</BoutonEnvoi>
      </div>
    </form>
  );
}
