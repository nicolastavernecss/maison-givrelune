import Link from "next/link";
import { Avatar, Badge, Carte, Message, Stat, Vide } from "@/components/ui/base";
import { Icone } from "@/components/ui/Icone";
import { Tableau } from "@/components/ui/Tableau";
import { prisma } from "@/lib/db";
import { TAUX_TAXE } from "@/lib/domain";
import { totaliser, type Totaux } from "@/lib/production";
import { date, dateHeure, nombre, pourcentage, relatif, septims } from "@/lib/format";

const PERIODES = [
  { cle: "jour", label: "Aujourd'hui", jours: 1 },
  { cle: "semaine", label: "7 jours", jours: 7 },
  { cle: "mois", label: "30 jours", jours: 30 },
  { cle: "tout", label: "Depuis le début", jours: 0 },
];

function LigneTotaux({ t, titre }: { t: Totaux; titre?: string }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-5">
      {titre && (
        <p className="col-span-2 text-[0.78rem] text-givre-200/85 sm:col-span-5">{titre}</p>
      )}
      <div>
        <p className="text-[0.58rem] tracking-[0.16em] text-givre-300/45 uppercase">Revenu brut</p>
        <p className="titre-imperial mt-0.5 text-[1.05rem] tabular-nums text-givre-50">
          {septims(t.brut)}
        </p>
      </div>
      <div>
        <p className="text-[0.58rem] tracking-[0.16em] text-givre-300/45 uppercase">
          Taxe {pourcentage(TAUX_TAXE * 100)}
        </p>
        <p className="mt-0.5 text-[1.05rem] tabular-nums text-[#e69a8c]">−{septims(t.taxe)}</p>
      </div>
      <div>
        <p className="text-[0.58rem] tracking-[0.16em] text-or-400/70 uppercase">Revenu net</p>
        <p className="titre-imperial mt-0.5 text-[1.05rem] tabular-nums text-or-200">
          {septims(t.net)}
        </p>
      </div>
      <div>
        <p className="text-[0.58rem] tracking-[0.16em] text-givre-300/45 uppercase">Coût matière</p>
        <p className="mt-0.5 text-[1.05rem] tabular-nums text-givre-300/80">
          −{septims(Math.round(t.cout))}
        </p>
      </div>
      <div>
        <p className="text-[0.58rem] tracking-[0.16em] text-givre-300/45 uppercase">Bénéfice</p>
        <p
          className={`titre-imperial mt-0.5 text-[1.05rem] tabular-nums ${
            t.benefice >= 0 ? "text-[#8fd0a3]" : "text-[#e69a8c]"
          }`}
        >
          {t.benefice >= 0 ? "+" : ""}
          {septims(t.benefice)}
        </p>
      </div>
    </div>
  );
}

export async function VueRevenus({
  metier,
  membreId,
  voitTout,
  periode,
  lien,
}: {
  metier: { id: string; key: string; label: string };
  membreId: string;
  voitTout: boolean;
  periode: string;
  lien: (p: Record<string, string | undefined>) => string;
}) {
  const def = PERIODES.find((p) => p.cle === periode) ?? PERIODES[1];
  const depuis =
    def.jours > 0
      ? def.cle === "jour"
        ? new Date(new Date().setHours(0, 0, 0, 0))
        : new Date(Date.now() - def.jours * 86_400_000)
      : new Date(0);

  const lignes = await prisma.productionEntry.findMany({
    where: { metierId: metier.id, createdAt: { gte: depuis } },
    include: {
      user: { select: { id: true, nomRp: true, avatarUrl: true } },
      material: { select: { label: true, unit: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 400,
  });

  const miennes = lignes.filter((l) => l.userId === membreId);
  const mesTotaux = totaliser(miennes);
  const totauxMaison = totaliser(lignes);

  // Ventilation par membre — réservée aux gradés.
  const parMembre = new Map<
    string,
    { nom: string; id: string; avatar: string; totaux: Totaux }
  >();
  if (voitTout) {
    for (const l of lignes) {
      const e = parMembre.get(l.userId) ?? {
        nom: l.user.nomRp,
        id: l.userId,
        avatar: l.user.avatarUrl,
        totaux: { nbCrafts: 0, quantite: 0, brut: 0, taxe: 0, net: 0, cout: 0, benefice: 0 },
      };
      e.totaux.nbCrafts++;
      e.totaux.quantite += l.quantite;
      e.totaux.brut += l.revenuBrut;
      e.totaux.taxe += l.taxe;
      e.totaux.net += l.revenuNet;
      e.totaux.cout += l.coutMatiere;
      e.totaux.benefice += l.benefice;
      parMembre.set(l.userId, e);
    }
  }
  const classement = [...parMembre.values()].sort((a, b) => b.totaux.brut - a.totaux.brut);

  const affichees = voitTout ? lignes : miennes;

  return (
    <>
      {/* Période */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-[0.76rem] text-givre-300/60">Période :</span>
        {PERIODES.map((p) => (
          <Link
            key={p.cle}
            href={lien({ periode: p.cle })}
            className={`rounded-full border px-3 py-1 text-[0.72rem] transition-colors ${
              def.cle === p.cle
                ? "border-or-500/50 bg-or-500/12 text-or-200"
                : "border-argent-500/20 text-givre-300/70 hover:border-or-500/30"
            }`}
          >
            {p.label}
          </Link>
        ))}
        <span className="ml-auto text-[0.7rem] text-givre-300/45">
          Taxe de la Maison : {pourcentage(TAUX_TAXE * 100)} du brut, versée au coffre à chaque
          fabrication
        </span>
      </div>

      {/* Mes chiffres */}
      <Carte
        titre="Mes chiffres"
        sousTitre={`${mesTotaux.nbCrafts} fabrication(s) — ${metier.label}`}
        icone="septim"
        className="mb-5"
      >
        {mesTotaux.nbCrafts === 0 ? (
          <p className="text-[0.82rem] text-givre-300/60">
            Vous n'avez rien fabriqué dans cet atelier sur la période. Le revenu se compte à chaque
            clic sur « Fabriquer ».
          </p>
        ) : (
          <LigneTotaux t={mesTotaux} />
        )}
      </Carte>

      {/* Total de l'atelier — gradés */}
      {voitTout && (
        <>
          <Carte
            titre={`Total de l'atelier — ${metier.label}`}
            sousTitre={`${classement.length} artisan(s), ${totauxMaison.nbCrafts} fabrication(s)`}
            icone="commerce"
            className="mb-5"
          >
            <LigneTotaux t={totauxMaison} />
            <div className="mt-4 border-t border-argent-500/12 pt-3 text-[0.76rem] text-givre-300/70">
              La Maison a encaissé{" "}
              <span className="text-or-200">{septims(totauxMaison.taxe)}</span> de taxe d'atelier sur
              la période — visible au{" "}
              <Link href="/economie/tresorerie" className="text-or-300 hover:underline">
                journal de trésorerie
              </Link>
              .
            </div>
          </Carte>

          {classement.length > 0 && (
            <Carte
              titre="Par artisan"
              sousTitre="Qui produit quoi, et ce que chacun rapporte à la Maison"
              icone="membres"
              padding={false}
              className="mb-5"
            >
              <div className="overflow-x-auto">
                <table className="tableau">
                  <thead>
                    <tr>
                      <th>Artisan</th>
                      <th className="!text-right">Fabrications</th>
                      <th className="!text-right">Brut</th>
                      <th className="!text-right">Taxe versée</th>
                      <th className="!text-right">Net</th>
                      <th className="!text-right">Bénéfice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classement.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <span className="flex items-center gap-2.5">
                            <Avatar nom={c.nom} url={c.avatar} taille={24} />
                            <Link
                              href={`/membres/${c.id}`}
                              className="text-givre-50 transition-colors hover:text-or-300"
                            >
                              {c.nom}
                            </Link>
                            {c.id === membreId && <Badge tone="attente">vous</Badge>}
                          </span>
                        </td>
                        <td className="text-right tabular-nums">{c.totaux.nbCrafts}</td>
                        <td className="text-right tabular-nums text-givre-100">
                          {septims(c.totaux.brut)}
                        </td>
                        <td className="text-right tabular-nums text-[#e69a8c]">
                          {septims(c.totaux.taxe)}
                        </td>
                        <td className="text-right tabular-nums text-or-200">
                          {septims(c.totaux.net)}
                        </td>
                        <td
                          className={`text-right tabular-nums ${
                            c.totaux.benefice >= 0 ? "text-[#8fd0a3]" : "text-[#e69a8c]"
                          }`}
                        >
                          {c.totaux.benefice >= 0 ? "+" : ""}
                          {septims(c.totaux.benefice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Carte>
          )}
        </>
      )}

      {/* Détail des fabrications */}
      <Carte
        titre={voitTout ? "Détail des fabrications" : "Mes fabrications"}
        sousTitre={`${affichees.length} ligne(s) sur la période`}
        icone="registre"
        padding={false}
      >
        <Tableau
          donnees={affichees}
          cle={(l) => l.id}
          vide="Aucune fabrication"
          videIcone="atelier"
          videTexte="Les fabrications apparaissent ici dès le premier clic sur « Fabriquer »."
          colonnes={[
            {
              cle: "objet",
              entete: "Objet produit",
              principal: true,
              rendu: (l) => (
                <span>
                  <span className="text-givre-50">
                    {nombre(l.quantite)} × {l.material.label}
                  </span>
                  {l.source === "maison" && (
                    <span className="ml-1.5 text-[0.66rem] text-givre-300/45">
                      (stock commun)
                    </span>
                  )}
                </span>
              ),
            },
            ...(voitTout
              ? [
                  {
                    cle: "artisan",
                    entete: "Artisan",
                    rendu: (l: (typeof affichees)[number]) => (
                      <Link href={`/membres/${l.userId}`} className="hover:text-or-300">
                        {l.user.nomRp}
                      </Link>
                    ),
                  },
                ]
              : []),
            {
              cle: "pu",
              entete: "Prix unitaire",
              numerique: true,
              masquerMobile: true,
              rendu: (l) => septims(l.prixUnitaire),
            },
            {
              cle: "brut",
              entete: "Brut",
              numerique: true,
              rendu: (l) => <span className="text-givre-100">{septims(l.revenuBrut)}</span>,
            },
            {
              cle: "taxe",
              entete: "Taxe",
              numerique: true,
              rendu: (l) => <span className="text-[#e69a8c]">−{septims(l.taxe)}</span>,
            },
            {
              cle: "net",
              entete: "Net",
              numerique: true,
              rendu: (l) => <span className="text-or-200">{septims(l.revenuNet)}</span>,
            },
            {
              cle: "benef",
              entete: "Bénéfice",
              numerique: true,
              masquerMobile: true,
              rendu: (l) => (
                <span className={l.benefice >= 0 ? "text-[#8fd0a3]" : "text-[#e69a8c]"}>
                  {l.benefice >= 0 ? "+" : ""}
                  {septims(l.benefice)}
                </span>
              ),
            },
            {
              cle: "date",
              entete: "Quand",
              masquerMobile: true,
              rendu: (l) => (
                <span className="text-[0.74rem] text-givre-300/55" title={dateHeure(l.createdAt)}>
                  {relatif(l.createdAt)}
                </span>
              ),
            },
          ]}
        />
      </Carte>

      {!voitTout && (
        <div className="mt-5">
          <Message tone="neutre" icone="senechal">
            Vous voyez vos propres chiffres. Les Patriarches, le Sénéchal et l'Intendant voient le
            total de tous les artisans de l'atelier.
          </Message>
        </div>
      )}

      <p className="mt-5 flex items-start gap-2 text-[0.72rem] text-givre-300/45">
        <Icone nom="archive" taille={13} className="mt-0.5" />
        Un compte rendu est figé chaque soir et chaque semaine, puis versé aux{" "}
        <Link href="/gouvernance/archives" className="text-or-300 hover:underline">
          Archives
        </Link>{" "}
        — depuis le {date(depuis.getTime() === 0 ? new Date() : depuis)} pour la période affichée.
      </p>
    </>
  );
}
