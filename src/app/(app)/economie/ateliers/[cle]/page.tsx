import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Avatar,
  Badge,
  Carte,
  Definitions,
  EnTetePage,
  LienBouton,
  Message,
  Ornement,
  Stat,
  Vide,
} from "@/components/ui/base";
import { Icone, iconeMetier } from "@/components/ui/Icone";
import { ActionLigne } from "@/components/ui/form";
import { actionSupprimerRecette } from "@/app/actions/economie";
import { FormulaireRecette } from "@/components/economie/FormulaireRecette";
import { exigerDroit, peut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  chiffrerRecette,
  contexteChiffrage,
  coursDuMarche,
  fabricablesAvec,
  type LigneCout,
} from "@/lib/economie";
import { DEFAULT_MARGIN, METIER_NIVEAUX, PERMISSIONS as P } from "@/lib/domain";
import { nombre, pourcentage, septims } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cle: string }>;
}): Promise<Metadata> {
  const { cle } = await params;
  const m = await prisma.metier.findUnique({ where: { key: cle }, select: { label: true } });
  return { title: m ? `Atelier — ${m.label}` : "Atelier" };
}

const MARGES = [0, 0.2, 0.3, 0.4, 0.5, 0.75, 1];

/**
 * Rend un composant et, s'il est lui-même fabriqué, le détail de sa recette.
 * Les sous-lignes sont exprimées pour UNE unité du composant parent — c'est ce
 * qui permet de voir d'où vient le prix unitaire affiché juste au-dessus.
 */
function LigneComposant({
  l,
  profondeur = 0,
  parent,
}: {
  l: LigneCout;
  profondeur?: number;
  parent?: string;
}) {
  return (
    <>
      <tr className={profondeur > 0 ? "text-[0.78rem]" : ""}>
        <td style={{ paddingLeft: `${0.85 + profondeur * 1.1}rem` }}>
          <span className="flex flex-wrap items-center gap-1.5">
            {profondeur > 0 && (
              <Icone nom="chevron" taille={9} className="shrink-0 text-givre-300/30" />
            )}
            <span className={profondeur > 0 ? "text-givre-300/70" : "text-givre-100"}>{l.label}</span>
            {l.source === "fabrication" && profondeur === 0 && (
              <span
                title="Prix unitaire calculé depuis sa propre recette, et non depuis le marché"
                className="rounded-full border border-or-500/30 px-1.5 py-px text-[0.55rem] text-or-300/80"
              >
                fabriqué
              </span>
            )}
            {profondeur > 0 && parent && (
              <span className="text-[0.62rem] text-givre-300/35">pour 1 {parent}</span>
            )}
            {l.source === "inconnu" && (
              <span className="rounded-full border border-alerte/40 px-1.5 py-px text-[0.55rem] text-[#e5a877]">
                non coté
              </span>
            )}
          </span>
        </td>
        <td className="text-right tabular-nums">{nombre(l.quantite)}</td>
        <td className="text-right tabular-nums text-givre-300/70">
          {l.prixUnitaire === null ? "—" : septims(l.prixUnitaire)}
        </td>
        <td
          className={`text-right tabular-nums ${profondeur > 0 ? "text-givre-300/60" : "text-or-200"}`}
        >
          {l.cout === null ? "—" : septims(l.cout)}
        </td>
      </tr>
      {profondeur === 0 &&
        l.sous?.map((s, i) => (
          <LigneComposant key={i} l={s} profondeur={profondeur + 1} parent={l.label} />
        ))}
    </>
  );
}

export default async function Atelier({
  params,
  searchParams,
}: {
  params: Promise<{ cle: string }>;
  searchParams: Promise<{ marge?: string; edit?: string }>;
}) {
  const membre = await exigerDroit(P.RECIPE_READ);
  const { cle } = await params;
  const { marge: margeParam, edit } = await searchParams;

  const marge = margeParam !== undefined ? Math.max(0, Number(margeParam) || 0) : DEFAULT_MARGIN;

  const metier = await prisma.metier.findUnique({
    where: { key: cle },
    include: {
      members: { include: { user: { select: { id: true, nomRp: true, avatarUrl: true } } } },
    },
  });
  if (!metier) notFound();

  const [recettes, ctx, cours, tousMetiers, matieres, stockMaison, monStock] = await Promise.all([
    prisma.recipe.findMany({
      where: { metierId: metier.id },
      orderBy: [{ isChain: "desc" }, { label: "asc" }],
      include: {
        outputMaterial: true,
        items: { include: { material: true } },
        attachments: { select: { id: true, filename: true } },
        createdBy: { select: { nomRp: true } },
      },
    }),
    contexteChiffrage(),
    coursDuMarche(),
    prisma.metier.findMany({ orderBy: { position: "asc" }, select: { id: true, label: true } }),
    prisma.material.findMany({
      orderBy: [{ category: "asc" }, { position: "asc" }],
      select: { id: true, label: true, category: true, unit: true },
    }),
    prisma.inventoryItem.findMany({
      where: { ownerType: "maison" },
      select: { materialId: true, quantity: true },
    }),
    prisma.inventoryItem.findMany({
      where: { ownerType: "membre", ownerUserId: membre.id },
      select: { materialId: true, quantity: true },
    }),
  ]);

  const gere = peut(membre, P.RECIPE_MANAGE);
  const stockMaisonMap = new Map<string, number>();
  for (const l of stockMaison) if (l.materialId) stockMaisonMap.set(l.materialId, (stockMaisonMap.get(l.materialId) ?? 0) + l.quantity);
  const monStockMap = new Map<string, number>();
  for (const l of monStock) if (l.materialId) monStockMap.set(l.materialId, (monStockMap.get(l.materialId) ?? 0) + l.quantity);

  const calc = (r: (typeof recettes)[number]) =>
    chiffrerRecette(
      {
        id: r.id,
        outputMaterialId: r.outputMaterialId,
        outputQty: r.outputQty,
        items: r.items.map((i) => ({ materialId: i.materialId, quantity: i.quantity })),
      },
      ctx,
      marge,
    );

  const chaines = recettes.filter((r) => r.isChain);
  const produits = recettes.filter((r) => !r.isChain);
  const enEdition = edit ? recettes.find((r) => r.id === edit) : undefined;

  const prixSimple: Record<string, number> = {};
  for (const [id, c] of cours) prixSimple[id] = c.dernier;

  const chiffrages = produits.map(calc).filter((c) => c.cout !== null);
  const margeMoyenne =
    chiffrages.length > 0
      ? chiffrages.reduce((s, c) => s + ((c.prixConseille ?? 0) - (c.cout ?? 0)), 0) / chiffrages.length
      : null;

  return (
    <>
      <EnTetePage
        surTitre={`Atelier — ${metier.category === "transformation" ? "transformation" : metier.category}`}
        titre={metier.label}
        icone={iconeMetier(metier.key, metier.category)}
        texte={metier.description}
        actions={
          <>
            <LienBouton href="/economie/ateliers" variante="argent" icone="retour">
              Tous les ateliers
            </LienBouton>
            {gere && (
              <LienBouton href={`/economie/ateliers/${cle}#recette`} variante="or" icone="plus">
                Nouvelle recette
              </LienBouton>
            )}
          </>
        }
      />

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Recettes" valeur={produits.length} icone="recette" />
        <Stat label="Paliers de transformation" valeur={chaines.length} icone="matiere" />
        <Stat label="Artisans" valeur={metier.members.length} icone="membres" />
        <Stat
          label="Marge moyenne"
          valeur={margeMoyenne === null ? "—" : septims(margeMoyenne)}
          sousTexte={`au taux de ${pourcentage(marge * 100)}`}
          icone="septim"
          tone="attente"
        />
      </section>

      {/* ── Réglage de la marge ── */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-[2px] border border-argent-500/12 bg-nuit-900/40 px-4 py-3">
        <span className="flex items-center gap-2 text-[0.78rem] text-givre-200/85">
          <Icone nom="septim" taille={14} className="text-or-400" />
          Marge appliquée au prix conseillé
        </span>
        <div className="flex flex-wrap gap-1.5">
          {MARGES.map((m) => (
            <Link
              key={m}
              href={`/economie/ateliers/${cle}?marge=${m}`}
              className={`rounded-full border px-3 py-1 text-[0.72rem] tabular-nums transition-colors ${
                Math.abs(marge - m) < 0.001
                  ? "border-or-500/50 bg-or-500/14 text-or-200"
                  : "border-argent-500/20 text-givre-300/70 hover:border-or-500/30"
              }`}
            >
              +{Math.round(m * 100)} %
            </Link>
          ))}
        </div>
        <span className="ml-auto text-[0.7rem] text-givre-300/45">
          Prix conseillé = coût de revient × (1 + marge)
        </span>
      </div>

      {/* ── Artisans ── */}
      {metier.members.length > 0 && (
        <Carte titre="Les artisans de cet atelier" icone="membres" className="mb-6">
          <div className="flex flex-wrap gap-2.5">
            {metier.members.map((um) => (
              <Link
                key={um.id}
                href={`/membres/${um.user.id}`}
                className="flex items-center gap-2.5 rounded-[2px] border border-argent-500/18 bg-nuit-950/40 px-3 py-2 transition-colors hover:border-or-500/35"
              >
                <Avatar nom={um.user.nomRp} url={um.user.avatarUrl} taille={28} />
                <span>
                  <span className="block text-[0.8rem] text-givre-50">{um.user.nomRp}</span>
                  <span className="block text-[0.64rem] text-givre-300/55">
                    {METIER_NIVEAUX.find((n) => n.value === um.niveau)?.label ?? um.niveau}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </Carte>
      )}

      {/* ── Chaînes de transformation ── */}
      {chaines.length > 0 && (
        <Carte
          titre="Chaînes de transformation"
          sousTitre="Les paliers matière → matière. Ils permettent au calcul de coût de remonter jusqu'à la matière brute."
          icone="matiere"
          padding={false}
          className="mb-6"
        >
          <ul className="divide-y divide-argent-500/10">
            {chaines.map((r) => {
              const ch = calc(r);
              const coursSortie = cours.get(r.outputMaterialId)?.dernier ?? null;
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                  <span className="min-w-[200px] flex-1">
                    <span className="flex flex-wrap items-center gap-1.5 text-[0.84rem]">
                      <span className="text-givre-200/80">
                        {r.items.map((i) => `${nombre(i.quantity)} × ${i.material.label}`).join(" + ")}
                      </span>
                      <Icone nom="chevron" taille={12} className="text-or-400/60" />
                      <Link
                        href={`/economie/cours-du-marche/${r.outputMaterial.key}`}
                        className="text-givre-50 hover:text-or-300"
                      >
                        {r.outputQty > 1 && `${r.outputQty} × `}
                        {r.outputMaterial.label}
                      </Link>
                    </span>
                    <span className="mt-0.5 block text-[0.68rem] text-givre-300/45">
                      {r.station || metier.station}
                      {r.notes && ` · ${r.notes}`}
                    </span>
                  </span>

                  <span className="w-32 shrink-0 text-right">
                    <span className="block text-[0.8rem] tabular-nums text-or-200">
                      {ch.cout === null ? "—" : septims(ch.cout)}
                    </span>
                    <span className="block text-[0.62rem] text-givre-300/45">coût / unité</span>
                  </span>

                  <span className="w-32 shrink-0 text-right">
                    <span className="block text-[0.8rem] tabular-nums text-givre-200/80">
                      {coursSortie === null ? "—" : septims(coursSortie)}
                    </span>
                    <span className="block text-[0.62rem] text-givre-300/45">cours du marché</span>
                  </span>

                  {ch.cout !== null && coursSortie !== null && (
                    <Badge tone={ch.cout < coursSortie ? "succes" : "danger"}>
                      {ch.cout < coursSortie ? "rentable" : "déficitaire"}
                    </Badge>
                  )}

                  {gere && (
                    <span className="flex shrink-0 gap-1.5">
                      <Link
                        href={`/economie/ateliers/${cle}?edit=${r.id}#recette`}
                        className="inline-flex items-center rounded-[2px] border border-argent-500/25 px-2 py-1 text-[0.7rem] text-givre-200 hover:bg-nuit-600/70"
                      >
                        <Icone nom="modifier" taille={12} />
                      </Link>
                      <form action={actionSupprimerRecette}>
                        <input type="hidden" name="id" value={r.id} />
                        <ActionLigne icone="supprimer" ton="danger">
                          <span className="sr-only">Supprimer</span>
                        </ActionLigne>
                      </form>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </Carte>
      )}

      {/* ── Bibliothèque de recettes ── */}
      <div className="mb-6 flex items-center gap-3">
        <h2 className="titre-imperial text-[0.95rem] tracking-[0.1em] text-or-300">
          Bibliothèque de recettes
        </h2>
        <span className="filet flex-1" />
        <span className="text-[0.7rem] text-givre-300/45">{produits.length} objet(s) fabricable(s)</span>
      </div>

      {produits.length === 0 ? (
        <Carte padding={false} className="mb-6">
          <Vide
            titre="Aucune recette"
            icone="recette"
            texte={
              gere
                ? "Ajoutez la première nomenclature de cet atelier avec le formulaire ci-dessous."
                : "Les maîtres de ce métier n'ont pas encore consigné de recette."
            }
          />
        </Carte>
      ) : (
        <div className="mb-8 grid gap-4 xl:grid-cols-2">
          {produits.map((r) => {
            const ch = calc(r);
            const coursSortie = cours.get(r.outputMaterialId)?.dernier ?? null;
            const recetteCalc = {
              id: r.id,
              outputMaterialId: r.outputMaterialId,
              outputQty: r.outputQty,
              items: r.items.map((i) => ({ materialId: i.materialId, quantity: i.quantity })),
            };
            const faisableMaison = fabricablesAvec(recetteCalc, stockMaisonMap);
            const faisableMoi = fabricablesAvec(recetteCalc, monStockMap);
            const limitant = faisableMaison.limitant
              ? ctx.labels.get(faisableMaison.limitant)
              : null;

            return (
              <Carte
                key={r.id}
                titre={r.label}
                sousTitre={`${r.station || metier.station}${r.outputQty > 1 ? ` · produit ${r.outputQty} unités` : ""}`}
                icone="recette"
                padding={false}
                actions={
                  gere && (
                    <>
                      <Link
                        href={`/economie/ateliers/${cle}?edit=${r.id}#recette`}
                        className="inline-flex items-center gap-1.5 rounded-[2px] border border-argent-500/25 px-2 py-1 text-[0.7rem] text-givre-200 hover:bg-nuit-600/70"
                      >
                        <Icone nom="modifier" taille={12} />
                        Modifier
                      </Link>
                      <form action={actionSupprimerRecette}>
                        <input type="hidden" name="id" value={r.id} />
                        <ActionLigne icone="supprimer" ton="danger">
                          <span className="sr-only">Supprimer</span>
                        </ActionLigne>
                      </form>
                    </>
                  )
                }
              >
                {/* Nomenclature */}
                <div className="overflow-x-auto">
                  <table className="tableau">
                    <thead>
                      <tr>
                        <th>Composant</th>
                        <th className="!text-right">Qté</th>
                        <th className="!text-right">Prix unitaire</th>
                        <th className="!text-right">Coût</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ch.lignes.map((l, i) => (
                        <LigneComposant key={i} l={l} />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Chiffrage */}
                <div className="border-t border-or-600/25 bg-nuit-950/40 px-4 py-4">
                  <div className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4">
                    <div>
                      <p className="text-[0.58rem] tracking-[0.16em] text-givre-300/45 uppercase">
                        Coût au marché
                      </p>
                      <p className="mt-0.5 text-[0.95rem] tabular-nums text-givre-100">
                        {ch.coutMarche === null ? "—" : septims(ch.coutMarche)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.58rem] tracking-[0.16em] text-givre-300/45 uppercase">
                        Coût chaîne complète
                      </p>
                      <p className="mt-0.5 text-[0.95rem] tabular-nums text-givre-100">
                        {ch.coutChaine === null ? "—" : septims(ch.coutChaine)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.58rem] tracking-[0.16em] text-or-400/70 uppercase">
                        Prix conseillé
                      </p>
                      <p className="titre-imperial mt-0.5 text-[1.05rem] tabular-nums text-or-200">
                        {ch.prixConseille === null ? "—" : septims(ch.prixConseille)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.58rem] tracking-[0.16em] text-givre-300/45 uppercase">
                        Marge
                      </p>
                      <p className="mt-0.5 text-[0.95rem] tabular-nums text-[#8fd0a3]">
                        {ch.prixConseille === null || ch.cout === null
                          ? "—"
                          : `+${septims(ch.prixConseille - ch.cout)}`}
                      </p>
                    </div>
                  </div>

                  {ch.manquantes.length > 0 && (
                    <p className="mt-3 flex items-start gap-1.5 text-[0.7rem] text-[#e5a877]">
                      <Icone nom="alerte" taille={12} className="mt-0.5" />
                      Chiffrage partiel : aucun cours pour {ch.manquantes.join(", ")}.{" "}
                      <Link href="/economie/cours-du-marche" className="underline underline-offset-2">
                        Relever un prix
                      </Link>
                    </p>
                  )}

                  {coursSortie !== null && ch.cout !== null && (
                    <p className="mt-2.5 text-[0.74rem] text-givre-300/70">
                      Le marché paie{" "}
                      <span className="text-givre-100">{septims(coursSortie)}</span> pour{" "}
                      {r.outputMaterial.label} — soit{" "}
                      <span className={coursSortie > ch.cout ? "text-[#8fd0a3]" : "text-[#e69a8c]"}>
                        {coursSortie > ch.cout ? "+" : ""}
                        {septims(coursSortie - ch.cout)}
                      </span>{" "}
                      par pièce en le vendant au cours.
                    </p>
                  )}
                </div>

                {/* Faisabilité */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-argent-500/12 px-4 py-3 text-[0.75rem]">
                  <span className="flex items-center gap-1.5 text-givre-300/70">
                    <Icone nom="stock" taille={13} className="text-or-400/70" />
                    Stock commun :{" "}
                    <span
                      className={
                        faisableMaison.possible > 0 ? "text-[#8fd0a3]" : "text-givre-300/45"
                      }
                    >
                      {faisableMaison.possible} fabricable(s)
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5 text-givre-300/70">
                    <Icone nom="stash" taille={13} className="text-or-400/70" />
                    Mon stash :{" "}
                    <span className={faisableMoi.possible > 0 ? "text-[#8fd0a3]" : "text-givre-300/45"}>
                      {faisableMoi.possible}
                    </span>
                  </span>
                  {faisableMaison.possible === 0 && limitant && (
                    <span className="text-[#e5a877]">manque : {limitant}</span>
                  )}
                  <Link
                    href={`/economie/commandes?recette=${r.id}`}
                    className="ml-auto inline-flex items-center gap-1.5 text-or-300 transition-colors hover:text-or-200"
                  >
                    <Icone nom="commande" taille={12} />
                    Ouvrir une commande
                  </Link>
                </div>

                {(r.description || r.notes || r.attachments.length > 0) && (
                  <div className="border-t border-argent-500/12 px-4 py-3">
                    {r.description && (
                      <p className="text-[0.78rem] text-givre-200/75">{r.description}</p>
                    )}
                    {r.notes && (
                      <p className="mt-1 text-[0.72rem] text-givre-300/55 italic">{r.notes}</p>
                    )}
                    {r.attachments.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {r.attachments.map((a) => (
                          <a
                            key={a.id}
                            href={`/api/fichiers/${a.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="block size-16 overflow-hidden rounded-[2px] border border-argent-500/20 transition-colors hover:border-or-500/45"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`/api/fichiers/${a.id}`}
                              alt={a.filename}
                              className="size-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Carte>
            );
          })}
        </div>
      )}

      {/* ── Éditeur de recette ── */}
      {gere ? (
        <Carte
          titre={enEdition ? `Modifier — ${enEdition.label}` : "Nouvelle recette"}
          sousTitre="La nomenclature détermine le coût de fabrication et le prix conseillé."
          icone={enEdition ? "modifier" : "plus"}
          actions={
            enEdition && (
              <LienBouton
                href={`/economie/ateliers/${cle}`}
                variante="fantome"
                taille="sm"
                icone="refuser"
              >
                Annuler
              </LienBouton>
            )
          }
        >
          <div id="recette" className="scroll-mt-20">
            <FormulaireRecette
              key={enEdition?.id ?? "nouvelle"}
              metierId={metier.id}
              metiers={tousMetiers.map((m) => ({ value: m.id, label: m.label }))}
              matieres={matieres.map((m) => ({
                value: m.id,
                label: `${m.label} (${m.unit})`,
                group: m.category,
              }))}
              prix={prixSimple}
              id={enEdition?.id}
              composantsInitiaux={enEdition?.items.map((i) => ({
                materialId: i.materialId,
                quantity: i.quantity,
              }))}
              valeurs={
                enEdition
                  ? {
                      label: enEdition.label,
                      metierId: enEdition.metierId,
                      outputMaterialId: enEdition.outputMaterialId,
                      outputQty: String(enEdition.outputQty),
                      station: enEdition.station,
                      isChain: String(enEdition.isChain),
                      description: enEdition.description,
                      notes: enEdition.notes,
                    }
                  : undefined
              }
            />
          </div>
        </Carte>
      ) : (
        <Message tone="neutre" titre="Lecture seule" icone="recette">
          Seuls les maîtres de ce métier, l'Intendant et les gradés peuvent éditer les recettes.
        </Message>
      )}

      <Ornement className="my-8" />

      <Carte titre="Comment le coût est calculé" icone="matiere">
        <Definitions
          colonnes={1}
          items={[
            [
              "Coût au marché",
              "Somme des composants directs au dernier cours relevé. C'est ce que coûterait d'acheter les composants tels quels.",
            ],
            [
              "Coût chaîne complète",
              "Chaque composant fabricable est remplacé par le coût de sa propre recette, palier par palier, jusqu'à la matière brute. Le minerai remonte jusqu'au lingot, la peau jusqu'aux lanières.",
            ],
            [
              "Prix conseillé",
              "Coût de revient retenu × (1 + marge). La marge se règle en haut de page ; elle n'est qu'une suggestion, le prix final se négocie.",
            ],
            [
              "Chiffrage partiel",
              "Si une matière n'a aucun relevé de prix, le calcul le signale plutôt que de l'ignorer. Relevez son cours pour compléter.",
            ],
          ]}
        />
      </Carte>
    </>
  );
}
