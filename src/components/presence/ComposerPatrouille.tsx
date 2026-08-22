"use client";

import { useActionState, useState } from "react";
import {
  actionPatrouilleDepuisPresents,
  type EtatPatrouille,
} from "@/app/actions/vie";
import { BoutonEnvoi, Champ, GrilleChamps, Saisie, Selection } from "@/components/ui/form";
import { Avatar, Badge, Message, Vide } from "@/components/ui/base";
import { Icone } from "@/components/ui/Icone";
import { PATROL_TYPES } from "@/lib/domain";

export type Present = {
  id: string;
  nomRp: string;
  avatarUrl: string;
  branche: string | null;
  brancheCouleur: string | null;
  brancheCle: string | null;
  grade: string | null;
  cercle: string | null;
  etat: string;
  duree: string;
};

export function ComposerPatrouille({
  presents,
  cercles,
  zonesConnues,
}: {
  presents: Present[];
  cercles: { value: string; label: string }[];
  zonesConnues: string[];
}) {
  const [etat, action] = useActionState<EtatPatrouille, FormData>(
    actionPatrouilleDepuisPresents,
    {},
  );

  // Par défaut on coche le Garde-Chasse : c'est sa branche qui patrouille.
  // S'il n'y a personne de la branche en poste, on coche tout le monde.
  const gardes = presents.filter((p) => p.brancheCle === "garde_chasse");
  const parDefaut = new Set((gardes.length > 0 ? gardes : presents).map((p) => p.id));
  const [coches, setCoches] = useState<Set<string>>(parDefaut);

  const basculer = (id: string) =>
    setCoches((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const maintenant = new Date();
  const heure = `${String(maintenant.getHours()).padStart(2, "0")}:${String(
    maintenant.getMinutes(),
  ).padStart(2, "0")}`;

  if (presents.length === 0) {
    return (
      <Vide
        titre="Personne en poste"
        icone="patrouille"
        texte="La composition automatique attend qu'au moins un membre se déclare présent."
      />
    );
  }

  return (
    <form action={action}>
      {etat.erreur && (
        <div className="mb-4">
          <Message tone="danger">{etat.erreur}</Message>
        </div>
      )}
      {etat.succes && (
        <div className="mb-4">
          <Message tone="succes" icone="patrouille" titre="Ronde lancée">
            {etat.succes}
          </Message>
        </div>
      )}

      {/* Participants */}
      <fieldset className="mb-5">
        <legend className="sur-titre mb-3 flex w-full items-center gap-3 border-b border-or-600/25 pb-2">
          Qui part en ronde
          <span className="ml-auto font-[var(--font-corps)] text-[0.68rem] tracking-normal text-givre-300/50 normal-case">
            {coches.size} sur {presents.length} en poste
          </span>
        </legend>

        {[...coches].map((id) => (
          <input key={id} type="hidden" name="participants" value={id} />
        ))}

        <div className="grid gap-2 sm:grid-cols-2">
          {presents.map((p) => {
            const actif = coches.has(p.id);
            return (
              <button
                type="button"
                key={p.id}
                onClick={() => basculer(p.id)}
                className={`flex items-center gap-2.5 rounded-[2px] border px-3 py-2 text-left transition-colors ${
                  actif
                    ? "border-or-500/45 bg-or-500/10"
                    : "border-argent-500/15 bg-nuit-950/30 hover:border-argent-500/30"
                }`}
              >
                <span
                  className={`grid size-4 shrink-0 place-items-center rounded-[2px] border ${
                    actif ? "border-or-400 bg-or-500/30 text-or-200" : "border-argent-500/35"
                  }`}
                >
                  {actif && <Icone nom="valider" taille={10} />}
                </span>
                <Avatar nom={p.nomRp} url={p.avatarUrl} taille={26} />
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-[0.82rem] ${
                      actif ? "text-givre-50" : "text-givre-300/70"
                    }`}
                  >
                    {p.nomRp}
                  </span>
                  <span className="block truncate text-[0.64rem] text-givre-300/50">
                    {[p.grade, p.branche, p.cercle].filter(Boolean).join(" · ") || "sans branche"}
                  </span>
                </span>
                {p.etat === "en_patrouille" && <Badge tone="actif">déjà en ronde</Badge>}
                {p.etat === "occupe" && <Badge tone="attente">occupé</Badge>}
                <span className="shrink-0 text-[0.66rem] tabular-nums text-givre-300/40">
                  {p.duree}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <GrilleChamps titre="La ronde">
        <Champ label="Zone / secteur" requis large aide="Les zones déjà patrouillées sont proposées.">
          <Saisie
            name="zone"
            required
            maxLength={200}
            list="zones-connues"
            placeholder="Cols du nord — sentier des Trois Pierres"
          />
          <datalist id="zones-connues">
            {zonesConnues.map((z) => (
              <option key={z} value={z} />
            ))}
          </datalist>
        </Champ>

        <Champ label="Type">
          <Selection
            name="type"
            defaultValue="routes"
            options={PATROL_TYPES.map((t) => ({
              value: t,
              label: t.charAt(0).toUpperCase() + t.slice(1),
            }))}
          />
        </Champ>

        <Champ label="Cercle">
          <Selection name="circleId" options={cercles} vide="— Aucun —" />
        </Champ>

        <Champ label="Date">
          <Saisie name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
        </Champ>

        <Champ label="Heure de début">
          <Saisie name="heureDebut" type="time" defaultValue={heure} />
        </Champ>

        <Champ label="Heure de fin prévue">
          <Saisie name="heureFin" type="time" />
        </Champ>
      </GrilleChamps>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-argent-500/12 pt-4">
        <p className="max-w-sm text-[0.72rem] text-givre-300/55">
          La patrouille est consignée au registre et les participants passent en état
          « en patrouille » sur ce tableau.
        </p>
        <BoutonEnvoi icone="patrouille" disabled={coches.size === 0}>
          Lancer la ronde ({coches.size})
        </BoutonEnvoi>
      </div>
    </form>
  );
}
