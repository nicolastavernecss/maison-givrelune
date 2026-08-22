import Link from "next/link";
import type { Metadata } from "next";
import { Badge, BadgeStatut, Carte, EnTetePage, LienBouton, Stat } from "@/components/ui/base";
import { Filtres } from "@/components/ui/Filtres";
import { Icone } from "@/components/ui/Icone";
import { Tableau } from "@/components/ui/Tableau";
import { ActionLigne } from "@/components/ui/form";
import {
  actionEtatCommande,
  actionSupprimerCommande,
} from "@/app/actions/commandes";
import { exigerDroit, peut } from "@/lib/auth";
import { contient, prisma } from "@/lib/db";
import { chiffrerRecette, contexteChiffrage } from "@/lib/economie";
import { DEFAULT_MARGIN, PERMISSIONS as P, STATUSES } from "@/lib/domain";
import { date, nombre, pourInputDate, relatif, septims } from "@/lib/format";
import { FormulaireCommande, type RecetteChiffree } from "./FormulaireCommande";

export const metadata: Metadata = { title: "Commandes" };
export const dynamic = "force-dynamic";

export default async function Commandes({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; etat?: string; artisan?: string; edit?: string; recette?: string }>;
}) {
  const membre = await exigerDroit(P.ORDER_READ);
  const f = await searchParams;

  const [commandes, artisans, metiers, recettes, ctx] = await Promise.all([
    prisma.craftOrder.findMany({
      where: {
        ...(f.q
          ? {
              OR: [
                { clientNomRp: contient(f.q) },
                { clientMaison: contient(f.q) },
                { objets: contient(f.q) },
              ],
            }
          : {}),
        ...(f.etat ? { etat: f.etat } : {}),
        ...(f.artisan ? { artisanId: f.artisan } : {}),
      },
      include: {
        artisan: { select: { id: true, nomRp: true } },
        metier: { select: { label: true, key: true } },
        recipe: { select: { label: true } },
        attachments: { select: { id: true, filename: true }, take: 3 },
      },
      orderBy: [{ dateCommande: "desc" }],
    }),
    prisma.user.findMany({
      where: { status: { not: "archive" } },
      select: { id: true, nomRp: true },
      orderBy: { nomRp: "asc" },
    }),
    prisma.metier.findMany({ orderBy: { position: "asc" }, select: { id: true, label: true } }),
    prisma.recipe.findMany({
      where: { isChain: false },
      include: { metier: { select: { label: true } }, items: true },
      orderBy: { label: "asc" },
    }),
    contexteChiffrage(),
  ]);

  const enEdition = f.edit ? commandes.find((c) => c.id === f.edit) : undefined;
  const peutEcrire = peut(membre, P.ORDER_CREATE, P.ORDER_VALIDATE);

  const recettesChiffrees: RecetteChiffree[] = recettes.map((r) => {
    const ch = chiffrerRecette(
      {
        id: r.id,
        outputMaterialId: r.outputMaterialId,
        outputQty: r.outputQty,
        items: r.items.map((i) => ({ materialId: i.materialId, quantity: i.quantity })),
      },
      ctx,
      DEFAULT_MARGIN,
    );
    return {
      value: r.id,
      label: r.label,
      group: r.metier.label,
      cout: ch.cout,
      conseille: ch.prixConseille,
    };
  });

  const totalDu = commandes.reduce(
    (s, c) => s + (c.etat === "annulee" ? 0 : c.resteAPayer),
    0,
  );
  const enCours = commandes.filter((c) => c.etat === "en_fabrication" || c.etat === "en_attente");
  const chiffreAffaires = commandes
    .filter((c) => c.etat !== "annulee")
    .reduce((s, c) => s + c.acompte, 0);

  return (
    <>
      <EnTetePage
        surTitre="Artisanat & Commerce"
        titre="Commandes"
        icone="commande"
        texte="Le carnet de commandes de la Maison, au gabarit du Discord. Le reste à payer se calcule tout seul et alimente le tableau des impayés."
        actions={
          <>
            <LienBouton href="/economie/impayes" variante="argent" icone="impaye">
              Impayés
            </LienBouton>
            {peutEcrire && (
              <LienBouton href="/economie/commandes#saisie" variante="or" icone="plus">
                Nouvelle commande
              </LienBouton>
            )}
          </>
        }
      />

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Commandes" valeur={commandes.length} icone="commande" />
        <Stat label="En cours" valeur={enCours.length} icone="atelier" tone="actif" />
        <Stat
          label="Encaissé"
          valeur={septims(chiffreAffaires)}
          sousTexte="acomptes et soldes reçus"
          icone="septim"
          tone="succes"
        />
        <Stat
          label="Reste dû"
          valeur={septims(totalDu)}
          sousTexte="toutes commandes confondues"
          icone="impaye"
          tone={totalDu > 0 ? "danger" : "succes"}
          href="/economie/impayes"
        />
      </section>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/economie/commandes"
          className={`rounded-full border px-3 py-1 text-[0.72rem] transition-colors ${
            !f.etat
              ? "border-or-500/45 bg-or-500/12 text-or-200"
              : "border-argent-500/20 text-givre-300/70 hover:border-or-500/30"
          }`}
        >
          Toutes · {commandes.length}
        </Link>
        {STATUSES.commande.map((s) => (
          <Link
            key={s.value}
            href={`/economie/commandes?etat=${s.value}`}
            className={`rounded-full border px-3 py-1 text-[0.72rem] transition-colors ${
              f.etat === s.value
                ? "border-or-500/45 bg-or-500/12 text-or-200"
                : "border-argent-500/20 text-givre-300/70 hover:border-or-500/30"
            }`}
          >
            {s.label} · {commandes.filter((c) => c.etat === s.value).length}
          </Link>
        ))}
      </div>

      <Filtres
        action="/economie/commandes"
        valeurs={f}
        total={commandes.length}
        champs={[
          { type: "recherche", nom: "q", placeholder: "Client, maison ou objet…" },
          {
            type: "select",
            nom: "etat",
            label: "État",
            options: STATUSES.commande.map((s) => ({ value: s.value, label: s.label })),
          },
          {
            type: "select",
            nom: "artisan",
            label: "Artisan",
            options: artisans.map((a) => ({ value: a.id, label: a.nomRp })),
          },
        ]}
      />

      <Carte padding={false} className="mb-6">
        <Tableau
          donnees={commandes}
          cle={(c) => c.id}
          vide="Aucune commande"
          videIcone="commande"
          videTexte="Le carnet est vide. Enregistrez la première commande ci-dessous."
          colonnes={[
            {
              cle: "objets",
              entete: "Objet(s)",
              principal: true,
              rendu: (c) => (
                <span>
                  <span className="text-givre-50">{c.objets}</span>
                  {c.quantite > 1 && (
                    <span className="ml-1.5 text-givre-300/60">×{c.quantite}</span>
                  )}
                  {c.attachments.length > 0 && (
                    <Icone nom="photo" taille={11} className="ml-1.5 inline text-or-400/60" />
                  )}
                </span>
              ),
            },
            {
              cle: "client",
              entete: "Client",
              rendu: (c) => (
                <span>
                  <span className="block text-givre-100">{c.clientNomRp}</span>
                  {c.clientMaison && (
                    <span className="block text-[0.7rem] text-givre-300/50">{c.clientMaison}</span>
                  )}
                </span>
              ),
            },
            {
              cle: "artisan",
              entete: "Artisan",
              masquerMobile: true,
              rendu: (c) =>
                c.artisan ? (
                  <Link href={`/membres/${c.artisan.id}`} className="hover:text-or-300">
                    {c.artisan.nomRp}
                  </Link>
                ) : (
                  "—"
                ),
            },
            {
              cle: "prix",
              entete: "Prix",
              numerique: true,
              rendu: (c) => <span className="text-or-200">{septims(c.prixConvenu)}</span>,
            },
            {
              cle: "acompte",
              entete: "Acompte",
              numerique: true,
              masquerMobile: true,
              rendu: (c) => septims(c.acompte),
            },
            {
              cle: "reste",
              entete: "Reste à payer",
              numerique: true,
              rendu: (c) =>
                c.resteAPayer > 0 && c.etat !== "annulee" ? (
                  <Badge tone="danger" point>
                    {septims(c.resteAPayer)}
                  </Badge>
                ) : (
                  <Badge tone="succes" point>
                    payé
                  </Badge>
                ),
            },
            {
              cle: "livraison",
              entete: "Livraison",
              masquerMobile: true,
              rendu: (c) =>
                c.dateLivraisonPrevue ? (
                  <span
                    className={
                      new Date(c.dateLivraisonPrevue) < new Date() &&
                      c.etat !== "livree" &&
                      c.etat !== "annulee"
                        ? "text-[#e69a8c]"
                        : "text-givre-200/80"
                    }
                    title={date(c.dateLivraisonPrevue)}
                  >
                    {relatif(c.dateLivraisonPrevue)}
                  </span>
                ) : (
                  <span className="text-givre-300/30">—</span>
                ),
            },
            {
              cle: "etat",
              entete: "État",
              rendu: (c) => <BadgeStatut famille="commande" valeur={c.etat} />,
            },
          ]}
          actions={(c) => {
            const suivant: Record<string, { vers: string; label: string; icone: string }> = {
              en_attente: { vers: "en_fabrication", label: "Lancer", icone: "atelier" },
              en_fabrication: { vers: "prete", label: "Prête", icone: "valider" },
              prete: { vers: "livree", label: "Livrer", icone: "valider" },
            };
            const s = suivant[c.etat];
            return (
              <>
                {s && peutEcrire && (
                  <form action={actionEtatCommande}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="etat" value={s.vers} />
                    <ActionLigne icone={s.icone} ton="succes">
                      {s.label}
                    </ActionLigne>
                  </form>
                )}
                {peutEcrire && (
                  <Link
                    href={`/economie/commandes?edit=${c.id}#saisie`}
                    className="inline-flex items-center gap-1.5 rounded-[2px] border border-argent-500/25 px-2 py-1 text-[0.7rem] text-givre-200 transition-colors hover:bg-nuit-600/70"
                  >
                    <Icone nom="modifier" taille={12} />
                    Modifier
                  </Link>
                )}
                {peut(membre, P.ORDER_VALIDATE) && c.etat !== "annulee" && (
                  <form action={actionEtatCommande}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="etat" value="annulee" />
                    <ActionLigne icone="refuser" ton="danger">
                      Annuler
                    </ActionLigne>
                  </form>
                )}
                {peut(membre, P.ORDER_VALIDATE) && (
                  <form action={actionSupprimerCommande}>
                    <input type="hidden" name="id" value={c.id} />
                    <ActionLigne icone="supprimer" ton="danger">
                      <span className="sr-only">Supprimer</span>
                    </ActionLigne>
                  </form>
                )}
              </>
            );
          }}
        />
      </Carte>

      {peutEcrire && (
        <Carte
          titre={enEdition ? `Modifier — ${enEdition.clientNomRp}` : "Nouvelle commande"}
          sousTitre="Le gabarit de la Maison, au champ près. Le reste à payer est calculé automatiquement."
          icone={enEdition ? "modifier" : "plus"}
          actions={
            enEdition && (
              <LienBouton href="/economie/commandes" variante="fantome" taille="sm" icone="refuser">
                Annuler
              </LienBouton>
            )
          }
        >
          <div id="saisie" className="scroll-mt-20">
            <FormulaireCommande
              key={enEdition?.id ?? "nouvelle"}
              artisans={artisans.map((a) => ({ value: a.id, label: a.nomRp }))}
              metiers={metiers.map((m) => ({ value: m.id, label: m.label }))}
              recettes={recettesChiffrees}
              id={enEdition?.id}
              valeurs={
                enEdition
                  ? {
                      clientNomRp: enEdition.clientNomRp,
                      clientMaison: enEdition.clientMaison,
                      clientContact: enEdition.clientContact,
                      artisanId: enEdition.artisanId ?? "",
                      metierId: enEdition.metierId ?? "",
                      recipeId: enEdition.recipeId ?? "",
                      objets: enEdition.objets,
                      quantite: String(enEdition.quantite),
                      materiauxFournisParClient: String(enEdition.materiauxFournisParClient),
                      materiauxAFournir: enEdition.materiauxAFournir,
                      prixConvenu: String(enEdition.prixConvenu),
                      acompte: String(enEdition.acompte),
                      dateCommande: pourInputDate(enEdition.dateCommande),
                      dateLivraisonPrevue: pourInputDate(enEdition.dateLivraisonPrevue),
                      etat: enEdition.etat,
                      observations: enEdition.observations,
                    }
                  : f.recette
                    ? { recipeId: f.recette }
                    : undefined
              }
            />
          </div>
        </Carte>
      )}

      <p className="mt-6 flex items-center gap-2 text-[0.72rem] text-givre-300/45">
        <Icone nom="recette" taille={13} />
        Rattacher une recette pré-remplit le coût matière depuis les{" "}
        <Link href="/economie/ateliers" className="text-or-300 hover:underline">
          ateliers-métiers
        </Link>{" "}
        et le cours du marché — {nombre(recettes.length)} recettes disponibles.
      </p>
    </>
  );
}
