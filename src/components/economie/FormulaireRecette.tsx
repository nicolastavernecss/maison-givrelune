"use client";

import { useActionState, useState } from "react";
import { actionRecette, type EtatEco } from "@/app/actions/economie";
import { BoutonEnvoi, Case, Champ, GrilleChamps, Saisie, Selection, Zone } from "@/components/ui/form";
import { Message } from "@/components/ui/base";
import { Icone } from "@/components/ui/Icone";
import { nombre, septims } from "@/lib/format";

type Opt = { value: string; label: string; group?: string };

export function FormulaireRecette({
  metierId,
  metiers,
  matieres,
  prix,
  valeurs,
  composantsInitiaux,
  id,
}: {
  metierId: string;
  metiers: Opt[];
  matieres: Opt[];
  /** materialId → dernier cours connu, pour le chiffrage en direct. */
  prix: Record<string, number>;
  valeurs?: Record<string, string>;
  composantsInitiaux?: { materialId: string; quantity: number }[];
  id?: string;
}) {
  const [etat, action] = useActionState<EtatEco, FormData>(actionRecette, {});
  const [composants, setComposants] = useState<{ materialId: string; quantity: number }[]>(
    composantsInitiaux?.length ? composantsInitiaux : [{ materialId: "", quantity: 1 }],
  );
  const [outputQty, setOutputQty] = useState(Number(valeurs?.outputQty ?? 1));

  const modifier = (i: number, champ: "materialId" | "quantity", v: string) =>
    setComposants((c) =>
      c.map((item, j) =>
        j === i ? { ...item, [champ]: champ === "quantity" ? Number(v) : v } : item,
      ),
    );

  const total = composants.reduce((s, c) => {
    const p = prix[c.materialId];
    return p === undefined ? s : s + p * (c.quantity || 0);
  }, 0);
  const inconnues = composants.filter((c) => c.materialId && prix[c.materialId] === undefined).length;
  const parUnite = total / Math.max(1, outputQty);

  return (
    <form action={action} encType="multipart/form-data">
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

      <GrilleChamps titre="La recette">
        <Champ label="Nom de la recette" requis large>
          <Saisie name="label" required defaultValue={valeurs?.label ?? ""} maxLength={120} placeholder="Armure d'acier" />
        </Champ>

        <Champ label="Métier" requis>
          <Selection name="metierId" required options={metiers} defaultValue={valeurs?.metierId ?? metierId} />
        </Champ>

        <Champ label="Poste de travail" aide="Forge, Fourneau, Chevalet de tannage…">
          <Saisie name="station" defaultValue={valeurs?.station ?? ""} maxLength={80} />
        </Champ>

        <Champ label="Produit" requis aide="Ce que la recette fabrique.">
          <Selection
            name="outputMaterialId"
            required
            options={matieres}
            defaultValue={valeurs?.outputMaterialId ?? ""}
            vide="— Choisir —"
          />
        </Champ>

        <Champ label="Quantité produite" aide="Ex. : 1 cuir donne 4 lanières.">
          <Saisie
            name="outputQty"
            type="number"
            min="1"
            step="1"
            value={outputQty}
            onChange={(e) => setOutputQty(Math.max(1, Number(e.target.value)))}
          />
        </Champ>

        <div className="sm:col-span-2">
          <Case
            name="isChain"
            label="Palier de transformation (matière → matière)"
            aide="Fonte, tannage, sciage… Permet au calcul de coût de remonter jusqu'à la matière brute."
            defaultChecked={valeurs?.isChain === "true"}
          />
        </div>
      </GrilleChamps>

      {/* ── Nomenclature ── */}
      <fieldset className="mb-6">
        <legend className="sur-titre mb-3 block w-full border-b border-or-600/25 pb-2">
          Nomenclature — ce que la recette consomme
        </legend>

        <div className="space-y-2">
          {composants.map((c, i) => {
            const p = prix[c.materialId];
            return (
              <div key={i} className="flex flex-wrap items-end gap-2">
                <div className="min-w-[180px] flex-1">
                  <span className="mb-1 block text-[0.62rem] tracking-[0.14em] text-givre-300/50 uppercase">
                    Matière
                  </span>
                  <select
                    name="itemMaterialId"
                    value={c.materialId}
                    onChange={(e) => modifier(i, "materialId", e.target.value)}
                    className="champ"
                  >
                    <option value="">— Choisir —</option>
                    {[...new Set(matieres.map((m) => m.group ?? "Autres"))].map((g) => (
                      <optgroup key={g} label={g}>
                        {matieres
                          .filter((m) => (m.group ?? "Autres") === g)
                          .map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="w-24">
                  <span className="mb-1 block text-[0.62rem] tracking-[0.14em] text-givre-300/50 uppercase">
                    Quantité
                  </span>
                  <input
                    type="number"
                    name="itemQuantity"
                    min="0"
                    step="any"
                    value={c.quantity}
                    onChange={(e) => modifier(i, "quantity", e.target.value)}
                    className="champ"
                  />
                </div>

                <div className="w-28 pb-2 text-right text-[0.76rem] tabular-nums">
                  {c.materialId ? (
                    p === undefined ? (
                      <span className="text-[#e5a877]">non coté</span>
                    ) : (
                      <span className="text-or-200">{septims(p * (c.quantity || 0))}</span>
                    )
                  ) : (
                    <span className="text-givre-300/30">—</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setComposants((cs) => cs.filter((_, j) => j !== i))}
                  disabled={composants.length === 1}
                  aria-label="Retirer le composant"
                  className="mb-1 grid size-8 place-items-center rounded-[2px] border border-danger/30 text-[#e69a8c] transition-colors hover:bg-danger/15 disabled:opacity-30"
                >
                  <Icone nom="refuser" taille={13} />
                </button>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setComposants((c) => [...c, { materialId: "", quantity: 1 }])}
          className="mt-3 inline-flex items-center gap-1.5 rounded-[2px] border border-argent-500/25 px-3 py-1.5 text-[0.78rem] text-givre-200 transition-colors hover:border-or-500/35 hover:bg-nuit-600/60"
        >
          <Icone nom="plus" taille={13} />
          Ajouter un composant
        </button>

        {/* Chiffrage en direct */}
        <div className="mt-4 rounded-[2px] border border-or-500/25 bg-or-500/6 px-4 py-3">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1.5 text-[0.8rem]">
            <span className="text-givre-300/70">
              Coût des composants :{" "}
              <span className="text-or-200 tabular-nums">{septims(total)}</span>
            </span>
            {outputQty > 1 && (
              <span className="text-givre-300/70">
                Soit <span className="text-or-200 tabular-nums">{septims(parUnite)}</span> par unité
                ({nombre(outputQty)} produites)
              </span>
            )}
            {inconnues > 0 && (
              <span className="text-[#e5a877]">
                {inconnues} matière(s) sans cours — chiffrage partiel
              </span>
            )}
          </div>
          <p className="mt-1 text-[0.68rem] text-givre-300/45">
            Estimation au dernier cours connu. Le coût définitif, en remontant toute la chaîne de
            production, s'affiche sur la fiche de la recette une fois enregistrée.
          </p>
        </div>
      </fieldset>

      <GrilleChamps titre="Notes">
        <Champ label="Description" large>
          <Zone name="description" rows={2} defaultValue={valeurs?.description ?? ""} maxLength={800} />
        </Champ>
        <Champ label="Notes du métier" large aide="Tours de main, quantités à confirmer…">
          <Zone name="notes" rows={2} defaultValue={valeurs?.notes ?? ""} maxLength={800} />
        </Champ>
        <Champ label="Photos de la pièce" large aide="Images, 8 Mo maximum par fichier.">
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
        <BoutonEnvoi icone="recette">
          {id ? "Enregistrer la recette" : "Ajouter à la bibliothèque"}
        </BoutonEnvoi>
      </div>
    </form>
  );
}
