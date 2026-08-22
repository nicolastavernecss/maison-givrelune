import Link from "next/link";
import { Badge, Carte, Stat, Vide } from "@/components/ui/base";
import { Icone, iconeMetier } from "@/components/ui/Icone";
import { prisma } from "@/lib/db";
import { assurerRapports, journeeEnCours } from "@/lib/production";
import { date, nombre, septims } from "@/lib/format";

type Detail = {
  parMembre: { nom: string; nbCrafts: number; brut: number; taxe: number; net: number; benefice: number }[];
  parObjet: { label: string; quantite: number; brut: number }[];
};

function lireDetail(brut: string): Detail {
  try {
    const d = JSON.parse(brut || "{}");
    return { parMembre: d.parMembre ?? [], parObjet: d.parObjet ?? [] };
  } catch {
    return { parMembre: [], parObjet: [] };
  }
}

/**
 * Comptes rendus figés de production, journaliers et hebdomadaires.
 * Ils sont engendrés à la consultation pour les périodes révolues : aucune
 * tâche planifiée n'est nécessaire, le hub tourne partout.
 */
export async function ComptesRendus({
  periode = "jour",
  metierCle,
}: {
  periode?: string;
  metierCle?: string;
}) {
  await assurerRapports().catch((e) => console.error("[rapports]", e));

  const [metiers, enCours] = await Promise.all([
    prisma.metier.findMany({
      where: { isProducer: true },
      select: { id: true, key: true, label: true, category: true },
      orderBy: { position: "asc" },
    }),
    journeeEnCours(),
  ]);

  const metier = metierCle ? metiers.find((m) => m.key === metierCle) : undefined;

  const rapports = await prisma.rapport.findMany({
    where: {
      periode: periode === "semaine" ? "semaine" : "jour",
      metierId: metier ? metier.id : null,
    },
    include: { metier: { select: { label: true, key: true, category: true } } },
    orderBy: { debut: "desc" },
    take: 40,
  });

  // Les périodes totalement vides n'apprennent rien : on ne montre que ce qui a bougé.
  const utiles = rapports.filter((r) => r.nbCrafts > 0);

  const lien = (p: { periode?: string; metier?: string }) => {
    const u = new URLSearchParams();
    const v = { periode, metier: metierCle, ...p };
    for (const [k, val] of Object.entries(v)) if (val) u.set(k, val);
    const q = u.toString();
    return `/gouvernance/archives${q ? `?${q}` : ""}#rapports`;
  };

  return (
    <Carte
      titre="Comptes rendus de production"
      sousTitre="Figés chaque soir et chaque semaine, par atelier"
      icone="archive"
      padding={false}
    >
      <div id="rapports" className="scroll-mt-20 border-b border-argent-500/12 px-4 py-3">
        {/* Période */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.74rem] text-givre-300/60">Période :</span>
          {[
            { cle: "jour", label: "Journaliers" },
            { cle: "semaine", label: "Hebdomadaires" },
          ].map((p) => (
            <Link
              key={p.cle}
              href={lien({ periode: p.cle })}
              className={`rounded-full border px-3 py-1 text-[0.72rem] transition-colors ${
                periode === p.cle
                  ? "border-or-500/50 bg-or-500/12 text-or-200"
                  : "border-argent-500/20 text-givre-300/70 hover:border-or-500/30"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>

        {/* Atelier */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="text-[0.74rem] text-givre-300/60">Atelier :</span>
          <Link
            href={lien({ metier: undefined })}
            className={`rounded-full border px-3 py-1 text-[0.72rem] transition-colors ${
              !metierCle
                ? "border-or-500/50 bg-or-500/12 text-or-200"
                : "border-argent-500/20 text-givre-300/70 hover:border-or-500/30"
            }`}
          >
            Toute la Maison
          </Link>
          {metiers.map((m) => (
            <Link
              key={m.id}
              href={lien({ metier: m.key })}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.72rem] transition-colors ${
                metierCle === m.key
                  ? "border-or-500/50 bg-or-500/12 text-or-200"
                  : "border-argent-500/20 text-givre-300/70 hover:border-or-500/30"
              }`}
            >
              <Icone nom={iconeMetier(m.key, m.category)} taille={11} />
              {m.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Journée en cours, pas encore figée */}
      {enCours.nbCrafts > 0 && !metierCle && (
        <div className="border-b border-or-600/25 bg-or-500/6 px-4 py-3">
          <p className="mb-2 flex items-center gap-2 text-[0.78rem] text-or-200">
            <Icone nom="horloge" taille={13} />
            Journée en cours — sera figée ce soir
          </p>
          <div className="grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-5">
            {[
              ["Fabrications", nombre(enCours.nbCrafts)],
              ["Brut", septims(enCours.brut)],
              ["Taxe", septims(enCours.taxe)],
              ["Net", septims(enCours.net)],
              ["Bénéfice", septims(enCours.benefice)],
            ].map(([l, v]) => (
              <div key={l}>
                <p className="text-[0.56rem] tracking-[0.16em] text-givre-300/45 uppercase">{l}</p>
                <p className="text-[0.88rem] tabular-nums text-givre-50">{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {utiles.length === 0 ? (
        <Vide
          titre="Aucun compte rendu"
          icone="archive"
          texte="Les comptes rendus se figent automatiquement dès qu'une journée ou une semaine de production est écoulée."
        />
      ) : (
        <ul className="divide-y divide-argent-500/10">
          {utiles.map((r) => {
            const d = lireDetail(r.details);
            return (
              <li key={r.id}>
                <details className="group">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors hover:bg-nuit-700/30">
                    <span className="min-w-[150px] flex-1">
                      <span className="block text-[0.86rem] text-givre-50">
                        {r.periode === "jour"
                          ? date(r.debut)
                          : `Semaine du ${date(r.debut)}`}
                      </span>
                      <span className="block text-[0.7rem] text-givre-300/55">
                        {r.metier?.label ?? "Toute la Maison"} · {r.nbCrafts} fabrication(s) ·{" "}
                        {r.nbArtisans} artisan(s)
                      </span>
                    </span>

                    <span className="w-24 text-right">
                      <span className="block text-[0.56rem] tracking-[0.14em] text-givre-300/45 uppercase">
                        Brut
                      </span>
                      <span className="block text-[0.84rem] tabular-nums text-givre-100">
                        {septims(r.revenuBrut)}
                      </span>
                    </span>
                    <span className="w-24 text-right">
                      <span className="block text-[0.56rem] tracking-[0.14em] text-givre-300/45 uppercase">
                        Taxe
                      </span>
                      <span className="block text-[0.84rem] tabular-nums text-[#e69a8c]">
                        {septims(r.taxe)}
                      </span>
                    </span>
                    <span className="w-24 text-right">
                      <span className="block text-[0.56rem] tracking-[0.14em] text-or-400/70 uppercase">
                        Net
                      </span>
                      <span className="block text-[0.84rem] tabular-nums text-or-200">
                        {septims(r.revenuNet)}
                      </span>
                    </span>
                    <span className="w-24 text-right">
                      <span className="block text-[0.56rem] tracking-[0.14em] text-givre-300/45 uppercase">
                        Bénéfice
                      </span>
                      <span
                        className={`block text-[0.84rem] tabular-nums ${
                          r.benefice >= 0 ? "text-[#8fd0a3]" : "text-[#e69a8c]"
                        }`}
                      >
                        {r.benefice >= 0 ? "+" : ""}
                        {septims(r.benefice)}
                      </span>
                    </span>

                    <Icone
                      nom="bas"
                      taille={14}
                      className="shrink-0 text-givre-300/45 transition-transform group-open:rotate-180"
                    />
                  </summary>

                  <div className="grid gap-5 border-t border-argent-500/10 bg-nuit-950/30 px-4 py-3.5 lg:grid-cols-2">
                    <div>
                      <p className="sur-titre !text-[0.58rem] mb-2">Par artisan</p>
                      {d.parMembre.length === 0 ? (
                        <p className="text-[0.74rem] text-givre-300/40">—</p>
                      ) : (
                        <ul className="space-y-1">
                          {d.parMembre.map((m) => (
                            <li
                              key={m.nom}
                              className="flex items-center gap-3 text-[0.76rem] text-givre-200/85"
                            >
                              <span className="flex-1 truncate">{m.nom}</span>
                              <span className="text-givre-300/50">{m.nbCrafts}×</span>
                              <span className="w-20 text-right tabular-nums text-givre-100">
                                {septims(m.brut)}
                              </span>
                              <span className="w-20 text-right tabular-nums text-or-200">
                                {septims(m.net)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <p className="sur-titre !text-[0.58rem] mb-2">Par objet</p>
                      {d.parObjet.length === 0 ? (
                        <p className="text-[0.74rem] text-givre-300/40">—</p>
                      ) : (
                        <ul className="space-y-1">
                          {d.parObjet.slice(0, 12).map((o) => (
                            <li
                              key={o.label}
                              className="flex items-center gap-3 text-[0.76rem] text-givre-200/85"
                            >
                              <span className="flex-1 truncate">{o.label}</span>
                              <span className="text-givre-300/50">×{nombre(o.quantite)}</span>
                              <span className="w-20 text-right tabular-nums text-givre-100">
                                {septims(o.brut)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <p className="text-[0.7rem] text-givre-300/45 lg:col-span-2">
                      Coût matière imputé : {septims(r.coutMatiere)} · période du{" "}
                      {date(r.debut)} au {date(new Date(r.fin.getTime() - 1))}
                    </p>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </Carte>
  );
}

/** Bandeau de chiffres pour l'en-tête des Archives. */
export async function ChiffresProduction() {
  const [total, aujourdhui] = await Promise.all([
    prisma.productionEntry.aggregate({
      _sum: { revenuBrut: true, taxe: true, revenuNet: true },
      _count: true,
    }),
    journeeEnCours(),
  ]);

  return (
    <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="Fabrications consignées" valeur={nombre(total._count)} icone="atelier" />
      <Stat
        label="Revenu brut cumulé"
        valeur={septims(total._sum.revenuBrut ?? 0)}
        icone="septim"
      />
      <Stat
        label="Taxe versée à la Maison"
        valeur={septims(total._sum.taxe ?? 0)}
        icone="tresorerie"
        tone="attente"
        href="/economie/tresorerie"
      />
      <Stat
        label="Aujourd'hui"
        valeur={septims(aujourdhui.brut)}
        sousTexte={`${aujourdhui.nbCrafts} fabrication(s)`}
        icone="horloge"
        tone={aujourdhui.nbCrafts ? "succes" : "neutre"}
      />
    </section>
  );
}
