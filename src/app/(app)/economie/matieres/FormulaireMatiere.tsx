"use client";

import { useActionState } from "react";
import { actionMatiere, type EtatEco } from "@/app/actions/economie";
import { BoutonEnvoi, Case, Champ, GrilleChamps, Saisie, Selection, Zone } from "@/components/ui/form";
import { Message } from "@/components/ui/base";
import { MATERIAL_CATEGORIES, MATERIAL_STATES } from "@/lib/domain";

export function FormulaireMatiere({
  valeurs,
  id,
}: {
  valeurs?: Record<string, string>;
  id?: string;
}) {
  const [etat, action] = useActionState<EtatEco, FormData>(actionMatiere, {});

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
        <Champ label="Libellé" requis>
          <Saisie name="label" required defaultValue={valeurs?.label ?? ""} maxLength={90} />
        </Champ>

        <Champ label="Clé technique" aide="Laissez vide : engendrée depuis le libellé.">
          <Saisie
            name="key"
            defaultValue={valeurs?.key ?? ""}
            maxLength={60}
            placeholder="lingot_acier"
            readOnly={Boolean(id)}
            disabled={Boolean(id)}
          />
        </Champ>

        <Champ label="Catégorie" requis>
          <Selection
            name="category"
            required
            defaultValue={valeurs?.category ?? "Minerais & Métaux"}
            options={MATERIAL_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
        </Champ>

        <Champ label="Sous-catégorie" aide="Ex. : Fer, Acier, Soie…">
          <Saisie name="subcategory" defaultValue={valeurs?.subcategory ?? ""} maxLength={60} />
        </Champ>

        <Champ label="Sous-état">
          <Selection
            name="state"
            defaultValue={valeurs?.state ?? "brut"}
            options={Object.entries(MATERIAL_STATES).map(([value, label]) => ({ value, label }))}
          />
        </Champ>

        <Champ label="Unité">
          <Saisie name="unit" defaultValue={valeurs?.unit ?? "unité"} maxLength={30} />
        </Champ>

        <Champ label="Description" large>
          <Zone name="description" rows={2} defaultValue={valeurs?.description ?? ""} maxLength={600} />
        </Champ>

        <div className="sm:col-span-2">
          <Case
            name="isCraftable"
            label="Matière fabricable"
            aide="Cochée automatiquement dès qu'une recette la produit."
            defaultChecked={valeurs?.isCraftable === "true"}
          />
        </div>
      </GrilleChamps>

      <div className="flex justify-end border-t border-argent-500/12 pt-4">
        <BoutonEnvoi icone="matiere">{id ? "Enregistrer" : "Ajouter au référentiel"}</BoutonEnvoi>
      </div>
    </form>
  );
}
