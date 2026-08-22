"use client";

import { useActionState } from "react";
import { actionMouvementTresorerie, type EtatTresorerie } from "@/app/actions/commandes";
import { BoutonEnvoi, Champ, GrilleChamps, Saisie, Selection } from "@/components/ui/form";
import { Message } from "@/components/ui/base";

const CATEGORIES = [
  { value: "commande", label: "Commande" },
  { value: "commerce", label: "Commerce" },
  { value: "dotation", label: "Dotation" },
  { value: "achat", label: "Achat de matières" },
  { value: "solde", label: "Solde des membres" },
  { value: "entretien", label: "Entretien & ateliers" },
  { value: "diplomatie", label: "Diplomatie" },
  { value: "divers", label: "Divers" },
];

export function FormulaireTresorerie() {
  const [etat, action] = useActionState<EtatTresorerie, FormData>(actionMouvementTresorerie, {});

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
        <Champ label="Sens" requis>
          <Selection
            name="sens"
            required
            defaultValue="entree"
            options={[
              { value: "entree", label: "Entrée — le coffre se remplit" },
              { value: "sortie", label: "Sortie — le coffre se vide" },
            ]}
          />
        </Champ>

        <Champ label="Montant (Septims)" requis>
          <Saisie name="montant" type="number" min="1" step="1" required placeholder="0" />
        </Champ>

        <Champ label="Catégorie">
          <Selection name="categorie" options={CATEGORIES} defaultValue="divers" />
        </Champ>

        <Champ label="Date">
          <Saisie name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
        </Champ>

        <Champ
          label="Motif"
          requis
          large
          aide="Tout mouvement des biens communs doit être motivé et consigné (règlement §VI)."
        >
          <Saisie
            name="motif"
            required
            maxLength={200}
            placeholder="Achat de soie pour la commande de Blancherive"
          />
        </Champ>
      </GrilleChamps>

      <div className="flex justify-end border-t border-argent-500/12 pt-4">
        <BoutonEnvoi icone="tresorerie">Consigner le mouvement</BoutonEnvoi>
      </div>
    </form>
  );
}
