import Link from "next/link";
import { Badge, Carte, EnTetePage, Jauge, LienBouton, Message, Stat, Vide } from "@/components/ui/base";
import { Icone } from "@/components/ui/Icone";
import { ActionLigne } from "@/components/ui/form";
import {
  actionMouvementStock,
  actionSupprimerLigneInventaire,
} from "@/app/actions/economie";
import { prisma } from "@/lib/db";
import { coursDuMarche } from "@/lib/economie";
import { MATERIAL_STATES } from "@/lib/domain";
import { nombre, relatif, septims } from "@/lib/format";
import { FormulaireInventaire, type OptionMatiere } from "./FormulaireInventaire";

/**
 * Inventaire d'un propriétaire : la Maison, un membre ou un métier.
 * Groupé par catégorie, valorisé au cours du marché, avec alertes de seuil,
 * mouvements rapides et historique — comme le Registre des Stocks du Discord.
 */
export async function PageInventaire({
  ownerType,
  ownerUserId,
  ownerMetierId,
  titre,
  surTitre,
  description,
  editable,
  avecSeuil = false,
  edit,
  cheminBase,
}: {
  ownerType: "maison" | "membre" | "metier";
  ownerUserId?: string;
  ownerMetierId?: string;
  titre: string;
  surTitre: string;
  description: string;
  editable: boolean;
  avecSeuil?: boolean;
  edit?: string;
  cheminBase: string;
}) {
  const filtre = {
    ownerType,
    ...(ownerUserId ? { ownerUserId } : {}),
    ...(ownerMetierId ? { ownerMetierId } : {}),
  };

  const [lignes, matieres, cours, mouvements] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: filtre,
      include: {
        material: true,
        attachments: { select: { id: true, filename: true }, take: 4 },
      },
      orderBy: [{ category: "asc" }, { quantity: "desc" }],
    }),
    prisma.material.findMany({ orderBy: [{ category: "asc" }, { position: "asc" }] }),
    coursDuMarche(),
    prisma.inventoryMovement.findMany({
      where: { ownerType, ...(ownerUserId ? { inventoryItem: { ownerUserId } } : {}) },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { user: { select: { id: true, nomRp: true } } },
    }),
  ]);

  const prixDe = (l: (typeof lignes)[number]) =>
    l.unitValue ?? (l.materialId ? cours.get(l.materialId)?.dernier : undefined) ?? 0;

  const valeurTotale = lignes.reduce((s, l) => s + l.quantity * prixDe(l), 0);
  const sousSeuil = lignes.filter((l) => l.seuilBas !== null && l.quantity < l.seuilBas);
  const categories = [...new Set(lignes.map((l) => l.category || "Non classé"))].sort();

  const enEdition = edit ? lignes.find((l) => l.id === edit) : undefined;

  const optionsMatieres: OptionMatiere[] = matieres.map((m) => ({
    value: m.id,
    label: m.label,
    group: m.category,
    unit: m.unit,
    state: m.state,
    category: m.category,
  }));

  return (
    <>
      <EnTetePage
        surTitre={surTitre}
        titre={titre}
        icone={ownerType === "maison" ? "stock" : "stash"}
        texte={description}
        actions={
          <>
            <LienBouton href="/economie/cours-du-marche" variante="argent" icone="marche">
              Cours du marché
            </LienBouton>
            {editable && (
              <LienBouton href={`${cheminBase}#saisie`} variante="or" icone="plus">
                Ajouter une ligne
              </LienBouton>
            )}
          </>
        }
      />

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Lignes d'inventaire" valeur={lignes.length} icone="registre" />
        <Stat
          label="Valeur estimée"
          valeur={septims(valeurTotale)}
          sousTexte="au dernier cours connu"
          icone="septim"
          tone="attente"
        />
        <Stat label="Catégories" valeur={categories.length} icone="matiere" />
        <Stat
          label="Sous le seuil"
          valeur={sousSeuil.length}
          sousTexte={sousSeuil.length ? "à réapprovisionner" : "tout est au niveau"}
          icone="alerte"
          tone={sousSeuil.length ? "alerte" : "succes"}
        />
      </section>

      {sousSeuil.length > 0 && (
        <div className="mb-6">
          <Message tone="alerte" titre="Matières sous le seuil bas" icone="alerte">
            {sousSeuil.map((l) => (
              <span key={l.id} className="mr-3 inline-block">
                {l.material?.label ?? l.customLabel} —{" "}
                <span className="tabular-nums">
                  {nombre(l.quantity)} / {nombre(l.seuilBas ?? 0)}
                </span>
              </span>
            ))}
          </Message>
        </div>
      )}

      {lignes.length === 0 ? (
        <Carte padding={false} className="mb-6">
          <Vide
            titre="Inventaire vide"
            icone={ownerType === "maison" ? "stock" : "stash"}
            texte={
              editable
                ? "Ajoutez une première ligne avec le formulaire ci-dessous."
                : "Rien n'a encore été déclaré ici."
            }
          />
        </Carte>
      ) : (
        <div className="mb-6 space-y-5">
          {categories.map((cat) => {
            const groupe = lignes.filter((l) => (l.category || "Non classé") === cat);
            const valeurCat = groupe.reduce((s, l) => s + l.quantity * prixDe(l), 0);
            return (
              <Carte
                key={cat}
                titre={cat}
                sousTitre={`${groupe.length} ligne(s)`}
                icone="matiere"
                padding={false}
                actions={<Badge tone="attente">{septims(valeurCat)}</Badge>}
              >
                <ul className="divide-y divide-argent-500/10">
                  {groupe.map((l) => {
                    const pu = prixDe(l);
                    const alerte = l.seuilBas !== null && l.quantity < l.seuilBas;
                    return (
                      <li key={l.id} className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                          <div className="min-w-[180px] flex-1">
                            <div className="flex items-center gap-2">
                              {l.material ? (
                                <Link
                                  href={`/economie/cours-du-marche/${l.material.key}`}
                                  className="text-[0.88rem] text-givre-50 transition-colors hover:text-or-300"
                                >
                                  {l.material.label}
                                </Link>
                              ) : (
                                <span className="text-[0.88rem] text-givre-50">{l.customLabel}</span>
                              )}
                              {l.state && (
                                <span className="rounded-full border border-argent-500/20 px-1.5 py-px text-[0.6rem] text-givre-300/60">
                                  {MATERIAL_STATES[l.state] ?? l.state}
                                </span>
                              )}
                              {alerte && <Badge tone="alerte">seuil bas</Badge>}
                            </div>
                            {l.notes && (
                              <p className="mt-0.5 text-[0.72rem] text-givre-300/55">{l.notes}</p>
                            )}
                            {l.attachments.length > 0 && (
                              <div className="mt-1.5 flex gap-1.5">
                                {l.attachments.map((a) => (
                                  <a
                                    key={a.id}
                                    href={`/api/fichiers/${a.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={a.filename}
                                    className="block size-10 overflow-hidden rounded-[2px] border border-argent-500/20 transition-colors hover:border-or-500/45"
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

                          <div className="w-28 shrink-0 text-right">
                            <p className="text-[0.95rem] tabular-nums text-givre-50">
                              {nombre(l.quantity)}{" "}
                              <span className="text-[0.72rem] text-givre-300/50">{l.unit}</span>
                            </p>
                            {l.seuilBas !== null && (
                              <div className="mt-1">
                                <Jauge
                                  valeur={l.quantity}
                                  max={Math.max(l.seuilBas * 2, l.quantity)}
                                  tone={alerte ? "danger" : "succes"}
                                  hauteur={3}
                                />
                              </div>
                            )}
                          </div>

                          <div className="w-28 shrink-0 text-right">
                            <p className="text-[0.82rem] tabular-nums text-or-200">
                              {septims(l.quantity * pu)}
                            </p>
                            <p className="text-[0.66rem] text-givre-300/45">{septims(pu)} / {l.unit}</p>
                          </div>

                          {editable && (
                            <div className="flex shrink-0 items-center gap-1.5">
                              {[-10, -1, 1, 10].map((d) => (
                                <form key={d} action={actionMouvementStock}>
                                  <input type="hidden" name="id" value={l.id} />
                                  <input type="hidden" name="delta" value={d} />
                                  <input
                                    type="hidden"
                                    name="reason"
                                    value={d > 0 ? "Entrée rapide" : "Sortie rapide"}
                                  />
                                  <ActionLigne ton={d > 0 ? "succes" : "danger"}>
                                    {d > 0 ? `+${d}` : d}
                                  </ActionLigne>
                                </form>
                              ))}
                              <Link
                                href={`${cheminBase}?edit=${l.id}#saisie`}
                                className="inline-flex items-center rounded-[2px] border border-argent-500/25 px-2 py-1 text-[0.7rem] text-givre-200 transition-colors hover:bg-nuit-600/70"
                              >
                                <Icone nom="modifier" taille={12} />
                              </Link>
                              <form action={actionSupprimerLigneInventaire}>
                                <input type="hidden" name="id" value={l.id} />
                                <ActionLigne icone="supprimer" ton="danger">
                                  <span className="sr-only">Supprimer</span>
                                </ActionLigne>
                              </form>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Carte>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {editable && (
          <Carte
            titre={enEdition ? "Modifier la ligne" : "Ajouter à l'inventaire"}
            sousTitre="Tout écart de quantité est consigné à l'historique des mouvements."
            icone={enEdition ? "modifier" : "plus"}
            actions={
              enEdition && (
                <LienBouton href={cheminBase} variante="fantome" taille="sm" icone="refuser">
                  Annuler
                </LienBouton>
              )
            }
          >
            <div id="saisie" className="scroll-mt-20">
              <FormulaireInventaire
                key={enEdition?.id ?? "nouveau"}
                ownerType={ownerType}
                ownerUserId={ownerUserId}
                ownerMetierId={ownerMetierId}
                matieres={optionsMatieres}
                avecSeuil={avecSeuil}
                id={enEdition?.id}
                valeurs={
                  enEdition
                    ? {
                        materialId: enEdition.materialId ?? "",
                        customLabel: enEdition.customLabel,
                        quantity: String(enEdition.quantity),
                        unit: enEdition.unit,
                        category: enEdition.category,
                        state: enEdition.state,
                        unitValue: enEdition.unitValue?.toString() ?? "",
                        seuilBas: enEdition.seuilBas?.toString() ?? "",
                        notes: enEdition.notes,
                      }
                    : undefined
                }
              />
            </div>
          </Carte>
        )}

        <Carte
          titre="Historique des mouvements"
          sousTitre="Entrées et sorties, qui et pourquoi"
          icone="registre"
          padding={false}
        >
          {mouvements.length === 0 ? (
            <Vide titre="Aucun mouvement" icone="registre" />
          ) : (
            <ul className="max-h-[520px] divide-y divide-argent-500/10 overflow-y-auto">
              {mouvements.map((mv) => (
                <li key={mv.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span
                    className={`w-14 shrink-0 text-right text-[0.82rem] tabular-nums ${
                      mv.delta > 0 ? "text-[#8fd0a3]" : "text-[#e69a8c]"
                    }`}
                  >
                    {mv.delta > 0 ? "+" : ""}
                    {nombre(mv.delta)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8rem] text-givre-100">{mv.label}</span>
                    <span className="block truncate text-[0.68rem] text-givre-300/55">
                      {mv.reason}
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-[0.66rem] text-givre-300/45">
                    {mv.user ? (
                      <Link href={`/membres/${mv.user.id}`} className="hover:text-or-300">
                        {mv.user.nomRp}
                      </Link>
                    ) : (
                      "—"
                    )}
                    <br />
                    {relatif(mv.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Carte>
      </div>
    </>
  );
}
