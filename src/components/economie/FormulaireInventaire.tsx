"use client";

import { useActionState, useState } from "react";
import { actionLigneInventaire, type EtatEco } from "@/app/actions/economie";
import { BoutonEnvoi, Champ, GrilleChamps, Saisie, Selection, Zone } from "@/components/ui/form";
import { Message } from "@/components/ui/base";
import { MATERIAL_CATEGORIES, MATERIAL_STATES } from "@/lib/domain";

export type OptionMatiere = {
  value: string;
  label: string;
  group?: string;
  unit: string;
  state: string;
  category: string;
};

export function FormulaireInventaire({
  ownerType,
  ownerUserId,
  ownerMetierId,
  matieres,
  valeurs,
  id,
  avecSeuil = false,
}: {
  ownerType: "maison" | "membre" | "metier";
  ownerUserId?: string;
  ownerMetierId?: string;
  matieres: OptionMatiere[];
  valeurs?: Record<string, string>;
  id?: string;
  avecSeuil?: boolean;
}) {
  const [etat, action] = useActionState<EtatEco, FormData>(actionLigneInventaire, {});
  const [materialId, setMaterialId] = useState(valeurs?.materialId ?? "");

  const choisie = matieres.find((m) => m.value === materialId);

  return (
    <form action={action} encType="multipart/form-data">
      <input type="hidden" name="ownerType" value={ownerType} />
      {ownerUserId && <input type="hidden" name="ownerUserId" value={ownerUserId} />}
      {ownerMetierId && <input type="hidden" name="ownerMetierId" value={ownerMetierId} />}
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

      <GrilleChamps titre="Ce que vous déclarez">
        <Champ label="Matière du référentiel" aide="Rattache la ligne au cours du marché.">
          <Selection
            name="materialId"
            options={matieres}
            value={materialId}
            onChange={(e) => setMaterialId(e.target.value)}
            vide="— Objet hors référentiel —"
          />
        </Champ>

        <Champ label="Libellé libre" aide="Pour une pièce unique : une tenue, une arme nommée…">
          <Saisie
            name="customLabel"
            defaultValue={valeurs?.customLabel ?? ""}
            maxLength={160}
            placeholder="Tenue de cour brodée"
          />
        </Champ>

        <Champ label="Quantité" requis>
          <Saisie
            name="quantity"
            type="number"
            step="any"
            min="0"
            required
            defaultValue={valeurs?.quantity ?? "0"}
          />
        </Champ>

        <Champ label="Unité">
          <Saisie
            name="unit"
            key={choisie?.unit ?? "unite"}
            defaultValue={valeurs?.unit ?? choisie?.unit ?? "unité"}
            maxLength={30}
          />
        </Champ>

        <Champ label="Catégorie">
          <Selection
            name="category"
            key={choisie?.category ?? "cat"}
            defaultValue={valeurs?.category ?? choisie?.category ?? ""}
            options={MATERIAL_CATEGORIES.map((c) => ({ value: c, label: c }))}
            vide="— Non classé —"
          />
        </Champ>

        <Champ label="Sous-état" aide="Minerai, lingot, raffiné, transformé…">
          <Selection
            name="state"
            key={choisie?.state ?? "state"}
            defaultValue={valeurs?.state ?? choisie?.state ?? ""}
            options={Object.entries(MATERIAL_STATES).map(([value, label]) => ({ value, label }))}
            vide="— Aucun —"
          />
        </Champ>
      </GrilleChamps>

      <GrilleChamps titre="Valeur & suivi">
        <Champ
          label="Valeur unitaire (Septims)"
          aide="Laissez vide pour utiliser le cours du marché."
        >
          <Saisie
            name="unitValue"
            type="number"
            step="0.1"
            min="0"
            defaultValue={valeurs?.unitValue ?? ""}
          />
        </Champ>

        {avecSeuil && (
          <Champ label="Seuil bas" aide="Une alerte apparaît au tableau de bord sous ce seuil.">
            <Saisie
              name="seuilBas"
              type="number"
              step="any"
              min="0"
              defaultValue={valeurs?.seuilBas ?? ""}
            />
          </Champ>
        )}

        <Champ label="Motif du mouvement" aide="Consigné à l'historique si la quantité change.">
          <Saisie
            name="motif"
            maxLength={160}
            placeholder="Récolte versée aux communs, prélèvement d'atelier…"
          />
        </Champ>

        <Champ label="Notes" large>
          <Zone name="notes" rows={2} defaultValue={valeurs?.notes ?? ""} maxLength={1000} />
        </Champ>

        <Champ
          label="Photos / pièces jointes"
          large
          aide="Images uniquement, 8 Mo maximum par fichier. Utile pour montrer une tenue ou une pièce forgée."
        >
          <input
            type="file"
            name="fichiers"
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            className="champ file:mr-3 file:rounded-[2px] file:border-0 file:bg-nuit-600 file:px-3 file:py-1 file:text-[0.75rem] file:text-givre-100"
          />
        </Champ>
      </GrilleChamps>

      <div className="flex justify-end border-t border-argent-500/12 pt-4">
        <BoutonEnvoi icone="stash">{id ? "Enregistrer" : "Ajouter à l'inventaire"}</BoutonEnvoi>
      </div>
    </form>
  );
}
