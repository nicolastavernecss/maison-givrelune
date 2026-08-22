import Link from "next/link";
import type { Metadata } from "next";
import { Badge, Carte, EnTetePage, Stat } from "@/components/ui/base";
import { Filtres } from "@/components/ui/Filtres";
import { Icone } from "@/components/ui/Icone";
import { MiniCourbe } from "@/components/ui/Courbe";
import { Tableau } from "@/components/ui/Tableau";
import { exigerDroit, peut } from "@/lib/auth";
import { contient, prisma } from "@/lib/db";
import { coursDuMarche } from "@/lib/economie";
import { MATERIAL_CATEGORIES, PERMISSIONS as P } from "@/lib/domain";
import { date, nombre, relatif, septims, variation } from "@/lib/format";
import { FormulaireReleve } from "./FormulaireReleve";

export const metadata: Metadata = { title: "Cours du marché" };
export const dynamic = "force-dynamic";

export default async function CoursDuMarche({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categorie?: string; suivi?: string }>;
}) {
  const membre = await exigerDroit(P.MARKET_READ);
  const f = await searchParams;

  const [matieres, cours, nbReleves, dernierReleve] = await Promise.all([
    prisma.material.findMany({
      where: {
        ...(f.q ? { label: contient(f.q) } : {}),
        ...(f.categorie ? { category: f.categorie } : {}),
      },
      orderBy: [{ category: "asc" }, { position: "asc" }],
    }),
    coursDuMarche(),
    prisma.marketPrice.count(),
    prisma.marketPrice.findFirst({
      orderBy: { createdAt: "desc" },
      include: { material: { select: { label: true } }, member: { select: { nomRp: true } } },
    }),
  ]);

  const lignes = matieres
    .map((m) => ({ matiere: m, c: cours.get(m.id) ?? null }))
    .filter((l) => (f.suivi === "oui" ? l.c !== null : f.suivi === "non" ? l.c === null : true));

  const suivies = [...cours.keys()].length;
  const hausses = lignes.filter(
    (l) => l.c?.precedent != null && l.c.dernier > l.c.precedent,
  ).length;
  const baisses = lignes.filter(
    (l) => l.c?.precedent != null && l.c.dernier < l.c.precedent,
  ).length;

  return (
    <>
      <EnTetePage
        surTitre="Économie de la Maison"
        titre="Cours du marché"
        icone="marche"
        texte="Sur Keizaal, les prix sont faits par les joueurs. Chaque membre relève ce qu'il constate : le site en tire une courbe, une moyenne et des extrêmes qui servent ensuite à valoriser les stocks et à chiffrer les fabrications."
      />

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Matières suivies" valeur={`${suivies} / ${matieres.length}`} icone="matiere" />
        <Stat label="Relevés consignés" valeur={nombre(nbReleves)} icone="registre" />
        <Stat label="En hausse" valeur={hausses} icone="marche" tone="succes" />
        <Stat label="En baisse" valeur={baisses} icone="marche" tone="danger" />
      </section>

      {dernierReleve && (
        <p className="mb-4 text-[0.75rem] text-givre-300/50">
          Dernier relevé : <span className="text-givre-200">{dernierReleve.material.label}</span> à{" "}
          <span className="text-or-300">{septims(dernierReleve.price)}</span> par{" "}
          {dernierReleve.member?.nomRp ?? "un membre"}, {relatif(dernierReleve.createdAt)}.
        </p>
      )}

      <Filtres
        action="/economie/cours-du-marche"
        valeurs={f}
        total={lignes.length}
        champs={[
          { type: "recherche", nom: "q", placeholder: "Nom de matière…" },
          {
            type: "select",
            nom: "categorie",
            label: "Catégorie",
            options: MATERIAL_CATEGORIES.map((c) => ({ value: c, label: c })),
          },
          {
            type: "select",
            nom: "suivi",
            label: "Suivi",
            options: [
              { value: "oui", label: "Avec relevés" },
              { value: "non", label: "Sans relevé" },
            ],
          },
        ]}
      />

      <Carte padding={false} className="mb-6">
        <Tableau
          donnees={lignes}
          cle={(l) => l.matiere.id}
          lien={(l) => `/economie/cours-du-marche/${l.matiere.key}`}
          vide="Aucune matière"
          videIcone="marche"
          colonnes={[
            {
              cle: "matiere",
              entete: "Matière",
              principal: true,
              rendu: (l) => (
                <span className="flex items-center gap-2">
                  <span className="text-givre-50">{l.matiere.label}</span>
                  {l.matiere.isCraftable && (
                    <Icone nom="atelier" taille={11} className="text-or-400/60" />
                  )}
                </span>
              ),
            },
            {
              cle: "cat",
              entete: "Catégorie",
              masquerMobile: true,
              rendu: (l) => <span className="text-givre-300/70">{l.matiere.category}</span>,
            },
            {
              cle: "dernier",
              entete: "Dernier cours",
              numerique: true,
              rendu: (l) =>
                l.c ? (
                  <span className="text-or-200">{septims(l.c.dernier)}</span>
                ) : (
                  <span className="text-givre-300/30">non coté</span>
                ),
            },
            {
              cle: "var",
              entete: "Variation",
              numerique: true,
              rendu: (l) => {
                if (!l.c || l.c.precedent == null) return <span className="text-givre-300/30">—</span>;
                const v = variation(l.c.dernier, l.c.precedent);
                if (v === null) return <span className="text-givre-300/30">—</span>;
                const hausse = v > 0;
                const stable = Math.abs(v) < 0.05;
                return (
                  <span
                    className={
                      stable ? "text-givre-300/50" : hausse ? "text-[#8fd0a3]" : "text-[#e69a8c]"
                    }
                  >
                    {stable ? "=" : hausse ? "▲" : "▼"} {Math.abs(v).toFixed(1).replace(".", ",")} %
                  </span>
                );
              },
            },
            {
              cle: "moy",
              entete: "Moyenne",
              numerique: true,
              masquerMobile: true,
              rendu: (l) => (l.c ? septims(l.c.moyenne) : "—"),
            },
            {
              cle: "extremes",
              entete: "Min / Max",
              masquerMobile: true,
              rendu: (l) =>
                l.c ? (
                  <span className="text-[0.78rem] tabular-nums text-givre-300/70">
                    {nombre(l.c.min)} / {nombre(l.c.max)}
                  </span>
                ) : (
                  "—"
                ),
            },
            {
              cle: "courbe",
              entete: "Tendance",
              masquerMobile: true,
              rendu: (l) =>
                l.c && l.c.historique.length > 1 ? (
                  <MiniCourbe points={l.c.historique.slice(-12).map((h) => h.v)} />
                ) : (
                  <span className="text-givre-300/30">—</span>
                ),
            },
            {
              cle: "maj",
              entete: "Relevé",
              masquerMobile: true,
              rendu: (l) =>
                l.c ? (
                  <span className="text-[0.74rem] text-givre-300/55" title={date(l.c.date)}>
                    {relatif(l.c.date)} · {l.c.nb}×
                  </span>
                ) : (
                  "—"
                ),
            },
          ]}
        />
      </Carte>

      {peut(membre, P.MARKET_CREATE) && (
        <Carte
          titre="Relever un cours"
          sousTitre="Ce que vous avez vu se vendre ou s'acheter. Chaque relevé enrichit la courbe."
          icone="plus"
        >
          <FormulaireReleve
            matieres={matieres.map((m) => ({ value: m.id, label: m.label, group: m.category }))}
          />
        </Carte>
      )}

      <p className="mt-6 flex items-center gap-2 text-[0.72rem] text-givre-300/45">
        <Icone nom="matiere" taille={13} />
        Le cours sert de prix de référence pour la valorisation des stocks et le calcul des coûts de
        fabrication dans les{" "}
        <Link href="/economie/ateliers" className="text-or-300 hover:underline">
          ateliers-métiers
        </Link>
        .
      </p>
    </>
  );
}
