import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge, Carte, Definitions, EnTetePage, LienBouton, Stat, Vide } from "@/components/ui/base";
import { Courbe } from "@/components/ui/Courbe";
import { Icone } from "@/components/ui/Icone";
import { Tableau } from "@/components/ui/Tableau";
import { ActionLigne } from "@/components/ui/form";
import { actionSupprimerReleve } from "@/app/actions/economie";
import { exigerDroit, peut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { contexteChiffrage, chiffrerRecette, coursDuMarche } from "@/lib/economie";
import { MATERIAL_STATES, PERMISSIONS as P } from "@/lib/domain";
import { date, dateHeure, nombre, relatif, septims, variation } from "@/lib/format";
import { FormulaireReleve } from "../FormulaireReleve";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cle: string }>;
}): Promise<Metadata> {
  const { cle } = await params;
  const m = await prisma.material.findUnique({ where: { key: cle }, select: { label: true } });
  return { title: m ? `${m.label} — cours` : "Cours du marché" };
}

const PERIODES = [
  { cle: "30", label: "30 jours" },
  { cle: "90", label: "3 mois" },
  { cle: "365", label: "1 an" },
  { cle: "tout", label: "Tout" },
];

export default async function FicheCours({
  params,
  searchParams,
}: {
  params: Promise<{ cle: string }>;
  searchParams: Promise<{ periode?: string }>;
}) {
  const membre = await exigerDroit(P.MARKET_READ);
  const { cle } = await params;
  const { periode = "tout" } = await searchParams;

  const matiere = await prisma.material.findUnique({ where: { key: cle } });
  if (!matiere) notFound();

  const [releves, cours, produitePar, utiliseeDans, stockMaison, stockMembres, ctx] =
    await Promise.all([
      prisma.marketPrice.findMany({
        where: { materialId: matiere.id },
        orderBy: { date: "desc" },
        include: { member: { select: { id: true, nomRp: true } } },
        take: 200,
      }),
      coursDuMarche(),
      prisma.recipe.findMany({
        where: { outputMaterialId: matiere.id },
        include: { metier: true, items: { include: { material: true } } },
      }),
      prisma.recipeItem.findMany({
        where: { materialId: matiere.id },
        include: { recipe: { include: { metier: true, outputMaterial: true } } },
        take: 40,
      }),
      prisma.inventoryItem.aggregate({
        where: { ownerType: "maison", materialId: matiere.id },
        _sum: { quantity: true },
      }),
      prisma.inventoryItem.aggregate({
        where: { ownerType: "membre", materialId: matiere.id },
        _sum: { quantity: true },
      }),
      contexteChiffrage(),
    ]);

  const c = cours.get(matiere.id);
  const jours = periode === "tout" ? null : Number(periode);
  const seuil = jours ? Date.now() - jours * 86_400_000 : 0;
  const points = (c?.historique ?? []).filter((p) => p.t >= seuil);

  const varPct = c?.precedent != null ? variation(c.dernier, c.precedent) : null;
  const recetteProd = produitePar[0];
  const chiffrage = recetteProd
    ? chiffrerRecette(
        {
          id: recetteProd.id,
          outputMaterialId: recetteProd.outputMaterialId,
          outputQty: recetteProd.outputQty,
          items: recetteProd.items.map((i) => ({ materialId: i.materialId, quantity: i.quantity })),
        },
        ctx,
      )
    : null;

  return (
    <>
      <EnTetePage
        surTitre={`${matiere.category}${matiere.subcategory ? ` · ${matiere.subcategory}` : ""}`}
        titre={matiere.label}
        icone="marche"
        texte={matiere.description || `Cours relevé par les membres, exprimé en Septims par ${matiere.unit}.`}
        actions={
          <LienBouton href="/economie/cours-du-marche" variante="argent" icone="retour">
            Toutes les matières
          </LienBouton>
        }
      />

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat
          label="Dernier cours"
          valeur={c ? septims(c.dernier) : "—"}
          sousTexte={c ? relatif(c.date) : "aucun relevé"}
          icone="septim"
          tone="attente"
        />
        <Stat
          label="Variation"
          valeur={
            varPct === null ? "—" : `${varPct > 0 ? "+" : ""}${varPct.toFixed(1).replace(".", ",")} %`
          }
          sousTexte="depuis le relevé précédent"
          icone="marche"
          tone={varPct === null ? "neutre" : varPct > 0 ? "succes" : varPct < 0 ? "danger" : "neutre"}
        />
        <Stat label="Moyenne" valeur={c ? septims(c.moyenne) : "—"} sousTexte={`${c?.nb ?? 0} relevés`} icone="commerce" />
        <Stat label="Plus bas" valeur={c ? septims(c.min) : "—"} icone="bas" tone="succes" />
        <Stat label="Plus haut" valeur={c ? septims(c.max) : "—"} icone="chevron" tone="danger" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Carte
            titre="Évolution du cours"
            sousTitre={`${points.length} relevé(s) sur la période`}
            icone="marche"
            actions={
              <div className="flex gap-1">
                {PERIODES.map((p) => (
                  <Link
                    key={p.cle}
                    href={`?periode=${p.cle}`}
                    className={`rounded-[2px] px-2 py-1 text-[0.68rem] transition-colors ${
                      periode === p.cle
                        ? "bg-or-500/15 text-or-200"
                        : "text-givre-300/60 hover:bg-nuit-700/60"
                    }`}
                  >
                    {p.label}
                  </Link>
                ))}
              </div>
            }
          >
            <Courbe points={points} hauteur={260} libelle={matiere.key} />
            <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-argent-500/12 pt-3 text-[0.7rem] text-givre-300/55">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full ring-2 ring-[#5f9e73]" /> plus bas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full ring-2 ring-[#bf5a4c]" /> plus haut
              </span>
              <span className="ml-auto">Prix en Septims par {matiere.unit}</span>
            </div>
          </Carte>

          <Carte titre="Relevés" sousTitre="Le registre des prix constatés" icone="registre" padding={false}>
            <Tableau
              donnees={releves}
              cle={(r) => r.id}
              vide="Aucun relevé"
              videIcone="marche"
              videTexte="Soyez le premier à consigner un prix pour cette matière."
              colonnes={[
                {
                  cle: "prix",
                  entete: "Prix",
                  principal: true,
                  numerique: true,
                  rendu: (r) => <span className="text-or-200">{septims(r.price)}</span>,
                },
                { cle: "date", entete: "Date", rendu: (r) => date(r.date) },
                {
                  cle: "source",
                  entete: "Source",
                  rendu: (r) => r.source || <span className="text-givre-300/30">—</span>,
                },
                {
                  cle: "membre",
                  entete: "Relevé par",
                  rendu: (r) =>
                    r.member ? (
                      <Link href={`/membres/${r.member.id}`} className="hover:text-or-300">
                        {r.member.nomRp}
                      </Link>
                    ) : (
                      "—"
                    ),
                },
                {
                  cle: "note",
                  entete: "Note",
                  masquerMobile: true,
                  rendu: (r) => (
                    <span className="text-[0.76rem] text-givre-300/60">{r.note || "—"}</span>
                  ),
                },
              ]}
              actions={(r) =>
                r.memberId === membre.id || peut(membre, P.MARKET_MANAGE) ? (
                  <form action={actionSupprimerReleve}>
                    <input type="hidden" name="id" value={r.id} />
                    <ActionLigne icone="supprimer" ton="danger">
                      <span className="sr-only">Supprimer le relevé de {dateHeure(r.date)}</span>
                    </ActionLigne>
                  </form>
                ) : null
              }
            />
          </Carte>

          {peut(membre, P.MARKET_CREATE) && (
            <Carte titre={`Relever le cours de « ${matiere.label} »`} icone="plus">
              <FormulaireReleve
                matieres={[]}
                materialId={matiere.id}
                suggestion={c ? Math.round(c.dernier * 10) / 10 : null}
              />
            </Carte>
          )}
        </div>

        {/* ── Colonne latérale ── */}
        <div className="space-y-6">
          <Carte titre="Fiche matière" icone="matiere">
            <Definitions
              colonnes={1}
              items={[
                ["Catégorie", matiere.category],
                ["Sous-catégorie", matiere.subcategory || "—"],
                ["Sous-état", MATERIAL_STATES[matiere.state] ?? matiere.state],
                ["Unité", matiere.unit],
                [
                  "Fabricable",
                  matiere.isCraftable ? (
                    <Badge tone="succes">Oui — recette disponible</Badge>
                  ) : (
                    <Badge tone="neutre">Matière première</Badge>
                  ),
                ],
                ["Clé technique", <code key="k" className="text-[0.72rem] text-givre-300/60">{matiere.key}</code>],
              ]}
            />
          </Carte>

          <Carte titre="Dans les stocks" icone="stock">
            <Definitions
              colonnes={1}
              items={[
                [
                  "Stock commun",
                  `${nombre(stockMaison._sum.quantity ?? 0)} ${matiere.unit}`,
                ],
                [
                  "Stashs des membres",
                  `${nombre(stockMembres._sum.quantity ?? 0)} ${matiere.unit}`,
                ],
                [
                  "Valeur du stock commun",
                  septims((stockMaison._sum.quantity ?? 0) * (c?.dernier ?? 0)),
                ],
              ]}
            />
          </Carte>

          {produitePar.length > 0 && (
            <Carte titre="Comment on la produit" icone="atelier" padding={false}>
              <ul className="divide-y divide-argent-500/10">
                {produitePar.map((r) => (
                  <li key={r.id} className="px-4 py-3">
                    <Link
                      href={`/economie/ateliers/${r.metier.key}`}
                      className="text-[0.85rem] text-givre-50 hover:text-or-300"
                    >
                      {r.label}
                    </Link>
                    <p className="mt-1 text-[0.72rem] text-givre-300/60">
                      {r.metier.label}
                      {r.station && ` · ${r.station}`} · produit {r.outputQty} {matiere.unit}
                    </p>
                    <p className="mt-1 text-[0.72rem] text-givre-300/70">
                      {r.items
                        .map((i) => `${nombre(i.quantity)} × ${i.material.label}`)
                        .join(" + ")}
                    </p>
                  </li>
                ))}
              </ul>
              {chiffrage?.cout != null && (
                <div className="border-t border-argent-500/12 px-4 py-3">
                  <p className="text-[0.74rem] text-givre-300/70">
                    Coût de revient calculé :{" "}
                    <span className="text-or-200">{septims(chiffrage.cout)}</span> par {matiere.unit}
                    {c && (
                      <>
                        {" "}
                        — soit{" "}
                        <span className={chiffrage.cout < c.dernier ? "text-[#8fd0a3]" : "text-[#e69a8c]"}>
                          {chiffrage.cout < c.dernier ? "moins cher" : "plus cher"}
                        </span>{" "}
                        que le cours.
                      </>
                    )}
                  </p>
                </div>
              )}
            </Carte>
          )}

          {utiliseeDans.length > 0 && (
            <Carte titre="Où elle est consommée" icone="recette" padding={false}>
              <ul className="max-h-80 divide-y divide-argent-500/10 overflow-y-auto">
                {utiliseeDans.map((ri) => (
                  <li key={ri.id} className="flex items-center gap-2.5 px-4 py-2.5">
                    <Icone nom="chevron" taille={11} className="shrink-0 text-givre-300/35" />
                    <Link
                      href={`/economie/ateliers/${ri.recipe.metier.key}`}
                      className="min-w-0 flex-1 truncate text-[0.8rem] text-givre-100 hover:text-or-300"
                    >
                      {ri.recipe.label}
                    </Link>
                    <span className="shrink-0 text-[0.72rem] tabular-nums text-givre-300/55">
                      ×{nombre(ri.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </Carte>
          )}

          {produitePar.length === 0 && utiliseeDans.length === 0 && (
            <Carte titre="Utilisation" icone="recette">
              <Vide
                titre="Matière isolée"
                icone="matiere"
                texte="Elle n'entre encore dans aucune recette. Les maîtres de métier peuvent en créer une depuis leur atelier."
              />
            </Carte>
          )}
        </div>
      </div>
    </>
  );
}
