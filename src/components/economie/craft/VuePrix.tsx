import Link from "next/link";
import { Badge, Carte, Message, Stat, Vide } from "@/components/ui/base";
import { Icone } from "@/components/ui/Icone";
import { actionPrixMetier } from "@/app/actions/economie";
import { prisma } from "@/lib/db";
import { coursDuMarche } from "@/lib/economie";
import { prixMetier } from "@/lib/production";
import { nombre, relatif, septims } from "@/lib/format";

/**
 * Prix d'achat des matières, du point de vue du métier.
 *
 * Le cours du marché dit ce que la matière vaut ; ce tableau dit ce que
 * l'atelier la paie réellement. C'est ce second chiffre qui sert à calculer
 * le coût de revient et donc le bénéfice de l'artisan.
 */
export async function VuePrix({
  metier,
  peutEditer,
}: {
  metier: { id: string; key: string; label: string };
  peutEditer: boolean;
}) {
  const [recettes, cours, propres] = await Promise.all([
    prisma.recipe.findMany({
      where: { metierId: metier.id },
      select: {
        outputMaterialId: true,
        items: { select: { materialId: true } },
      },
    }),
    coursDuMarche(),
    prixMetier(metier.id),
  ]);

  // Les matières qui comptent pour cet atelier : ce qu'il consomme et ce qu'il produit.
  const consommees = new Set<string>();
  const produites = new Set<string>();
  for (const r of recettes) {
    produites.add(r.outputMaterialId);
    for (const i of r.items) consommees.add(i.materialId);
  }
  const pertinentes = [...new Set([...consommees, ...produites])];

  const matieres = await prisma.material.findMany({
    where: { id: { in: pertinentes } },
    orderBy: [{ category: "asc" }, { position: "asc" }],
  });

  const lignesDetail = await prisma.metierPrice.findMany({
    where: { metierId: metier.id },
    include: { material: { select: { label: true } } },
  });
  const majPar = new Map(lignesDetail.map((l) => [l.materialId, l.updatedAt]));

  const renseignees = matieres.filter((m) => propres.has(m.id)).length;
  const categories = [...new Set(matieres.map((m) => m.category))];

  return (
    <>
      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Matières de l'atelier" valeur={matieres.length} icone="matiere" />
        <Stat
          label="Prix d'achat renseignés"
          valeur={`${renseignees} / ${matieres.length}`}
          icone="septim"
          tone={renseignees === matieres.length ? "succes" : "attente"}
        />
        <Stat label="Consommées" valeur={consommees.size} icone="stock" />
        <Stat label="Produites" valeur={produites.size} icone="atelier" />
      </section>

      {!peutEditer && (
        <div className="mb-5">
          <Message tone="neutre" titre="Lecture seule" icone="septim">
            Seuls les membres du métier {metier.label} et les gradés saisissent ces prix.
          </Message>
        </div>
      )}

      {matieres.length === 0 ? (
        <Carte padding={false}>
          <Vide
            titre="Aucune matière"
            icone="matiere"
            texte="Cet atelier n'a pas encore de recette, donc aucune matière à chiffrer."
          />
        </Carte>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => {
            const groupe = matieres.filter((m) => m.category === cat);
            return (
              <Carte key={cat} titre={cat} icone="matiere" padding={false}>
                <div className="overflow-x-auto">
                  <table className="tableau">
                    <thead>
                      <tr>
                        <th>Matière</th>
                        <th>Rôle</th>
                        <th className="!text-right">Cours du marché</th>
                        <th className="!text-right">Prix d'achat de l'atelier</th>
                        <th className="!text-right">Écart</th>
                        <th>Mis à jour</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupe.map((m) => {
                        const marche = cours.get(m.id)?.dernier ?? null;
                        const achat = propres.get(m.id) ?? null;
                        const ecart =
                          marche !== null && achat !== null && marche > 0
                            ? ((achat - marche) / marche) * 100
                            : null;
                        return (
                          <tr key={m.id}>
                            <td>
                              <Link
                                href={`/economie/cours-du-marche/${m.key}`}
                                className="text-givre-50 transition-colors hover:text-or-300"
                              >
                                {m.label}
                              </Link>
                              <span className="ml-1.5 text-[0.68rem] text-givre-300/40">
                                / {m.unit}
                              </span>
                            </td>
                            <td>
                              <span className="flex gap-1.5">
                                {consommees.has(m.id) && <Badge tone="neutre">consommée</Badge>}
                                {produites.has(m.id) && <Badge tone="attente">produite</Badge>}
                              </span>
                            </td>
                            <td className="text-right tabular-nums text-givre-200/80">
                              {marche === null ? (
                                <span className="text-givre-300/30">non coté</span>
                              ) : (
                                septims(marche)
                              )}
                            </td>
                            <td className="text-right">
                              {peutEditer ? (
                                <form
                                  action={actionPrixMetier}
                                  className="flex items-center justify-end gap-1.5"
                                >
                                  <input type="hidden" name="metierId" value={metier.id} />
                                  <input type="hidden" name="materialId" value={m.id} />
                                  <input
                                    type="number"
                                    name="prixAchat"
                                    step="0.1"
                                    min="0"
                                    defaultValue={achat ?? ""}
                                    placeholder={marche !== null ? String(marche) : "—"}
                                    aria-label={`Prix d'achat de ${m.label}`}
                                    className="champ !w-24 !py-1 text-right text-[0.8rem]"
                                  />
                                  <button
                                    type="submit"
                                    title="Enregistrer"
                                    className="grid size-7 place-items-center rounded-[2px] border border-or-500/35 text-or-200 transition-colors hover:bg-or-500/15"
                                  >
                                    <Icone nom="valider" taille={12} />
                                  </button>
                                </form>
                              ) : achat === null ? (
                                <span className="text-givre-300/30">—</span>
                              ) : (
                                <span className="tabular-nums text-or-200">{septims(achat)}</span>
                              )}
                            </td>
                            <td className="text-right tabular-nums">
                              {ecart === null ? (
                                <span className="text-givre-300/30">—</span>
                              ) : (
                                <span
                                  className={
                                    Math.abs(ecart) < 1
                                      ? "text-givre-300/50"
                                      : ecart < 0
                                        ? "text-[#8fd0a3]"
                                        : "text-[#e69a8c]"
                                  }
                                  title={
                                    ecart < 0
                                      ? "L'atelier achète moins cher que le cours"
                                      : "L'atelier achète plus cher que le cours"
                                  }
                                >
                                  {ecart > 0 ? "+" : ""}
                                  {ecart.toFixed(0)} %
                                </span>
                              )}
                            </td>
                            <td className="text-[0.72rem] text-givre-300/50">
                              {majPar.has(m.id) ? relatif(majPar.get(m.id)!) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Carte>
            );
          })}
        </div>
      )}

      <p className="mt-5 flex items-start gap-2 text-[0.72rem] text-givre-300/45">
        <Icone nom="septim" taille={13} className="mt-0.5" />
        Le prix d'achat de l'atelier prime sur le cours du marché dans le calcul du coût de revient.
        Laissez la case vide pour revenir au cours. Le revenu, lui, est toujours calculé au cours du
        marché de l'objet produit — {nombre(produites.size)} objet(s) pour cet atelier.
      </p>
    </>
  );
}
