import Link from "next/link";
import type { Metadata } from "next";
import { Badge, Carte, EnTetePage, LienBouton, Message, Stat, Vide } from "@/components/ui/base";
import { Filtres } from "@/components/ui/Filtres";
import { Icone, iconeMetier } from "@/components/ui/Icone";
import { FormulaireFabriquer } from "@/components/economie/FormulaireFabriquer";
import { VuePrix } from "@/components/economie/craft/VuePrix";
import { VueRevenus } from "@/components/economie/craft/VueRevenus";
import { exigerDroit, peut } from "@/lib/auth";
import { contient, prisma } from "@/lib/db";
import { chiffrerRecette, coursDuMarche } from "@/lib/economie";
import { contexteMetier, calculerRevenu, assurerRapports } from "@/lib/production";
import { PERMISSIONS as P, TAUX_TAXE } from "@/lib/domain";
import { nombre, septims } from "@/lib/format";

export const metadata: Metadata = { title: "Craft" };
export const dynamic = "force-dynamic";

/** Les trois disciplines de fabrication de Skyrim d'abord, puis les métiers de la Maison. */
const ORDRE = ["forgeron", "alchimiste", "enchanteur", "couturier", "bijoutier", "cuisinier", "chasseur", "bucheron"];

const VUES = [
  { cle: "fabriquer", label: "Fabriquer", icone: "atelier" },
  { cle: "prix", label: "Prix des matières", icone: "septim" },
  { cle: "revenus", label: "Revenus", icone: "commerce" },
];

export default async function Craft({
  searchParams,
}: {
  searchParams: Promise<{
    metier?: string;
    source?: string;
    q?: string;
    cat?: string;
    vue?: string;
    periode?: string;
  }>;
}) {
  const membre = await exigerDroit(P.RECIPE_READ);
  const f = await searchParams;

  const metiers = await prisma.metier.findMany({
    where: { isProducer: true },
    include: { _count: { select: { recipes: true } } },
  });
  const rang = (cle: string) => {
    const i = ORDRE.indexOf(cle);
    return i === -1 ? 999 : i;
  };
  const onglets = [...metiers].sort(
    (a, b) => rang(a.key) - rang(b.key) || a.label.localeCompare(b.label),
  );

  const metierActif = onglets.find((m) => m.key === f.metier) ?? onglets[0];
  if (!metierActif) {
    return (
      <>
        <EnTetePage surTitre="Production" titre="Craft" icone="atelier" />
        <Carte padding={false}>
          <Vide titre="Aucun atelier" icone="atelier" />
        </Carte>
      </>
    );
  }

  const vue = VUES.find((v) => v.cle === f.vue)?.cle ?? "fabriquer";
  const sourceMaison = f.source !== "perso";
  const source: "maison" | "membre" = sourceMaison ? "maison" : "membre";

  const duMetier = membre.metiers.some((um) => um.metierId === metierActif.id);
  const voitTout = peut(membre, P.TREASURY_READ, P.ADMIN_MEMBERS);
  const editePrix =
    duMetier || peut(membre, P.MATERIAL_MANAGE, P.RECIPE_MANAGE, P.INVENTORY_HOUSE_MANAGE);

  const lien = (p: Record<string, string | undefined>) => {
    const u = new URLSearchParams();
    const v = {
      metier: metierActif.key,
      vue: f.vue,
      source: f.source,
      q: f.q,
      cat: f.cat,
      periode: f.periode,
      ...p,
    };
    for (const [k, val] of Object.entries(v)) if (val) u.set(k, val);
    return `/economie/craft?${u.toString()}`;
  };

  // Les comptes rendus des jours et semaines écoulés se figent à la consultation.
  if (vue === "revenus") await assurerRapports().catch(() => {});

  const enTete = (
    <>
      <EnTetePage
        surTitre="Ateliers de la Maison"
        titre="Craft"
        icone="atelier"
        texte="Un atelier par métier. On saisit ce qu'on paie ses matières, on fabrique, et le revenu se compte tout seul — brut, taxe de la Maison, net."
        actions={
          <>
            <LienBouton href="/economie/ateliers" variante="argent" icone="recette">
              Recettes & coûts
            </LienBouton>
            <LienBouton href="/gouvernance/archives#rapports" variante="argent" icone="archive">
              Comptes rendus
            </LienBouton>
          </>
        }
      />

      {/* ── Onglets par métier ── */}
      <div className="mb-4 flex flex-wrap gap-2">
        {onglets.map((m) => {
          const actif = m.key === metierActif.key;
          const mien = membre.metiers.some((um) => um.metierId === m.id);
          return (
            <Link
              key={m.id}
              href={`/economie/craft?metier=${m.key}${f.vue ? `&vue=${f.vue}` : ""}`}
              className={`inline-flex items-center gap-2 rounded-[2px] border px-3.5 py-2 text-[0.84rem] transition-colors ${
                actif
                  ? "border-or-500/50 bg-or-500/12 text-or-200"
                  : "border-argent-500/18 text-givre-300/70 hover:border-or-500/30 hover:text-givre-100"
              }`}
            >
              <Icone nom={iconeMetier(m.key, m.category)} taille={16} />
              {m.label}
              {mien && <span className="size-1.5 rounded-full bg-or-400" title="Votre métier" />}
              <span className={`text-[0.68rem] ${actif ? "text-or-300/70" : "text-givre-300/40"}`}>
                {m._count.recipes}
              </span>
            </Link>
          );
        })}
      </div>

      {/* ── Sous-onglets de l'atelier ── */}
      <div className="mb-5 flex flex-wrap gap-1 border-b border-argent-500/12 pb-2">
        {VUES.map((v) => (
          <Link
            key={v.cle}
            href={lien({ vue: v.cle === "fabriquer" ? undefined : v.cle })}
            className={`inline-flex items-center gap-1.5 rounded-t-[2px] border-b-2 px-3.5 py-2 text-[0.82rem] transition-colors ${
              vue === v.cle
                ? "border-or-400 text-or-200"
                : "border-transparent text-givre-300/65 hover:text-givre-100"
            }`}
          >
            <Icone nom={v.icone} taille={14} />
            {v.label}
          </Link>
        ))}
      </div>
    </>
  );

  /* ══════════ Vue : prix des matières ══════════ */
  if (vue === "prix") {
    return (
      <>
        {enTete}
        <VuePrix metier={metierActif} peutEditer={editePrix} />
      </>
    );
  }

  /* ══════════ Vue : revenus ══════════ */
  if (vue === "revenus") {
    return (
      <>
        {enTete}
        <VueRevenus
          metier={metierActif}
          membreId={membre.id}
          voitTout={voitTout}
          periode={f.periode ?? "semaine"}
          lien={lien}
        />
      </>
    );
  }

  /* ══════════ Vue : fabriquer ══════════ */
  const [recettes, ctx, cours, stock] = await Promise.all([
    prisma.recipe.findMany({
      where: {
        metierId: metierActif.id,
        ...(f.q ? { label: contient(f.q) } : {}),
        ...(f.cat ? { outputMaterial: { subcategory: f.cat } } : {}),
      },
      include: { outputMaterial: true, items: { include: { material: true } } },
      orderBy: [{ isChain: "desc" }, { label: "asc" }],
    }),
    contexteMetier(metierActif.id),
    coursDuMarche(),
    prisma.inventoryItem.findMany({
      where: sourceMaison
        ? { ownerType: "maison" }
        : { ownerType: "membre", ownerUserId: membre.id },
      select: { materialId: true, quantity: true, unitValue: true },
    }),
  ]);

  const dispo = new Map<string, number>();
  for (const l of stock) {
    if (l.materialId) dispo.set(l.materialId, (dispo.get(l.materialId) ?? 0) + l.quantity);
  }

  const peutFabriquer =
    source === "maison" ? peut(membre, P.INVENTORY_HOUSE_MANAGE) : peut(membre, P.INVENTORY_OWN);

  const foisPossibles = (items: { materialId: string; quantity: number }[]) => {
    let n = Infinity;
    for (const it of items) {
      if (it.quantity <= 0) continue;
      n = Math.min(n, Math.floor((dispo.get(it.materialId) ?? 0) / it.quantity));
    }
    return n === Infinity ? 0 : n;
  };

  const categories = [...new Set(recettes.map((r) => r.outputMaterial.subcategory).filter(Boolean))];
  const realisables = recettes.filter((r) => foisPossibles(r.items) > 0).length;
  const valeurStock = stock.reduce((s, l) => {
    const pu = l.unitValue ?? (l.materialId ? cours.get(l.materialId)?.dernier : undefined) ?? 0;
    return s + l.quantity * pu;
  }, 0);

  return (
    <>
      {enTete}

      {/* ── Choix du stock source ── */}
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-[2px] border border-argent-500/12 bg-nuit-900/40 px-4 py-3">
        <span className="text-[0.78rem] text-givre-200/85">Puiser dans</span>
        <div className="flex gap-1.5">
          <Link
            href={lien({ source: undefined })}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.74rem] transition-colors ${
              sourceMaison
                ? "border-or-500/50 bg-or-500/12 text-or-200"
                : "border-argent-500/20 text-givre-300/70 hover:border-or-500/30"
            }`}
          >
            <Icone nom="stock" taille={12} />
            Stock commun
          </Link>
          <Link
            href={lien({ source: "perso" })}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.74rem] transition-colors ${
              !sourceMaison
                ? "border-or-500/50 bg-or-500/12 text-or-200"
                : "border-argent-500/20 text-givre-300/70 hover:border-or-500/30"
            }`}
          >
            <Icone nom="stash" taille={12} />
            Mon stash
          </Link>
        </div>
        <span className="ml-auto text-[0.72rem] text-givre-300/50">
          {dispo.size} matière(s) en stock · valeur {septims(valeurStock)}
        </span>
      </div>

      {!peutFabriquer && (
        <div className="mb-5">
          <Message tone="alerte" titre="Lecture seule">
            {sourceMaison
              ? "Puiser dans le stock commun est réservé à l'Intendant et aux gradés. Basculez sur votre stash pour fabriquer."
              : "Vous ne tenez pas de stash personnel."}
          </Message>
        </div>
      )}

      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Recettes de l'atelier" valeur={recettes.length} icone="recette" />
        <Stat
          label="Réalisables maintenant"
          valeur={realisables}
          sousTexte={`avec ${sourceMaison ? "le stock commun" : "votre stash"}`}
          icone="valider"
          tone={realisables ? "succes" : "neutre"}
        />
        <Stat label="Poste de travail" valeur={metierActif.station || "—"} icone="atelier" />
        <Stat
          label="Taxe de la Maison"
          valeur={`${Math.round(TAUX_TAXE * 100)} %`}
          sousTexte="prélevée sur chaque fabrication"
          icone="septim"
          tone="attente"
        />
      </section>

      <Filtres
        action="/economie/craft"
        valeurs={f}
        total={recettes.length}
        champs={[
          { type: "recherche", nom: "q", placeholder: "Nom de la recette…" },
          {
            type: "select",
            nom: "cat",
            label: "Catégorie",
            options: categories.map((c) => ({ value: c, label: c })),
          },
        ]}
      >
        <input type="hidden" name="metier" value={metierActif.key} />
        {f.source && <input type="hidden" name="source" value={f.source} />}
      </Filtres>

      {recettes.length === 0 ? (
        <Carte padding={false}>
          <Vide
            titre="Aucune recette"
            icone="recette"
            texte="Cet atelier n'a pas encore de nomenclature, ou aucune ne correspond au filtre."
            action={
              <LienBouton
                href={`/economie/ateliers/${metierActif.key}`}
                variante="argent"
                icone="plus"
              >
                Ouvrir l'atelier
              </LienBouton>
            }
          />
        </Carte>
      ) : (
        <Carte padding={false}>
          <ul className="divide-y divide-argent-500/10">
            {recettes.map((r) => {
              const ch = chiffrerRecette(
                {
                  id: r.id,
                  outputMaterialId: r.outputMaterialId,
                  outputQty: r.outputQty,
                  items: r.items.map((i) => ({ materialId: i.materialId, quantity: i.quantity })),
                },
                ctx,
              );
              const fois = foisPossibles(r.items);
              const prixUnitaire = cours.get(r.outputMaterialId)?.dernier ?? 0;
              const revenu = calculerRevenu(r.outputQty, prixUnitaire);
              const benefice = ch.cout === null ? null : Math.round(revenu.net - ch.cout);

              return (
                <li key={r.id} className="px-4 py-3.5">
                  <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
                    {/* Identité */}
                    <div className="min-w-[240px] flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[0.9rem] text-givre-50">{r.label}</span>
                        {r.isChain && <Badge tone="neutre">transformation</Badge>}
                        {r.outputQty > 1 && <Badge tone="attente">produit {r.outputQty}</Badge>}
                        {fois > 0 ? (
                          <Badge tone="succes" point>
                            ×{fois} possible
                          </Badge>
                        ) : (
                          <Badge tone="danger">stock insuffisant</Badge>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                        {r.items.map((i) => {
                          const ont = dispo.get(i.materialId) ?? 0;
                          const assez = ont >= i.quantity;
                          return (
                            <span
                              key={i.id}
                              className={`inline-flex items-center gap-1.5 text-[0.75rem] ${
                                assez ? "text-givre-200/80" : "text-[#e69a8c]"
                              }`}
                            >
                              <Icone
                                nom={assez ? "valider" : "refuser"}
                                taille={10}
                                className={assez ? "text-[#8fd0a3]" : "text-[#e69a8c]"}
                              />
                              {nombre(i.quantity)} × {i.material.label}
                              <span className="text-givre-300/45">
                                ({nombre(ont)} {i.material.unit})
                              </span>
                            </span>
                          );
                        })}
                      </div>

                      {r.notes && (
                        <p className="mt-1.5 text-[0.7rem] text-givre-300/45 italic">{r.notes}</p>
                      )}
                    </div>

                    {/* Coût / revenu pour une fabrication */}
                    <div className="w-44 shrink-0 text-right">
                      <p className="text-[0.58rem] tracking-[0.14em] text-givre-300/45 uppercase">
                        Par fabrication
                      </p>
                      <p className="text-[0.76rem] tabular-nums text-givre-300/70">
                        coût {ch.cout === null ? "—" : septims(ch.cout * r.outputQty)}
                      </p>
                      <p className="text-[0.76rem] tabular-nums text-givre-100">
                        brut {revenu.brut > 0 ? septims(revenu.brut) : "—"}
                      </p>
                      <p className="text-[0.76rem] tabular-nums text-or-200">
                        net {revenu.net > 0 ? septims(revenu.net) : "—"}
                      </p>
                      {benefice !== null && revenu.brut > 0 && (
                        <p
                          className={`text-[0.8rem] tabular-nums ${
                            benefice >= 0 ? "text-[#8fd0a3]" : "text-[#e69a8c]"
                          }`}
                        >
                          bénéfice {benefice >= 0 ? "+" : ""}
                          {septims(benefice)}
                        </p>
                      )}
                      {revenu.brut === 0 && (
                        <p className="text-[0.64rem] text-[#e5a877]">objet non coté</p>
                      )}
                    </div>

                    {peutFabriquer ? (
                      <FormulaireFabriquer
                        recipeId={r.id}
                        source={source}
                        possible={fois}
                        produitParFois={r.outputQty}
                      />
                    ) : (
                      <span className="min-w-[190px] text-right text-[0.72rem] text-givre-300/35">
                        fabrication non autorisée
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Carte>
      )}

      <p className="mt-5 flex items-start gap-2 text-[0.72rem] text-givre-300/45">
        <Icone nom="registre" taille={13} className="mt-0.5" />
        Fabriquer déduit les composants, range le produit, inscrit le revenu à votre nom et verse{" "}
        {Math.round(TAUX_TAXE * 100)} % au coffre de la Maison. Le coût utilise les prix d'achat
        saisis dans l'onglet <em>Prix des matières</em> ; le revenu, le cours du marché de l'objet
        produit.
      </p>
    </>
  );
}
