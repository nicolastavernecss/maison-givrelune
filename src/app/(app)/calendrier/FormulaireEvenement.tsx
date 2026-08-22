"use client";

import { useActionState } from "react";
import { actionEvenement, type EtatVie } from "@/app/actions/vie";
import { BoutonEnvoi, Champ, GrilleChamps, Saisie, Selection, Zone } from "@/components/ui/form";
import { Message } from "@/components/ui/base";
import { STATUSES } from "@/lib/domain";

export function FormulaireEvenement({
  valeurs,
  id,
}: {
  valeurs?: Record<string, string>;
  id?: string;
}) {
  const [etat, action] = useActionState<EtatVie, FormData>(actionEvenement, {});

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
        <Champ label="Date" requis>
          <Saisie name="date" type="date" required defaultValue={valeurs?.date ?? ""} />
        </Champ>
        <Champ label="Lieu">
          <Saisie name="lieu" defaultValue={valeurs?.lieu ?? ""} maxLength={160} placeholder="Grande Salle" />
        </Champ>
        <Champ label="Heure de rendez-vous" aide="Quand on se retrouve.">
          <Saisie name="heureRdv" type="time" defaultValue={valeurs?.heureRdv ?? ""} />
        </Champ>
        <Champ label="Heure de début" aide="Quand ça commence vraiment.">
          <Saisie name="heure" type="time" defaultValue={valeurs?.heure ?? ""} />
        </Champ>
        <Champ label="Statut">
          <Selection
            name="statut"
            options={STATUSES.evenement.map((s) => ({ value: s.value, label: s.label }))}
            defaultValue={valeurs?.statut ?? "planifie"}
          />
        </Champ>
        <Champ label="Description" large>
          <Zone name="description" rows={4} defaultValue={valeurs?.description ?? ""} maxLength={3000} />
        </Champ>
      </GrilleChamps>

      <div className="flex justify-end border-t border-argent-500/12 pt-4">
        <BoutonEnvoi icone="calendrier">{id ? "Enregistrer" : "Inscrire au calendrier"}</BoutonEnvoi>
      </div>
    </form>
  );
}
