import Link from "next/link";
import type { Metadata } from "next";
import { Badge, Carte, EnTetePage, LienBouton, Stat } from "@/components/ui/base";
import { Filtres } from "@/components/ui/Filtres";
import { Icone } from "@/components/ui/Icone";
import { Tableau } from "@/components/ui/Tableau";
import { ActionLigne } from "@/components/ui/form";
import { actionSupprimerMatiere } from "@/app/actions/economie";
import { exigerDroit, peut } from "@/lib/auth";
import { contient, prisma } from "@/lib/db";
import { coursDuMarche } from "@/lib/economie";
import { MATERIAL_CATEGORIES, MATERIAL_STATES, PERMISSIONS as P } from "@/lib/domain";
import { nombre, septims } from "@/lib/format";
import { FormulaireMatiere } from "./FormulaireMatiere";

export const metadata: Metadata = { title: "Matières" };
export const dynamic = "force-dynamic";

export default async function Matieres({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categorie?: string; etat?: string; edit?: string }>;
}) {
  const membre = await exigerDroit(P.MATERIAL_READ);
  const f = await searchParams;
  const gere = peut(membre, P.MATERIAL_MANAGE);

  const [matieres, cours, usages] = await Promise.all([
    prisma.material.findMany({
      where: {
        ...(f.q ? { OR: [{ label: contient(f.q) }, { subcategory: contient(f.q) }] } : {}),
        ...(f.categorie ? { category: f.categorie } : {}),
        ...(f.etat ? { state: f.etat } : {}),
      },
      orderBy: [{ category: "asc" }, { position: "asc" }, { label: "asc" }],
      include: {
        _count: { select: { usedIn: true, recipes: true, inventory: true, prices: true } },
      },
    }),
    coursDuMarche(),
    prisma.material.count(),
  ]);

  const enEdition = f.edit ? matieres.find((m) => m.id === f.edit) : undefined;
  const fabricables = matieres.filter((m) => m.isCraftable).length;
  const cotees = matieres.filter((m) => cours.has(m.id)).length;

  return (
    <>
      <EnTetePage
        surTitre="Référentiel"
        titre="Matières & objets"
        icone="matiere"
        texte="Le vocabulaire commun de l'économie de la Maison : ce que l'on extrait, transforme, stocke et vend. Stocks, recettes et cours du marché s'y rattachent tous."
        actions={
          gere && (
            <LienBouton href="/economie/matieres#saisie" variante="or" icone="plus">
              Nouvelle matière
            </LienBouton>
          )
        }
      />

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Matières au référentiel" valeur={nombre(usages)} icone="matiere" />
        <Stat label="Cotées au marché" valeur={`${cotees} / ${matieres.length}`} icone="marche" />
        <Stat label="Fabricables" valeur={fabricables} icone="atelier" tone="attente" />
        <Stat label="Catégories" valeur={MATERIAL_CATEGORIES.length} icone="stock" />
      </section>

      <Filtres
        action="/economie/matieres"
        valeurs={f}
        total={matieres.length}
        champs={[
          { type: "recherche", nom: "q", placeholder: "Nom ou sous-catégorie…" },
          {
            type: "select",
            nom: "categorie",
            label: "Catégorie",
            options: MATERIAL_CATEGORIES.map((c) => ({ value: c, label: c })),
          },
          {
            type: "select",
            nom: "etat",
            label: "Sous-état",
            options: Object.entries(MATERIAL_STATES).map(([value, label]) => ({ value, label })),
          },
        ]}
      />

      <Carte padding={false} className="mb-6">
        <Tableau
          donnees={matieres}
          cle={(m) => m.id}
          lien={(m) => `/economie/cours-du-marche/${m.key}`}
          vide="Aucune matière"
          videIcone="matiere"
          colonnes={[
            {
              cle: "label",
              entete: "Matière",
              principal: true,
              rendu: (m) => (
                <span className="flex items-center gap-2">
                  <span className="text-givre-50">{m.label}</span>
                  {m.isCraftable && <Icone nom="atelier" taille={11} className="text-or-400/60" />}
                </span>
              ),
            },
            {
              cle: "cat",
              entete: "Catégorie",
              rendu: (m) => (
                <span className="text-givre-300/70">
                  {m.category}
                  {m.subcategory && <span className="text-givre-300/45"> · {m.subcategory}</span>}
                </span>
              ),
            },
            {
              cle: "etat",
              entete: "Sous-état",
              masquerMobile: true,
              rendu: (m) => (
                <Badge tone={m.state === "lingot" || m.state === "raffine" ? "attente" : "neutre"}>
                  {MATERIAL_STATES[m.state] ?? m.state}
                </Badge>
              ),
            },
            { cle: "unit", entete: "Unité", masquerMobile: true, rendu: (m) => m.unit },
            {
              cle: "cours",
              entete: "Cours",
              numerique: true,
              rendu: (m) => {
                const c = cours.get(m.id);
                return c ? (
                  <span className="text-or-200">{septims(c.dernier)}</span>
                ) : (
                  <span className="text-givre-300/30">non coté</span>
                );
              },
            },
            {
              cle: "usage",
              entete: "Usages",
              masquerMobile: true,
              rendu: (m) => (
                <span className="text-[0.72rem] text-givre-300/60">
                  {m._count.recipes > 0 && `${m._count.recipes} recette(s) · `}
                  {m._count.usedIn > 0 && `${m._count.usedIn} usage(s) · `}
                  {m._count.inventory} stock
                </span>
              ),
            },
          ]}
          actions={
            gere
              ? (m) => (
                  <>
                    <Link
                      href={`/economie/matieres?edit=${m.id}#saisie`}
                      className="inline-flex items-center gap-1.5 rounded-[2px] border border-argent-500/25 px-2 py-1 text-[0.7rem] text-givre-200 transition-colors hover:bg-nuit-600/70"
                    >
                      <Icone nom="modifier" taille={12} />
                      Modifier
                    </Link>
                    {m._count.usedIn === 0 && m._count.inventory === 0 && (
                      <form action={actionSupprimerMatiere}>
                        <input type="hidden" name="id" value={m.id} />
                        <ActionLigne icone="supprimer" ton="danger">
                          <span className="sr-only">Supprimer</span>
                        </ActionLigne>
                      </form>
                    )}
                  </>
                )
              : undefined
          }
        />
      </Carte>

      {gere && (
        <Carte
          titre={enEdition ? `Modifier — ${enEdition.label}` : "Ajouter une matière"}
          sousTitre="Toute nouvelle matière devient immédiatement disponible dans les stocks, les recettes et le cours du marché."
          icone={enEdition ? "modifier" : "plus"}
          actions={
            enEdition && (
              <LienBouton href="/economie/matieres" variante="fantome" taille="sm" icone="refuser">
                Annuler
              </LienBouton>
            )
          }
        >
          <div id="saisie" className="scroll-mt-20">
            <FormulaireMatiere
              key={enEdition?.id ?? "nouveau"}
              id={enEdition?.id}
              valeurs={
                enEdition
                  ? {
                      label: enEdition.label,
                      key: enEdition.key,
                      category: enEdition.category,
                      subcategory: enEdition.subcategory,
                      state: enEdition.state,
                      unit: enEdition.unit,
                      description: enEdition.description,
                      isCraftable: String(enEdition.isCraftable),
                    }
                  : undefined
              }
            />
          </div>
        </Carte>
      )}
    </>
  );
}
