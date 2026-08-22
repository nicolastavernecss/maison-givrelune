import Link from "next/link";
import { BadgeStatut, Carte, EnTetePage, Jauge, LienBouton } from "@/components/ui/base";
import { Filtres } from "@/components/ui/Filtres";
import { Icone } from "@/components/ui/Icone";
import { Tableau, type Colonne } from "@/components/ui/Tableau";
import { ActionLigne } from "@/components/ui/form";
import { actionTransition, actionSupprimerEntree } from "@/app/actions/registres";
import { exigerDroit, peut } from "@/lib/auth";
import { contient, prisma } from "@/lib/db";
import { STATUSES } from "@/lib/domain";
import { date, nombre, pourInputDate, septims, tronquer } from "@/lib/format";
import type { RegistreDef } from "@/lib/registres";
import { FormulaireRegistre, type Listes } from "./FormulaireRegistre";

type Ligne = Record<string, unknown> & { id: string };

function modele(nom: string) {
  return (prisma as unknown as Record<string, { findMany: (a: unknown) => Promise<Ligne[]>; findUnique: (a: unknown) => Promise<Ligne | null>; count: (a: unknown) => Promise<number> }>)[nom];
}

/**
 * Page complète d'un registre, engendrée à partir de sa description :
 * filtres, formulaire de saisie, tableau, actions de validation.
 */
export async function PageRegistre({
  def,
  params,
}: {
  def: RegistreDef;
  params: Record<string, string | undefined>;
}) {
  const membre = await exigerDroit(def.droits.lire);
  const peutCreer = peut(membre, def.droits.creer);
  const peutValider = peut(membre, def.droits.valider);

  /* ── Filtrage ── */
  const where: Record<string, unknown> = {};
  const recherche = params.q;
  if (recherche && def.recherche.length > 0) {
    where.OR = def.recherche.map((champ) => ({ [champ]: contient(recherche) }));
  }
  if (params.statut) where[def.champStatut] = params.statut;
  for (const f of def.filtres ?? []) {
    if (params[f.nom]) where[f.champ] = params[f.nom];
  }

  const m = modele(def.modele);
  const [donnees, membres, materiaux, metiers, branches, cercles, missions] = await Promise.all([
    m.findMany({
      where,
      include: def.include,
      orderBy: def.tri ?? { createdAt: "desc" },
      take: 300,
    }),
    prisma.user.findMany({
      where: { status: { not: "archive" } },
      select: { id: true, nomRp: true },
      orderBy: { nomRp: "asc" },
    }),
    prisma.material.findMany({
      select: { id: true, label: true, category: true },
      orderBy: [{ category: "asc" }, { position: "asc" }],
    }),
    prisma.metier.findMany({ select: { id: true, label: true }, orderBy: { position: "asc" } }),
    prisma.branch.findMany({ select: { id: true, label: true }, orderBy: { position: "asc" } }),
    prisma.circle.findMany({ select: { id: true, label: true }, orderBy: { label: "asc" } }),
    def.champs.some((c) => c.type === "mission")
      ? prisma.mission.findMany({ select: { id: true, titre: true }, orderBy: { date: "desc" }, take: 100 })
      : Promise.resolve([]),
  ]);

  const listes: Listes = {
    membres: membres.map((u) => ({ value: u.id, label: u.nomRp })),
    materiaux: materiaux.map((mt) => ({ value: mt.id, label: mt.label, group: mt.category })),
    metiers: metiers.map((mt) => ({ value: mt.id, label: mt.label })),
    branches: branches.map((b) => ({ value: b.id, label: b.label })),
    cercles: cercles.map((c) => ({ value: c.id, label: c.label })),
    missions: missions.map((mi) => ({ value: mi.id, label: mi.titre })),
  };

  /* ── Entrée en cours d'édition ── */
  let enEdition: Ligne | null = null;
  if (params.edit) enEdition = await m.findUnique({ where: { id: params.edit } });

  const valeursInitiales: Record<string, string> = {};
  if (enEdition) {
    for (const c of def.champs) {
      const v = enEdition[c.nom];
      if (v === null || v === undefined) continue;
      valeursInitiales[c.nom] =
        c.type === "date" ? pourInputDate(v as Date) : c.type === "checkbox" ? String(v) : String(v);
    }
  }

  /* ── Colonnes ── */
  const colonnes: Colonne<Ligne>[] = def.colonnes.map((c) => ({
    cle: c.champ,
    entete: c.entete,
    principal: c.principal,
    masquerMobile: c.masquerMobile,
    numerique: c.type === "nombre" || c.type === "septims",
    rendu: (item) => {
      const v = item[c.champ];
      switch (c.type) {
        case "date":
          return <span className="text-givre-200/85">{date(v as Date)}</span>;
        case "septims":
          return <span className="text-or-200">{septims(v as number)}</span>;
        case "nombre":
          return nombre(v as number);
        case "statut":
          return <BadgeStatut famille={def.famille} valeur={String(v ?? "")} />;
        case "relation": {
          const rel = item[c.relation ?? c.champ] as Record<string, unknown> | null;
          let texte = rel ? String(rel[c.sousChamp ?? "label"] ?? "") : "";
          const idRel = rel?.id ? String(rel.id) : null;
          // Repli sur le champ texte libre : bénéficiaire ou demandeur extérieur à la Maison.
          if (!texte && c.repli) texte = String(item[c.repli] ?? "");
          if (!texte) return <span className="text-givre-300/35">—</span>;
          return c.sousChamp === "nomRp" && idRel ? (
            <Link href={`/membres/${idRel}`} className="text-givre-100 transition-colors hover:text-or-300">
              {texte}
            </Link>
          ) : (
            <span className="text-givre-200/85">{texte}</span>
          );
        }
        case "personnalise":
          if (c.champ === "avancement") {
            const pct = Number(v ?? 0);
            return (
              <div className="flex min-w-[110px] items-center gap-2">
                <Jauge valeur={pct} tone={pct >= 100 ? "succes" : "actif"} hauteur={5} />
                <span className="w-9 shrink-0 text-right text-[0.72rem] tabular-nums text-givre-300/70">
                  {pct} %
                </span>
              </div>
            );
          }
          return String(v ?? "");
        default: {
          const texte = String(v ?? "");
          if (!texte) return <span className="text-givre-300/35">—</span>;
          return (
            <span className={c.principal ? "text-givre-50" : "text-givre-200/80"}>
              {tronquer(texte.replace(/\n+/g, " "), c.principal ? 70 : 46)}
            </span>
          );
        }
      }
    },
  }));

  const compteurs = STATUSES[def.famille].map((s) => ({
    ...s,
    n: donnees.filter((d) => d[def.champStatut] === s.value).length,
  }));

  return (
    <>
      <EnTetePage
        surTitre={def.surTitre}
        titre={def.titre}
        icone={def.icone}
        texte={def.description}
        actions={
          peutCreer && (
            <LienBouton href={`${def.chemin}#nouvelle`} variante="or" icone="plus">
              Nouvelle entrée
            </LienBouton>
          )
        }
      />

      {/* ── Répartition par statut ── */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={def.chemin}
          className={`rounded-full border px-3 py-1 text-[0.72rem] transition-colors ${
            !params.statut
              ? "border-or-500/45 bg-or-500/12 text-or-200"
              : "border-argent-500/20 text-givre-300/70 hover:border-or-500/30"
          }`}
        >
          Tous · {donnees.length}
        </Link>
        {compteurs.map((s) => (
          <Link
            key={s.value}
            href={`${def.chemin}?statut=${s.value}`}
            className={`rounded-full border px-3 py-1 text-[0.72rem] transition-colors ${
              params.statut === s.value
                ? "border-or-500/45 bg-or-500/12 text-or-200"
                : "border-argent-500/20 text-givre-300/70 hover:border-or-500/30"
            }`}
          >
            {s.label} · {s.n}
          </Link>
        ))}
      </div>

      <Filtres
        action={def.chemin}
        valeurs={params}
        total={donnees.length}
        champs={[
          { type: "recherche", nom: "q", placeholder: `Rechercher dans les ${def.titre.toLowerCase()}…` },
          {
            type: "select",
            nom: "statut",
            label: "Statut",
            options: STATUSES[def.famille].map((s) => ({ value: s.value, label: s.label })),
          },
          ...(def.filtres ?? []).map((f) => ({
            type: "select" as const,
            nom: f.nom,
            label: f.label,
            options: f.options,
          })),
        ]}
      />

      <Carte padding={false} className="mb-6">
        <Tableau
          colonnes={colonnes}
          donnees={donnees}
          cle={(d) => d.id}
          vide={`Aucune entrée dans ce registre`}
          videIcone={def.icone}
          videTexte={
            peutCreer
              ? `Consignez la première entrée avec le formulaire ci-dessous.`
              : `Ce registre est vide pour l'instant.`
          }
          actions={(item) => {
            const statutCourant = String(item[def.champStatut] ?? "");
            const dispos = (def.transitions ?? []).filter(
              (t) =>
                t.vers !== statutCourant &&
                peut(membre, t.droit) &&
                (!t.depuis || t.depuis.includes(statutCourant)),
            );
            return (
              <>
                {dispos.map((t) => (
                  <form key={t.vers} action={actionTransition}>
                    <input type="hidden" name="_registre" value={def.cle} />
                    <input type="hidden" name="_id" value={item.id} />
                    <input type="hidden" name="_vers" value={t.vers} />
                    <ActionLigne icone={t.icone} ton={t.ton}>
                      {t.label}
                    </ActionLigne>
                  </form>
                ))}
                {(peutCreer || peutValider) && (
                  <Link
                    href={`${def.chemin}?edit=${item.id}#nouvelle`}
                    className="inline-flex items-center gap-1.5 rounded-[2px] border border-argent-500/25 px-2 py-1 text-[0.7rem] text-givre-200 transition-colors hover:bg-nuit-600/70"
                  >
                    <Icone nom="modifier" taille={12} />
                    Modifier
                  </Link>
                )}
                {peutValider && (
                  <form action={actionSupprimerEntree}>
                    <input type="hidden" name="_registre" value={def.cle} />
                    <input type="hidden" name="_id" value={item.id} />
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

      {/* ── Saisie ── */}
      {peutCreer && (
        <Carte
          titre={enEdition ? `Modifier — ${def.singulier}` : `Consigner un nouveau ${def.singulier}`}
          sousTitre={
            enEdition
              ? "Les modifications sont horodatées et tracées au journal."
              : "L'auteur et la date sont enregistrés automatiquement."
          }
          icone={enEdition ? "modifier" : "plus"}
          actions={
            enEdition && (
              <LienBouton href={def.chemin} variante="fantome" taille="sm" icone="refuser">
                Annuler la modification
              </LienBouton>
            )
          }
        >
          <div id="nouvelle" className="scroll-mt-20">
            <FormulaireRegistre
              key={enEdition?.id ?? "nouveau"}
              registre={def.cle}
              champs={def.champs}
              listes={listes}
              valeurs={valeursInitiales}
              id={enEdition?.id}
              libelleBouton={enEdition ? "Enregistrer les modifications" : "Consigner au registre"}
            />
          </div>
        </Carte>
      )}
    </>
  );
}
