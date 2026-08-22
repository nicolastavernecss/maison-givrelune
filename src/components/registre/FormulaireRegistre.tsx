"use client";

import { useActionState } from "react";
import { actionEnregistrerEntree, type EtatRegistre } from "@/app/actions/registres";
import { BoutonEnvoi, Case, Champ, GrilleChamps, Saisie, Selection, Zone } from "@/components/ui/form";
import { Message } from "@/components/ui/base";
import type { ChampDef } from "@/lib/registres";

export type Listes = {
  membres: { value: string; label: string }[];
  materiaux: { value: string; label: string; group?: string }[];
  metiers: { value: string; label: string }[];
  branches: { value: string; label: string }[];
  cercles: { value: string; label: string }[];
  missions: { value: string; label: string }[];
};

export function FormulaireRegistre({
  registre,
  champs,
  listes,
  valeurs = {},
  id,
  libelleBouton = "Consigner au registre",
}: {
  registre: string;
  champs: ChampDef[];
  listes: Listes;
  valeurs?: Record<string, string>;
  id?: string;
  libelleBouton?: string;
}) {
  const [etat, action] = useActionState<EtatRegistre, FormData>(actionEnregistrerEntree, {});

  const sections = [...new Set(champs.map((c) => c.section ?? ""))];

  const rendre = (c: ChampDef) => {
    const val = valeurs[c.nom] ?? c.defaut ?? "";
    const commun = { name: c.nom, required: c.requis, id: `${registre}-${c.nom}` };

    switch (c.type) {
      case "zone":
        return <Zone {...commun} defaultValue={val} rows={c.large ? 4 : 3} />;
      case "nombre":
      case "septims":
      case "pourcentage":
        return (
          <Saisie
            {...commun}
            type="number"
            step={c.type === "nombre" ? "any" : "1"}
            min={c.min}
            max={c.max}
            defaultValue={val}
          />
        );
      case "date":
        return <Saisie {...commun} type="date" defaultValue={val} />;
      case "heure":
        return <Saisie {...commun} type="time" defaultValue={val} />;
      case "checkbox":
        return <Case {...commun} label={c.label} defaultChecked={val === "true"} />;
      case "select":
        return <Selection {...commun} options={c.options ?? []} defaultValue={val} />;
      case "membre":
        return <Selection {...commun} options={listes.membres} defaultValue={val} vide="— Aucun —" />;
      case "materiau":
        return <Selection {...commun} options={listes.materiaux} defaultValue={val} vide="— Hors référentiel —" />;
      case "metier":
        return <Selection {...commun} options={listes.metiers} defaultValue={val} vide="— Aucun —" />;
      case "branche":
        return <Selection {...commun} options={listes.branches} defaultValue={val} vide="— Aucune —" />;
      case "cercle":
        return <Selection {...commun} options={listes.cercles} defaultValue={val} vide="— Aucun —" />;
      case "mission":
        return <Selection {...commun} options={listes.missions} defaultValue={val} vide="— Aucune —" />;
      default:
        return <Saisie {...commun} defaultValue={val} maxLength={400} />;
    }
  };

  return (
    <form action={action}>
      <input type="hidden" name="_registre" value={registre} />
      {id && <input type="hidden" name="_id" value={id} />}

      {etat.erreur && (
        <div className="mb-5">
          <Message tone="danger">{etat.erreur}</Message>
        </div>
      )}
      {etat.succes && (
        <div className="mb-5">
          <Message tone="succes">{etat.succes}</Message>
        </div>
      )}

      {sections.map((section) => (
        <GrilleChamps key={section} titre={section || undefined}>
          {champs
            .filter((c) => (c.section ?? "") === section)
            .map((c) =>
              c.type === "checkbox" ? (
                <div key={c.nom} className={c.large ? "sm:col-span-2" : ""}>
                  {rendre(c)}
                </div>
              ) : (
                <Champ key={c.nom} label={c.label} requis={c.requis} aide={c.aide} large={c.large}>
                  {rendre(c)}
                </Champ>
              ),
            )}
        </GrilleChamps>
      ))}

      <div className="flex items-center justify-end gap-3 border-t border-argent-500/12 pt-5">
        <BoutonEnvoi>{libelleBouton}</BoutonEnvoi>
      </div>
    </form>
  );
}
