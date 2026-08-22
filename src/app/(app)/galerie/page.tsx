import Link from "next/link";
import type { Metadata } from "next";
import { Avatar, Carte, EnTetePage, LienBouton, Stat, Vide } from "@/components/ui/base";
import { ActionLigne } from "@/components/ui/form";
import { actionSupprimerGalerie } from "@/app/actions/vie";
import { exigerDroit, peut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PERMISSIONS as P } from "@/lib/domain";
import { relatif } from "@/lib/format";
import { FormulaireGalerie } from "./FormulaireGalerie";

export const metadata: Metadata = { title: "Galerie" };
export const dynamic = "force-dynamic";

export default async function Galerie() {
  const membre = await exigerDroit(P.GALLERY_READ);
  const publie = peut(membre, P.GALLERY_CREATE);

  const items = await prisma.galleryItem.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      auteur: { select: { id: true, nomRp: true, avatarUrl: true } },
      attachments: { select: { id: true, filename: true, caption: true } },
    },
    take: 120,
  });

  const nbImages = items.reduce((s, i) => s + i.attachments.length, 0);

  return (
    <>
      <EnTetePage
        surTitre="Vie de la Maison"
        titre="Galerie"
        icone="galerie"
        texte="Les captures de nos heures de gloire : patrouilles, banquets, pièces sorties de l'atelier. La mémoire visuelle de Givrelune."
        actions={
          publie && (
            <LienBouton href="/galerie#depot" variante="or" icone="photo">
              Ajouter
            </LienBouton>
          )
        }
      />

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Publications" valeur={items.length} icone="galerie" />
        <Stat label="Images" valeur={nbImages} icone="photo" />
        <Stat
          label="Dernière capture"
          valeur={items[0] ? relatif(items[0].createdAt) : "—"}
          sousTexte={items[0]?.titre}
          icone="horloge"
          tone="attente"
        />
      </section>

      {items.length === 0 ? (
        <Carte padding={false} className="mb-6">
          <Vide
            titre="Galerie vide"
            icone="galerie"
            texte={publie ? "Déposez la première capture ci-dessous." : "Aucune capture pour l'instant."}
          />
        </Carte>
      ) : (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="carte carte-texture overflow-hidden">
              <div
                className={`grid gap-px bg-nuit-950 ${
                  item.attachments.length > 1 ? "grid-cols-2" : "grid-cols-1"
                }`}
              >
                {item.attachments.slice(0, 4).map((a) => (
                  <a
                    key={a.id}
                    href={`/api/fichiers/${a.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative block aspect-[4/3] overflow-hidden bg-nuit-900"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/fichiers/${a.id}`}
                      alt={a.caption || a.filename}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    />
                  </a>
                ))}
              </div>

              <div className="p-4">
                <h2 className="titre-imperial text-[0.95rem] text-givre-50">{item.titre}</h2>
                {item.description && (
                  <p className="mt-1.5 text-[0.8rem] leading-relaxed text-givre-300/75">
                    {item.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2 border-t border-argent-500/10 pt-3">
                  {item.auteur && (
                    <>
                      <Avatar nom={item.auteur.nomRp} url={item.auteur.avatarUrl} taille={22} />
                      <Link
                        href={`/membres/${item.auteur.id}`}
                        className="text-[0.74rem] text-givre-200/80 hover:text-or-300"
                      >
                        {item.auteur.nomRp}
                      </Link>
                    </>
                  )}
                  <span className="ml-auto text-[0.68rem] text-givre-300/45">
                    {relatif(item.createdAt)}
                  </span>
                  {(item.auteurId === membre.id || peut(membre, P.ADMIN_FULL)) && (
                    <form action={actionSupprimerGalerie}>
                      <input type="hidden" name="id" value={item.id} />
                      <ActionLigne icone="supprimer" ton="danger">
                        <span className="sr-only">Supprimer</span>
                      </ActionLigne>
                    </form>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {publie && (
        <Carte
          titre="Déposer une capture"
          sousTitre="Les images sont stockées dans la base de la Maison — aucun service extérieur."
          icone="photo"
        >
          <div id="depot" className="scroll-mt-20">
            <FormulaireGalerie />
          </div>
        </Carte>
      )}
    </>
  );
}
