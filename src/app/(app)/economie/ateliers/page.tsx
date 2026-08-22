import Link from "next/link";
import type { Metadata } from "next";
import { Badge, Carte, EnTetePage, Stat, Vide } from "@/components/ui/base";
import { Icone, iconeMetier } from "@/components/ui/Icone";
import { exigerDroit } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { chiffrerRecette, contexteChiffrage } from "@/lib/economie";
import { PERMISSIONS as P } from "@/lib/domain";
import { septims } from "@/lib/format";

export const metadata: Metadata = { title: "Ateliers-métiers" };
export const dynamic = "force-dynamic";

export default async function Ateliers() {
  const membre = await exigerDroit(P.RECIPE_READ);

  const [metiers, ctx] = await Promise.all([
    prisma.metier.findMany({
      orderBy: [{ isProducer: "desc" }, { position: "asc" }],
      include: {
        recipes: {
          include: { outputMaterial: true, items: true },
          orderBy: { label: "asc" },
        },
        members: { include: { user: { select: { id: true, nomRp: true } } } },
        _count: { select: { craftOrders: true, inventory: true } },
      },
    }),
    contexteChiffrage(),
  ]);

  const producteurs = metiers.filter((m) => m.isProducer);
  const autres = metiers.filter((m) => !m.isProducer);
  const mesMetiers = new Set(membre.metiers.map((um) => um.metierId));
  const totalRecettes = metiers.reduce((s, m) => s + m.recipes.length, 0);

  return (
    <>
      <EnTetePage
        surTitre="Production"
        titre="Ateliers-métiers"
        icone="atelier"
        texte="Chaque métier producteur a son atelier : sa bibliothèque de recettes, ses chaînes de transformation et son calculateur de coût, chiffré au cours du marché du jour."
      />

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Ateliers" valeur={producteurs.length} icone="atelier" />
        <Stat label="Recettes" valeur={totalRecettes} icone="recette" />
        <Stat
          label="Chaînes de transformation"
          valeur={metiers.reduce((s, m) => s + m.recipes.filter((r) => r.isChain).length, 0)}
          icone="matiere"
        />
        <Stat label="Mes métiers" valeur={membre.metiers.length} icone="membres" tone="attente" />
      </section>

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {producteurs.map((m) => {
          const chiffrages = m.recipes
            .filter((r) => !r.isChain)
            .map((r) =>
              chiffrerRecette(
                {
                  id: r.id,
                  outputMaterialId: r.outputMaterialId,
                  outputQty: r.outputQty,
                  items: r.items.map((i) => ({ materialId: i.materialId, quantity: i.quantity })),
                },
                ctx,
              ),
            )
            .filter((c) => c.cout !== null);
          const coutMoyen =
            chiffrages.length > 0
              ? chiffrages.reduce((s, c) => s + (c.cout ?? 0), 0) / chiffrages.length
              : null;

          return (
            <Link
              key={m.id}
              href={`/economie/ateliers/${m.key}`}
              className="carte carte-texture group relative overflow-hidden p-5 transition-colors duration-150 hover:border-or-500/35"
            >
              {mesMetiers.has(m.id) && (
                <span className="absolute top-3 right-3">
                  <Badge tone="attente">mon métier</Badge>
                </span>
              )}
              <span className="grid size-11 place-items-center rounded-[2px] border border-or-500/25 bg-nuit-950/50 text-or-400">
                <Icone nom={iconeMetier(m.key, m.category)} taille={21} epaisseur={1.3} />
              </span>
              <h2 className="titre-imperial mt-3.5 text-[1.05rem] text-givre-50 transition-colors group-hover:text-or-200">
                {m.label}
              </h2>
              {m.station && <p className="mt-0.5 text-[0.72rem] text-or-400/70">{m.station}</p>}
              <p className="mt-2 text-[0.8rem] leading-relaxed text-givre-300/75">{m.description}</p>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-argent-500/12 pt-3 text-center">
                <div>
                  <p className="titre-imperial text-[0.95rem] text-givre-50">{m.recipes.length}</p>
                  <p className="text-[0.58rem] tracking-[0.14em] text-givre-300/45 uppercase">
                    recettes
                  </p>
                </div>
                <div>
                  <p className="titre-imperial text-[0.95rem] text-givre-50">{m.members.length}</p>
                  <p className="text-[0.58rem] tracking-[0.14em] text-givre-300/45 uppercase">
                    artisans
                  </p>
                </div>
                <div>
                  <p className="titre-imperial text-[0.95rem] text-or-200">
                    {coutMoyen === null ? "—" : septims(coutMoyen)}
                  </p>
                  <p className="text-[0.58rem] tracking-[0.14em] text-givre-300/45 uppercase">
                    coût moyen
                  </p>
                </div>
              </div>

              {m.members.length > 0 && (
                <p className="mt-3 truncate text-[0.7rem] text-givre-300/50">
                  {m.members.map((um) => um.user.nomRp).join(", ")}
                </p>
              )}
            </Link>
          );
        })}
      </div>

      <Carte
        titre="Métiers sans atelier"
        sousTitre="Extraction, récolte et services : ils alimentent les ateliers sans transformer eux-mêmes."
        icone="membres"
      >
        {autres.length === 0 ? (
          <Vide titre="Aucun" icone="membres" />
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {autres.map((m) => (
              <div
                key={m.id}
                title={m.description}
                className="flex items-center gap-2.5 rounded-[2px] border border-argent-500/15 bg-nuit-950/40 px-3 py-2.5"
              >
                <Icone
                  nom={iconeMetier(m.key, m.category)}
                  taille={16}
                  className="shrink-0 text-givre-300/70"
                />
                <span className="min-w-0">
                  <span className="block truncate text-[0.78rem] text-givre-100">{m.label}</span>
                  <span className="block truncate text-[0.62rem] text-givre-300/45">
                    {m.members.length} membre(s)
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </Carte>
    </>
  );
}
