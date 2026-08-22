"use client";

import { useActionState } from "react";
import { actionGalerie, type EtatVie } from "@/app/actions/vie";
import { BoutonEnvoi, Champ, GrilleChamps, Saisie, Zone } from "@/components/ui/form";
import { Message } from "@/components/ui/base";

export function FormulaireGalerie() {
  const [etat, action] = useActionState<EtatVie, FormData>(actionGalerie, {});

  return (
    <form action={action} encType="multipart/form-data">
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
          <Saisie name="titre" required maxLength={180} placeholder="Patrouille sur les cols du nord" />
        </Champ>
        <Champ label="Description" large>
          <Zone name="description" rows={2} maxLength={1000} />
        </Champ>
        <Champ
          label="Images"
          requis
          large
          aide="PNG, JPEG, WebP, GIF ou AVIF — 8 Mo maximum par image. Plusieurs fichiers acceptés."
        >
          <input
            type="file"
            name="fichiers"
            multiple
            required
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            className="champ file:mr-3 file:rounded-[2px] file:border-0 file:bg-nuit-600 file:px-3 file:py-1 file:text-[0.75rem] file:text-givre-100"
          />
        </Champ>
      </GrilleChamps>

      <div className="flex justify-end border-t border-argent-500/12 pt-4">
        <BoutonEnvoi icone="galerie">Ajouter à la galerie</BoutonEnvoi>
      </div>
    </form>
  );
}
