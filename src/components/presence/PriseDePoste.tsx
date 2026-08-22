"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { actionEtatPoste, actionFinPoste, actionPrisePoste } from "@/app/actions/vie";
import { Icone } from "@/components/ui/Icone";
import { ETATS_POSTE, DUREE_MAX_POSTE_H } from "@/lib/domain";

/** Compteur de durée, rafraîchi côté client — le serveur ne renvoie que l'heure de début. */
function duree(debutIso: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(debutIso).getTime()) / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

export function PriseDePoste({
  poste,
  nomRp,
  nbPresents,
}: {
  poste: { debutLe: string; etat: string } | null;
  nomRp: string;
  nbPresents: number;
}) {
  const [tic, setTic] = useState(0);

  useEffect(() => {
    if (!poste) return;
    const t = setInterval(() => setTic((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, [poste]);

  const etatCourant = ETATS_POSTE.find((e) => e.value === poste?.etat) ?? ETATS_POSTE[0];

  if (!poste) {
    return (
      <section className="carte carte-texture relative mb-6 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(560px 220px at 12% 0%, rgba(42,61,99,0.6), transparent 70%), radial-gradient(360px 200px at 92% 100%, rgba(95,143,106,0.12), transparent 70%)",
          }}
        />
        <div className="relative flex flex-wrap items-center gap-6 px-5 py-6 sm:px-7">
          <span className="grid size-14 shrink-0 place-items-center rounded-full border border-argent-500/25 bg-nuit-950/50 text-givre-300/50">
            <Icone nom="lune" taille={24} epaisseur={1.2} />
          </span>

          <div className="min-w-[220px] flex-1">
            <p className="sur-titre">Vous n'êtes pas en poste</p>
            <h2 className="titre-imperial mt-1 text-xl text-givre-50">
              Prenez votre poste, {nomRp}
            </h2>
            <p className="mt-1.5 text-[0.82rem] text-givre-300/70">
              Déclarez-vous en jeu : la Maison saura qu'elle peut compter sur vous, et les gradés
              pourront vous appeler sur une ronde.
              {nbPresents > 0 && (
                <>
                  {" "}
                  <span className="text-[#8fd0a3]">
                    {nbPresents} membre{nbPresents > 1 ? "s sont" : " est"} déjà là.
                  </span>
                </>
              )}
            </p>
          </div>

          <form action={actionPrisePoste} className="flex flex-wrap gap-2">
            <input type="hidden" name="etat" value="disponible" />
            <button
              type="submit"
              className="inline-flex items-center gap-2.5 rounded-[2px] border border-or-300/50 bg-gradient-to-b from-or-400 to-or-600 px-5 py-2.5 text-[0.9rem] font-semibold text-nuit-950 shadow-[0_8px_24px_-12px_rgba(210,184,115,0.9)] transition-all hover:from-or-300 hover:to-or-500"
            >
              <Icone nom="valider" taille={17} />
              Je prends mon poste
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="carte carte-texture relative mb-6 overflow-hidden border-succes/30">
      <span
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(95,158,115,0.8), transparent)" }}
      />
      <div className="relative flex flex-wrap items-center gap-x-6 gap-y-4 px-5 py-5 sm:px-7">
        <span className="relative grid size-14 shrink-0 place-items-center rounded-full border border-succes/45 bg-succes/10 text-[#8fd0a3]">
          <Icone nom={etatCourant.icone} taille={24} epaisseur={1.3} />
          <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-nuit-900 bg-succes" />
        </span>

        <div className="min-w-[200px] flex-1">
          <p className="sur-titre !text-[#8fd0a3]">Vous êtes en poste</p>
          <h2 className="titre-imperial mt-1 flex flex-wrap items-baseline gap-x-3 text-xl text-givre-50">
            {nomRp}
            <span key={tic} className="text-[0.95rem] font-normal tabular-nums text-givre-300/70">
              depuis {duree(poste.debutLe)}
            </span>
          </h2>
          <p className="mt-1 text-[0.78rem] text-givre-300/55">
            {etatCourant.aide} Le poste se referme tout seul au bout de {DUREE_MAX_POSTE_H} h.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {ETATS_POSTE.map((e) => (
            <form key={e.value} action={actionEtatPoste}>
              <input type="hidden" name="etat" value={e.value} />
              <button
                type="submit"
                title={e.aide}
                className={`inline-flex items-center gap-1.5 rounded-[2px] border px-2.5 py-1.5 text-[0.76rem] transition-colors ${
                  poste.etat === e.value
                    ? e.tone === "succes"
                      ? "border-succes/50 bg-succes/16 text-[#8fd0a3]"
                      : e.tone === "actif"
                        ? "border-actif/50 bg-actif/16 text-[#93bfe4]"
                        : "border-attente/50 bg-attente/16 text-[#e3c47c]"
                    : "border-argent-500/22 text-givre-300/70 hover:border-or-500/35 hover:text-givre-100"
                }`}
              >
                <Icone nom={e.icone} taille={13} />
                {e.label}
              </button>
            </form>
          ))}

          <form action={actionFinPoste}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-[2px] border border-danger/35 px-3 py-1.5 text-[0.76rem] text-[#e69a8c] transition-colors hover:bg-danger/15"
            >
              <Icone nom="sortie" taille={13} />
              Je quitte mon poste
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

/**
 * Rafraîchit le tableau tout seul : une liste de présents périmée ne sert à rien.
 * Se met en pause quand l'onglet est en arrière-plan, pour ne pas interroger
 * le serveur dans le vide.
 */
export function RafraichirPresence({ secondes = 45 }: { secondes?: number }) {
  const router = useRouter();

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, secondes * 1000);

    const auRetour = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", auRetour);

    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", auRetour);
    };
  }, [router, secondes]);

  return null;
}
