"use client";

import { useActionState, useState } from "react";
import { actionCommande, type EtatCommande } from "@/app/actions/commandes";
import { BoutonEnvoi, Case, Champ, GrilleChamps, Saisie, Selection, Zone } from "@/components/ui/form";
import { Message } from "@/components/ui/base";
import { Icone } from "@/components/ui/Icone";
import { STATUSES } from "@/lib/domain";
import { septims } from "@/lib/format";

type Opt = { value: string; label: string; group?: string };
export type RecetteChiffree = {
  value: string;
  label: string;
  group?: string;
  cout: number | null;
  conseille: number | null;
};

export function FormulaireCommande({
  artisans,
  metiers,
  recettes,
  valeurs,
  id,
}: {
  artisans: Opt[];
  metiers: Opt[];
  recettes: RecetteChiffree[];
  valeurs?: Record<string, string>;
  id?: string;
}) {
  const [etat, action] = useActionState<EtatCommande, FormData>(actionCommande, {});

  const [prix, setPrix] = useState(Number(valeurs?.prixConvenu ?? 0));
  const [acompte, setAcompte] = useState(Number(valeurs?.acompte ?? 0));
  const [quantite, setQuantite] = useState(Number(valeurs?.quantite ?? 1));
  const [recetteId, setRecetteId] = useState(valeurs?.recipeId ?? "");

  const recette = recettes.find((r) => r.value === recetteId);
  const coutMatiere = recette?.cout != null ? recette.cout * quantite : null;
  const conseille = recette?.conseille != null ? recette.conseille * quantite : null;
  const reste = Math.max(0, prix - acompte);
  const marge = coutMatiere != null ? prix - coutMatiere : null;

  return (
    <form action={action} encType="multipart/form-data">
      {id && <input type="hidden" name="id" value={id} />}
      {coutMatiere != null && (
        <input type="hidden" name="coutMatiereEstime" value={coutMatiere} />
      )}

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

      {/* ── Client ── */}
      <GrilleChamps titre="Client">
        <Champ label="Nom RP" requis>
          <Saisie name="clientNomRp" required defaultValue={valeurs?.clientNomRp ?? ""} maxLength={120} />
        </Champ>
        <Champ label="Maison / Guilde / Faction">
          <Saisie name="clientMaison" defaultValue={valeurs?.clientMaison ?? ""} maxLength={120} />
        </Champ>
        <Champ label="Moyen de contact" large aide="Discord, corbeau, messager, en personne…">
          <Saisie name="clientContact" defaultValue={valeurs?.clientContact ?? ""} maxLength={160} />
        </Champ>
      </GrilleChamps>

      {/* ── Commande ── */}
      <GrilleChamps titre="Commande">
        <Champ label="Artisan concerné">
          <Selection
            name="artisanId"
            options={artisans}
            defaultValue={valeurs?.artisanId ?? ""}
            vide="— Moi-même —"
          />
        </Champ>
        <Champ label="Métier">
          <Selection name="metierId" options={metiers} defaultValue={valeurs?.metierId ?? ""} vide="— Aucun —" />
        </Champ>

        <Champ
          label="Recette de référence"
          large
          aide="Facultatif : pré-remplit le coût matière et suggère un prix depuis le cours du marché."
        >
          <select
            name="recipeId"
            value={recetteId}
            onChange={(e) => setRecetteId(e.target.value)}
            className="champ"
          >
            <option value="">— Aucune —</option>
            {[...new Set(recettes.map((r) => r.group ?? "Autres"))].map((g) => (
              <optgroup key={g} label={g}>
                {recettes
                  .filter((r) => (r.group ?? "Autres") === g)
                  .map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                      {r.cout != null ? ` — coût ${Math.round(r.cout)} ⊙` : ""}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </Champ>

        <Champ label="Objet(s) demandé(s)" requis large>
          <Zone name="objets" required rows={2} defaultValue={valeurs?.objets ?? ""} maxLength={600} />
        </Champ>

        <Champ label="Quantité" requis>
          <Saisie
            name="quantite"
            type="number"
            min="1"
            step="1"
            required
            value={quantite}
            onChange={(e) => setQuantite(Math.max(1, Number(e.target.value)))}
          />
        </Champ>

        <div className="flex items-end">
          <Case
            name="materiauxFournisParClient"
            label="Matériaux fournis par le client"
            aide="Si coché, la Maison ne fournit que le travail."
            defaultChecked={valeurs?.materiauxFournisParClient === "true"}
          />
        </div>

        <Champ label="Matériaux à fournir par la Maison" large>
          <Zone
            name="materiauxAFournir"
            rows={2}
            defaultValue={valeurs?.materiauxAFournir ?? ""}
            maxLength={600}
            placeholder="Lingots d'acier, lanières de cuir…"
          />
        </Champ>
      </GrilleChamps>

      {/* ── Paiement ── */}
      <GrilleChamps titre="Paiement (Septims)">
        <Champ
          label="Prix convenu"
          requis
          aide={conseille != null ? `Prix conseillé pour cette quantité : ${Math.round(conseille)} ⊙` : undefined}
        >
          <Saisie
            name="prixConvenu"
            type="number"
            min="0"
            step="1"
            required
            value={prix}
            onChange={(e) => setPrix(Math.max(0, Number(e.target.value)))}
          />
        </Champ>

        <Champ label="Acompte versé">
          <Saisie
            name="acompte"
            type="number"
            min="0"
            step="1"
            max={prix}
            value={acompte}
            onChange={(e) => setAcompte(Math.max(0, Number(e.target.value)))}
          />
        </Champ>

        <div className="sm:col-span-2">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-[2px] border border-or-500/25 bg-or-500/6 px-4 py-3">
            <span>
              <span className="block text-[0.58rem] tracking-[0.16em] text-or-400/70 uppercase">
                Reste à payer
              </span>
              <span
                className={`titre-imperial text-lg tabular-nums ${
                  reste > 0 ? "text-[#e69a8c]" : "text-[#8fd0a3]"
                }`}
              >
                {septims(reste)}
              </span>
            </span>

            {coutMatiere != null && (
              <>
                <span>
                  <span className="block text-[0.58rem] tracking-[0.16em] text-givre-300/45 uppercase">
                    Coût matière estimé
                  </span>
                  <span className="text-[0.95rem] tabular-nums text-givre-100">
                    {septims(coutMatiere)}
                  </span>
                </span>
                <span>
                  <span className="block text-[0.58rem] tracking-[0.16em] text-givre-300/45 uppercase">
                    Marge sur la commande
                  </span>
                  <span
                    className={`text-[0.95rem] tabular-nums ${
                      (marge ?? 0) >= 0 ? "text-[#8fd0a3]" : "text-[#e69a8c]"
                    }`}
                  >
                    {marge === null ? "—" : `${marge >= 0 ? "+" : ""}${septims(marge)}`}
                  </span>
                </span>
              </>
            )}

            {conseille != null && prix === 0 && (
              <button
                type="button"
                onClick={() => setPrix(Math.round(conseille))}
                className="ml-auto inline-flex items-center gap-1.5 rounded-[2px] border border-or-500/40 px-3 py-1.5 text-[0.76rem] text-or-200 transition-colors hover:bg-or-500/15"
              >
                <Icone nom="septim" taille={13} />
                Appliquer le prix conseillé
              </button>
            )}
          </div>
        </div>
      </GrilleChamps>

      {/* ── Suivi ── */}
      <GrilleChamps titre="Suivi">
        <Champ label="Date de commande" requis>
          <Saisie
            name="dateCommande"
            type="date"
            required
            defaultValue={valeurs?.dateCommande ?? new Date().toISOString().slice(0, 10)}
          />
        </Champ>
        <Champ label="Date de livraison prévue">
          <Saisie name="dateLivraisonPrevue" type="date" defaultValue={valeurs?.dateLivraisonPrevue ?? ""} />
        </Champ>
        <Champ label="État">
          <Selection
            name="etat"
            options={STATUSES.commande.map((s) => ({ value: s.value, label: s.label }))}
            defaultValue={valeurs?.etat ?? "en_attente"}
          />
        </Champ>
        <Champ label="Photos de la pièce" aide="Images, 8 Mo maximum.">
          <input
            type="file"
            name="fichiers"
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            className="champ file:mr-3 file:rounded-[2px] file:border-0 file:bg-nuit-600 file:px-3 file:py-1 file:text-[0.75rem] file:text-givre-100"
          />
        </Champ>
        <Champ label="Observations" large>
          <Zone name="observations" rows={3} defaultValue={valeurs?.observations ?? ""} maxLength={2000} />
        </Champ>
      </GrilleChamps>

      <div className="flex justify-end border-t border-argent-500/12 pt-5">
        <BoutonEnvoi icone="commande">
          {id ? "Enregistrer la commande" : "Enregistrer la commande"}
        </BoutonEnvoi>
      </div>
    </form>
  );
}
