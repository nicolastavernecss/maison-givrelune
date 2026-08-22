import Link from "next/link";
import type { Metadata } from "next";
import { Badge, Carte, Definitions, EnTetePage, Message, Stat, Vide } from "@/components/ui/base";
import { Courbe } from "@/components/ui/Courbe";
import { Icone } from "@/components/ui/Icone";
import { Bouton } from "@/components/ui/base";
import { actionReevaluerStock } from "@/app/actions/commandes";
import { exigerDroit, peut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { coursDuMarche, valoriser } from "@/lib/economie";
import { PERMISSIONS as P } from "@/lib/domain";
import { date, dateHeure, nombre, relatif, septims } from "@/lib/format";
import { FormulaireTresorerie } from "./FormulaireTresorerie";

export const metadata: Metadata = { title: "Trésorerie" };
export const dynamic = "force-dynamic";

const LIBELLES: Record<string, string> = {
  commande: "Commandes",
  commerce: "Commerce",
  dotation: "Dotations",
  achat: "Achats de matières",
  solde: "Soldes des membres",
  entretien: "Entretien & ateliers",
  diplomatie: "Diplomatie",
  divers: "Divers",
};

export default async function Tresorerie() {
  const membre = await exigerDroit(P.TREASURY_READ);
  const gere = peut(membre, P.TREASURY_MANAGE);

  const [coffre, mouvements, stockMaison, cours, impayes, responsable] = await Promise.all([
    prisma.treasury.findUnique({ where: { id: "maison" } }),
    prisma.treasuryMovement.findMany({
      orderBy: { date: "desc" },
      take: 120,
      include: { user: { select: { id: true, nomRp: true } } },
    }),
    prisma.inventoryItem.findMany({
      where: { ownerType: "maison" },
      select: { materialId: true, quantity: true, unitValue: true },
    }),
    coursDuMarche(),
    prisma.craftOrder.aggregate({
      where: { resteAPayer: { gt: 0 }, etat: { not: "annulee" } },
      _sum: { resteAPayer: true },
      _count: true,
    }),
    prisma.treasury
      .findUnique({ where: { id: "maison" } })
      .then((t) =>
        t?.responsableId
          ? prisma.user.findUnique({
              where: { id: t.responsableId },
              select: { id: true, nomRp: true },
            })
          : null,
      ),
  ]);

  const prix = new Map([...cours].map(([id, c]) => [id, c.dernier]));
  const valeurStockReelle = Math.round(valoriser(stockMaison, prix));
  const solde = coffre?.septims ?? 0;
  const creances = impayes._sum.resteAPayer ?? 0;

  const trente = Date.now() - 30 * 86_400_000;
  const recents = mouvements.filter((m) => m.date.getTime() >= trente);
  const entrees = recents.filter((m) => m.montant > 0).reduce((s, m) => s + m.montant, 0);
  const sorties = recents.filter((m) => m.montant < 0).reduce((s, m) => s + m.montant, 0);

  const courbe = [...mouvements]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((m) => ({ t: m.date.getTime(), v: m.soldeApres }));

  const parCategorie = new Map<string, { entrees: number; sorties: number }>();
  for (const m of mouvements) {
    const e = parCategorie.get(m.categorie) ?? { entrees: 0, sorties: 0 };
    if (m.montant > 0) e.entrees += m.montant;
    else e.sorties += Math.abs(m.montant);
    parCategorie.set(m.categorie, e);
  }

  return (
    <>
      <EnTetePage
        surTitre="Conseil des Patriarches — privé"
        titre="Trésorerie de la Maison"
        icone="tresorerie"
        texte="Le coffre commun, la valeur du stock et le journal de tous les mouvements. Consultable par le Conseil, mouvementable par l'Intendant, les Hauts-Pères et les Patriarches."
        actions={
          gere && (
            <form action={actionReevaluerStock}>
              <Bouton variante="argent" icone="marche" type="submit">
                Réévaluer le stock au cours
              </Bouton>
            </form>
          )
        }
      />

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Septims au coffre"
          valeur={septims(solde)}
          sousTexte={coffre ? `mis à jour ${relatif(coffre.updatedAt)}` : "aucun mouvement"}
          icone="septim"
          tone="attente"
        />
        <Stat
          label="Valeur du stock"
          valeur={septims(coffre?.valeurStock ?? 0)}
          sousTexte={
            valeurStockReelle !== (coffre?.valeurStock ?? 0)
              ? `au cours du jour : ${septims(valeurStockReelle)}`
              : "à jour"
          }
          icone="stock"
          href="/economie/stocks"
        />
        <Stat
          label="Créances"
          valeur={septims(creances)}
          sousTexte={`${impayes._count} commande(s) impayée(s)`}
          icone="impaye"
          tone={creances > 0 ? "danger" : "succes"}
          href="/economie/impayes"
        />
        <Stat
          label="Patrimoine total"
          valeur={septims(solde + (coffre?.valeurStock ?? 0) + creances)}
          sousTexte="coffre + stock + créances"
          icone="commerce"
          tone="succes"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Carte
            titre="Évolution du coffre"
            sousTitre={`${mouvements.length} mouvement(s) consigné(s)`}
            icone="marche"
          >
            {courbe.length > 1 ? (
              <Courbe points={courbe} hauteur={230} libelle="tresorerie" couleur="#bd9c4d" />
            ) : (
              <Vide titre="Pas assez de mouvements" icone="marche" />
            )}
          </Carte>

          <Carte
            titre="Journal des mouvements"
            sousTitre="Chaque entrée et chaque sortie, avec son motif et son auteur"
            icone="registre"
            padding={false}
          >
            {mouvements.length === 0 ? (
              <Vide titre="Coffre vierge" icone="tresorerie" />
            ) : (
              <ul className="max-h-[620px] divide-y divide-argent-500/10 overflow-y-auto">
                {mouvements.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-full border ${
                        m.montant > 0
                          ? "border-succes/35 bg-succes/10 text-[#8fd0a3]"
                          : "border-danger/35 bg-danger/10 text-[#e69a8c]"
                      }`}
                    >
                      <Icone nom={m.montant > 0 ? "chevron" : "bas"} taille={13} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.85rem] text-givre-50">{m.motif}</span>
                      <span className="block truncate text-[0.68rem] text-givre-300/55">
                        {LIBELLES[m.categorie] ?? m.categorie} · {date(m.date)}
                        {m.user && (
                          <>
                            {" · "}
                            <Link href={`/membres/${m.user.id}`} className="hover:text-or-300">
                              {m.user.nomRp}
                            </Link>
                          </>
                        )}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span
                        className={`block text-[0.88rem] tabular-nums ${
                          m.montant > 0 ? "text-[#8fd0a3]" : "text-[#e69a8c]"
                        }`}
                      >
                        {m.montant > 0 ? "+" : ""}
                        {nombre(m.montant)} ⊙
                      </span>
                      <span className="block text-[0.66rem] tabular-nums text-givre-300/45">
                        solde {nombre(m.soldeApres)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Carte>
        </div>

        <div className="space-y-6">
          <Carte titre="Registre du coffre" icone="tresorerie">
            <Definitions
              colonnes={1}
              items={[
                ["Septims", <span key="s" className="titre-imperial text-lg text-or-200">{septims(solde)}</span>],
                ["Valeur estimée du stock", septims(coffre?.valeurStock ?? 0)],
                ["Dernière mise à jour", coffre ? dateHeure(coffre.updatedAt) : "—"],
                [
                  "Responsable",
                  responsable ? (
                    <Link href={`/membres/${responsable.id}`} className="text-or-300 hover:underline">
                      {responsable.nomRp}
                    </Link>
                  ) : (
                    "—"
                  ),
                ],
                ["Note", coffre?.note || "—"],
              ]}
            />
          </Carte>

          <Carte titre="30 derniers jours" icone="marche">
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[0.8rem] text-givre-300/70">Entrées</span>
                <span className="text-[0.95rem] tabular-nums text-[#8fd0a3]">+{nombre(entrees)} ⊙</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[0.8rem] text-givre-300/70">Sorties</span>
                <span className="text-[0.95rem] tabular-nums text-[#e69a8c]">{nombre(sorties)} ⊙</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-argent-500/12 pt-3">
                <span className="text-[0.8rem] text-givre-200">Solde de la période</span>
                <span
                  className={`titre-imperial text-[1.05rem] tabular-nums ${
                    entrees + sorties >= 0 ? "text-[#8fd0a3]" : "text-[#e69a8c]"
                  }`}
                >
                  {entrees + sorties >= 0 ? "+" : ""}
                  {nombre(entrees + sorties)} ⊙
                </span>
              </div>
            </div>
          </Carte>

          <Carte titre="Par catégorie" icone="commerce" padding={false}>
            <ul className="divide-y divide-argent-500/10">
              {[...parCategorie.entries()]
                .sort((a, b) => b[1].entrees + b[1].sorties - (a[1].entrees + a[1].sorties))
                .map(([cat, v]) => (
                  <li key={cat} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="flex-1 text-[0.8rem] text-givre-100">
                      {LIBELLES[cat] ?? cat}
                    </span>
                    <span className="text-[0.76rem] tabular-nums text-[#8fd0a3]">
                      +{nombre(v.entrees)}
                    </span>
                    <span className="text-[0.76rem] tabular-nums text-[#e69a8c]">
                      −{nombre(v.sorties)}
                    </span>
                  </li>
                ))}
            </ul>
          </Carte>

          {gere ? (
            <Carte
              titre="Consigner un mouvement"
              sousTitre="Entrée ou sortie du coffre commun"
              icone="plus"
            >
              <FormulaireTresorerie />
            </Carte>
          ) : (
            <Message tone="neutre" titre="Lecture seule" icone="tresorerie">
              Vous consultez la trésorerie. Seuls l'Intendant, les Hauts-Pères et les Patriarches
              peuvent la mouvementer.
            </Message>
          )}

          <Carte titre="Rappel du règlement" icone="reglement">
            <p className="recit text-[0.92rem] text-givre-200/80">
              « Les stocks, la trésorerie et les ateliers appartiennent à la Maison. Tout prélèvement
              se déclare et se consigne au registre. Servir aux communs sans l'inscrire est un vol,
              quel que soit le rang de celui qui prend. »
            </p>
            <p className="mt-2 text-right text-[0.7rem] text-or-400/70">Règlement, §VI</p>
          </Carte>
        </div>
      </div>
    </>
  );
}
