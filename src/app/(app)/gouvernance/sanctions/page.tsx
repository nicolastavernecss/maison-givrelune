import Link from "next/link";
import type { Metadata } from "next";
import { Avatar, BadgeStatut, Carte, EnTetePage, Stat, Vide } from "@/components/ui/base";
import { Icone } from "@/components/ui/Icone";
import { ActionLigne } from "@/components/ui/form";
import { actionSanction } from "@/app/actions/gouvernance";
import { exigerDroit } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PERMISSIONS as P, SANCTION_TYPES } from "@/lib/domain";
import { date, relatif } from "@/lib/format";

export const metadata: Metadata = { title: "Sanctions" };
export const dynamic = "force-dynamic";

export default async function Sanctions() {
  await exigerDroit(P.ADMIN_SANCTIONS);

  const [sanctions, membres] = await Promise.all([
    prisma.sanction.findMany({
      orderBy: { date: "desc" },
      include: {
        user: { select: { id: true, nomRp: true, avatarUrl: true, rank: { select: { label: true } } } },
        decidePar: { select: { id: true, nomRp: true } },
      },
    }),
    prisma.user.findMany({
      where: { status: { not: "archive" } },
      select: { id: true, nomRp: true },
      orderBy: { nomRp: "asc" },
    }),
  ]);

  const actives = sanctions.filter((s) => s.statut === "active");

  return (
    <>
      <EnTetePage
        surTitre="Règlement §VIII — privé"
        titre="Discipline & sanctions"
        icone="sanction"
        texte="Avertissement, rétrogradation, exclusion temporaire ou bannissement, selon la gravité et la récidive. Toute sanction est motivée et consignée."
      />

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Sanctions actives"
          valeur={actives.length}
          icone="sanction"
          tone={actives.length ? "danger" : "succes"}
        />
        <Stat label="Total prononcées" valeur={sanctions.length} icone="registre" />
        <Stat
          label="Avertissements"
          valeur={sanctions.filter((s) => s.type === "avertissement").length}
          icone="alerte"
          tone="attente"
        />
        <Stat
          label="Bannissements"
          valeur={sanctions.filter((s) => s.type === "bannissement").length}
          icone="refuser"
          tone="danger"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Carte titre="Registre disciplinaire" icone="registre" padding={false}>
          {sanctions.length === 0 ? (
            <Vide
              titre="Registre vierge"
              icone="valider"
              texte="Aucune sanction n'a été prononcée. La Maison se tient bien."
            />
          ) : (
            <ul className="divide-y divide-argent-500/10">
              {sanctions.map((s) => (
                <li key={s.id} className="flex flex-wrap items-start gap-x-4 gap-y-2 px-4 py-3.5">
                  <Avatar nom={s.user.nomRp} url={s.user.avatarUrl} taille={34} />
                  <div className="min-w-[180px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/membres/${s.user.id}`}
                        className="text-[0.88rem] text-givre-50 hover:text-or-300"
                      >
                        {s.user.nomRp}
                      </Link>
                      <span className="rounded-full border border-danger/35 bg-danger/10 px-2 py-px text-[0.64rem] text-[#e69a8c]">
                        {SANCTION_TYPES.find((t) => t.value === s.type)?.label ?? s.type}
                      </span>
                      <BadgeStatut famille="sanction" valeur={s.statut} />
                    </div>
                    <p className="mt-1 text-[0.8rem] text-givre-200/80">{s.motif}</p>
                    <p className="mt-1 text-[0.7rem] text-givre-300/50">
                      {date(s.date)} · {relatif(s.date)}
                      {s.finLe && ` · jusqu'au ${date(s.finLe)}`}
                      {s.decidePar && (
                        <>
                          {" · décidée par "}
                          <Link href={`/membres/${s.decidePar.id}`} className="hover:text-or-300">
                            {s.decidePar.nomRp}
                          </Link>
                        </>
                      )}
                    </p>
                  </div>

                  {s.statut === "active" && (
                    <div className="flex shrink-0 gap-1.5">
                      <form action={actionSanction}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="statut" value="levee" />
                        <ActionLigne icone="valider" ton="succes">
                          Lever
                        </ActionLigne>
                      </form>
                      <form action={actionSanction}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="statut" value="expiree" />
                        <ActionLigne icone="horloge">Expirer</ActionLigne>
                      </form>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Carte>

        <div className="space-y-6">
          <Carte titre="Prononcer une sanction" icone="sanction">
            <form action={actionSanction} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[0.72rem] font-medium text-givre-200/85">
                  Membre <span className="text-or-400">*</span>
                </span>
                <select name="userId" required className="champ">
                  <option value="">— Choisir —</option>
                  {membres.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nomRp}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[0.72rem] font-medium text-givre-200/85">
                  Type <span className="text-or-400">*</span>
                </span>
                <select name="type" required className="champ" defaultValue="avertissement">
                  {SANCTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[0.72rem] font-medium text-givre-200/85">
                  Fin de la sanction
                </span>
                <input type="date" name="finLe" className="champ" />
                <span className="mt-1 block text-[0.68rem] text-givre-300/55">
                  Pour une exclusion temporaire. Vide sinon.
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[0.72rem] font-medium text-givre-200/85">
                  Motif <span className="text-or-400">*</span>
                </span>
                <textarea name="motif" required rows={3} maxLength={1000} className="champ resize-y" />
              </label>

              <div className="flex justify-end border-t border-argent-500/12 pt-4">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-[2px] border border-danger/40 bg-danger/15 px-3.5 py-1.5 text-[0.82rem] text-[#e69a8c] transition-colors hover:bg-danger/25"
                >
                  <Icone nom="sanction" taille={15} />
                  Prononcer
                </button>
              </div>
            </form>
          </Carte>

          <Carte titre="Rappel du règlement" icone="reglement">
            <p className="recit text-[0.92rem] text-givre-200/80">
              « Les manquements sont sanctionnés par avertissement, rétrogradation, exclusion
              temporaire ou bannissement, selon la gravité et la récidive. La décision revient aux
              Patriarches, assistés du Sénéchal. Toute sanction est motivée et consignée. »
            </p>
            <p className="mt-2 text-right text-[0.7rem] text-or-400/70">Règlement, §VIII</p>
          </Carte>
        </div>
      </div>
    </>
  );
}
