"use client";

import { useActionState, useState } from "react";
import { actionFabriquer, type EtatFabrication } from "@/app/actions/economie";
import { BoutonEnvoi } from "@/components/ui/form";
import { Icone } from "@/components/ui/Icone";
import { nombre } from "@/lib/format";

export function FormulaireFabriquer({
  recipeId,
  source,
  possible,
  produitParFois,
}: {
  recipeId: string;
  source: "maison" | "membre";
  /** Nombre de fabrications possibles avec le stock choisi. */
  possible: number;
  produitParFois: number;
}) {
  const [etat, action] = useActionState<EtatFabrication, FormData>(actionFabriquer, {});
  const [fois, setFois] = useState(1);

  return (
    <div className="min-w-[190px]">
      <form action={action} className="flex items-center justify-end gap-1.5">
        <input type="hidden" name="recipeId" value={recipeId} />
        <input type="hidden" name="source" value={source} />

        <div className="flex items-center rounded-[2px] border border-argent-500/25">
          <button
            type="button"
            onClick={() => setFois((n) => Math.max(1, n - 1))}
            aria-label="Diminuer"
            className="grid size-7 place-items-center text-givre-300/70 transition-colors hover:bg-nuit-600/60 hover:text-givre-50"
          >
            −
          </button>
          <input
            type="number"
            name="fois"
            min="1"
            value={fois}
            onChange={(e) => setFois(Math.max(1, Number(e.target.value) || 1))}
            aria-label="Nombre de fabrications"
            className="w-11 border-0 bg-transparent py-1 text-center text-[0.8rem] tabular-nums text-givre-50 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => setFois((n) => n + 1)}
            aria-label="Augmenter"
            className="grid size-7 place-items-center text-givre-300/70 transition-colors hover:bg-nuit-600/60 hover:text-givre-50"
          >
            +
          </button>
        </div>

        {possible > 1 && (
          <button
            type="button"
            onClick={() => setFois(possible)}
            title={`Fabriquer le maximum possible (${possible})`}
            className="rounded-[2px] border border-argent-500/25 px-1.5 py-1 text-[0.66rem] text-givre-300/70 transition-colors hover:border-or-500/35 hover:text-or-200"
          >
            max
          </button>
        )}

        <BoutonEnvoi icone="atelier" variante={possible >= fois ? "or" : "argent"} className="!py-1">
          Fabriquer
        </BoutonEnvoi>
      </form>

      {fois > 1 && (
        <p className="mt-1 text-right text-[0.66rem] text-givre-300/45">
          produira {nombre(fois * produitParFois)} unité(s)
        </p>
      )}

      {etat.succes && (
        <p className="mt-1.5 flex items-start justify-end gap-1.5 text-right text-[0.7rem] text-[#8fd0a3]">
          <Icone nom="valider" taille={11} className="mt-0.5" />
          {etat.succes}
        </p>
      )}

      {etat.erreur && (
        <div className="mt-1.5 text-right text-[0.7rem] text-[#e69a8c]">
          <p className="flex items-start justify-end gap-1.5">
            <Icone nom="alerte" taille={11} className="mt-0.5" />
            {etat.erreur}
          </p>
          {etat.manquants && etat.manquants.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-[0.66rem] text-[#e5a877]">
              {etat.manquants.map((m) => (
                <li key={m.label}>
                  {m.label} : il faut {nombre(m.requis)} {m.unite}, il y en a {nombre(m.dispo)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
