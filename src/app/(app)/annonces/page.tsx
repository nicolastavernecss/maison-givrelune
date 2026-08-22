import Link from "next/link";
import type { Metadata } from "next";
import { Avatar, Badge, Carte, EnTetePage, LienBouton, Vide } from "@/components/ui/base";
import { Icone } from "@/components/ui/Icone";
import { Recit } from "@/components/ui/Recit";
import { ActionLigne } from "@/components/ui/form";
import { actionSupprimerAnnonce } from "@/app/actions/vie";
import { exigerDroit, peut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PERMISSIONS as P } from "@/lib/domain";
import { dateHeure, relatif } from "@/lib/format";
import { FormulaireAnnonce } from "./FormulaireAnnonce";

export const metadata: Metadata = { title: "Annonces" };
export const dynamic = "force-dynamic";

export default async function Annonces({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; branche?: string }>;
}) {
  const membre = await exigerDroit(P.ANNOUNCEMENT_READ);
  const f = await searchParams;
  const ecrit = peut(membre, P.ANNOUNCEMENT_CREATE);

  const [annonces, branches] = await Promise.all([
    prisma.announcement.findMany({
      where: f.branche ? { branch: { key: f.branche } } : {},
      orderBy: [{ epingle: "desc" }, { createdAt: "desc" }],
      include: {
        auteur: { select: { id: true, nomRp: true, avatarUrl: true, rank: { select: { label: true } } } },
        branch: { select: { label: true, color: true, key: true } },
      },
    }),
    prisma.branch.findMany({ orderBy: { position: "asc" } }),
  ]);

  const enEdition = f.edit ? annonces.find((a) => a.id === f.edit) : undefined;

  return (
    <>
      <EnTetePage
        surTitre="Tableau d'affichage"
        titre="Annonces"
        icone="annonce"
        texte="Ce que la Maison doit savoir. Les annonces épinglées restent en tête ; les Patriarches et les gradés y écrivent."
        actions={
          ecrit && (
            <LienBouton href="/annonces#redaction" variante="or" icone="plus">
              Publier
            </LienBouton>
          )
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <Link
          href="/annonces"
          className={`rounded-full border px-3 py-1 text-[0.72rem] transition-colors ${
            !f.branche
              ? "border-or-500/45 bg-or-500/12 text-or-200"
              : "border-argent-500/20 text-givre-300/70 hover:border-or-500/30"
          }`}
        >
          Toutes
        </Link>
        {branches.map((b) => (
          <Link
            key={b.id}
            href={`/annonces?branche=${b.key}`}
            className="rounded-full border px-3 py-1 text-[0.72rem] transition-colors"
            style={{
              borderColor: f.branche === b.key ? `${b.color}88` : "rgba(147,167,189,0.2)",
              background: f.branche === b.key ? `${b.color}18` : undefined,
              color: f.branche === b.key ? b.color : undefined,
            }}
          >
            {b.label}
          </Link>
        ))}
      </div>

      {annonces.length === 0 ? (
        <Carte padding={false} className="mb-6">
          <Vide titre="Aucune annonce" icone="annonce" texte="Le tableau d'affichage est vide." />
        </Carte>
      ) : (
        <div className="mb-8 space-y-4">
          {annonces.map((a) => (
            <article
              key={a.id}
              className={`carte carte-texture relative overflow-hidden p-5 ${
                a.epingle ? "border-or-500/35" : ""
              }`}
            >
              {a.epingle && (
                <span
                  className="absolute inset-x-0 top-0 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(210,184,115,0.7), transparent)",
                  }}
                />
              )}
              <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {a.epingle && <Icone nom="lune" taille={13} className="text-or-400" />}
                    <h2 className="titre-imperial text-[1.05rem] text-givre-50">{a.titre}</h2>
                    {a.branch && (
                      <span
                        className="rounded-full border px-2 py-px text-[0.62rem]"
                        style={{
                          borderColor: `${a.branch.color}55`,
                          background: `${a.branch.color}14`,
                          color: a.branch.color,
                        }}
                      >
                        {a.branch.label}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-[0.7rem] text-givre-300/55">
                    {a.auteur && (
                      <>
                        <Avatar nom={a.auteur.nomRp} url={a.auteur.avatarUrl} taille={20} />
                        <Link href={`/membres/${a.auteur.id}`} className="hover:text-or-300">
                          {a.auteur.nomRp}
                        </Link>
                        <span className="text-givre-300/35">·</span>
                        <span>{a.auteur.rank.label}</span>
                        <span className="text-givre-300/35">·</span>
                      </>
                    )}
                    <time title={dateHeure(a.createdAt)}>{relatif(a.createdAt)}</time>
                  </div>
                </div>

                {(ecrit || a.auteurId === membre.id) && (
                  <div className="flex shrink-0 gap-1.5">
                    <Link
                      href={`/annonces?edit=${a.id}#redaction`}
                      className="inline-flex items-center gap-1.5 rounded-[2px] border border-argent-500/25 px-2 py-1 text-[0.7rem] text-givre-200 transition-colors hover:bg-nuit-600/70"
                    >
                      <Icone nom="modifier" taille={12} />
                      Modifier
                    </Link>
                    <form action={actionSupprimerAnnonce}>
                      <input type="hidden" name="id" value={a.id} />
                      <ActionLigne icone="supprimer" ton="danger">
                        <span className="sr-only">Supprimer</span>
                      </ActionLigne>
                    </form>
                  </div>
                )}
              </header>

              <Recit texte={a.contenu} className="!text-[0.95rem] text-givre-200/85" />
            </article>
          ))}
        </div>
      )}

      {ecrit && (
        <Carte
          titre={enEdition ? `Modifier — ${enEdition.titre}` : "Publier une annonce"}
          sousTitre="Elle apparaîtra au tableau de bord de tous les membres concernés."
          icone={enEdition ? "modifier" : "plus"}
          actions={
            enEdition && (
              <LienBouton href="/annonces" variante="fantome" taille="sm" icone="refuser">
                Annuler
              </LienBouton>
            )
          }
        >
          <div id="redaction" className="scroll-mt-20">
            <FormulaireAnnonce
              key={enEdition?.id ?? "nouvelle"}
              branches={branches.map((b) => ({ value: b.id, label: b.label }))}
              id={enEdition?.id}
              valeurs={
                enEdition
                  ? {
                      titre: enEdition.titre,
                      contenu: enEdition.contenu,
                      branchId: enEdition.branchId ?? "",
                      epingle: String(enEdition.epingle),
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
