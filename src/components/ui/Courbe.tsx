"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type Point = { t: number; v: number; note?: string };

/**
 * Courbe du cours du marché — tracé SVG maison, sans librairie.
 * Aire dégradée, repères min/max, guide et infobulle au survol.
 */
export function Courbe({
  points,
  hauteur = 220,
  couleur = "#d2b873",
  unite = "⊙",
  libelle,
}: {
  points: Point[];
  hauteur?: number;
  couleur?: string;
  unite?: string;
  libelle?: string;
}) {
  const conteneur = useRef<HTMLDivElement>(null);
  const [largeur, setLargeur] = useState(720);
  const [survol, setSurvol] = useState<number | null>(null);

  useEffect(() => {
    const el = conteneur.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setLargeur(Math.max(280, e.contentRect.width)));
    ro.observe(el);
    setLargeur(Math.max(280, el.clientWidth));
    return () => ro.disconnect();
  }, []);

  const tries = useMemo(() => [...points].sort((a, b) => a.t - b.t), [points]);

  const geo = useMemo(() => {
    if (tries.length === 0) return null;
    const mgG = 52;
    const mgD = 12;
    const mgH = 14;
    const mgB = 26;
    const w = largeur - mgG - mgD;
    const h = hauteur - mgH - mgB;

    const vs = tries.map((p) => p.v);
    let min = Math.min(...vs);
    let max = Math.max(...vs);
    if (min === max) {
      min = min * 0.9;
      max = max * 1.1 || 1;
    }
    const marge = (max - min) * 0.12;
    min = Math.max(0, min - marge);
    max = max + marge;

    const t0 = tries[0].t;
    const t1 = tries[tries.length - 1].t;
    const spanT = t1 - t0 || 1;

    const x = (t: number) => mgG + ((t - t0) / spanT) * w;
    const y = (v: number) => mgH + h - ((v - min) / (max - min)) * h;

    const coords = tries.map((p) => ({ ...p, x: x(p.t), y: y(p.v) }));

    // Courbe lissée (Catmull-Rom → Bézier) pour un tracé net et calme
    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i - 1] ?? coords[i];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2] ?? p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    const aire = `${d} L ${coords[coords.length - 1].x} ${mgH + h} L ${coords[0].x} ${mgH + h} Z`;

    const ticks = Array.from({ length: 4 }, (_, i) => {
      const v = min + ((max - min) * i) / 3;
      return { v, y: y(v) };
    });

    const iMin = vs.indexOf(Math.min(...vs));
    const iMax = vs.indexOf(Math.max(...vs));

    return { coords, d, aire, ticks, mgG, mgH, h, w, iMin, iMax };
  }, [tries, largeur, hauteur]);

  const fmtV = (v: number) =>
    v >= 1000 ? `${(v / 1000).toFixed(1).replace(".", ",")} k` : String(Math.round(v * 10) / 10).replace(".", ",");
  const fmtD = (t: number) =>
    new Date(t).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

  if (!geo) {
    return (
      <div
        ref={conteneur}
        className="grid place-items-center text-xs text-givre-300/50"
        style={{ height: hauteur }}
      >
        Aucun relevé pour le moment.
      </div>
    );
  }

  const actif = survol !== null ? geo.coords[survol] : null;
  const id = `courbe-${libelle?.replace(/\W/g, "") ?? "x"}`;

  return (
    <div ref={conteneur} className="relative w-full select-none">
      <svg
        width={largeur}
        height={hauteur}
        className="overflow-visible"
        onMouseLeave={() => setSurvol(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mx = e.clientX - rect.left;
          let proche = 0;
          let dist = Infinity;
          geo.coords.forEach((c, i) => {
            const dd = Math.abs(c.x - mx);
            if (dd < dist) {
              dist = dd;
              proche = i;
            }
          });
          setSurvol(proche);
        }}
      >
        <defs>
          <linearGradient id={`${id}-aire`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={couleur} stopOpacity="0.32" />
            <stop offset="100%" stopColor={couleur} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grille */}
        {geo.ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={geo.mgG}
              y1={t.y}
              x2={geo.mgG + geo.w}
              y2={t.y}
              stroke="currentColor"
              className="text-argent-500"
              strokeOpacity={i === 0 ? 0.22 : 0.1}
              strokeDasharray={i === 0 ? undefined : "3 5"}
            />
            <text
              x={geo.mgG - 8}
              y={t.y + 3.5}
              textAnchor="end"
              className="fill-current text-argent-400"
              style={{ fontSize: 10, fontVariantNumeric: "tabular-nums" }}
            >
              {fmtV(t.v)}
            </text>
          </g>
        ))}

        {/* Aire + courbe */}
        <path d={geo.aire} fill={`url(#${id}-aire)`} />
        <path
          d={geo.d}
          fill="none"
          stroke={couleur}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Repères min / max */}
        {[geo.iMin, geo.iMax].map((idx, k) =>
          geo.coords[idx] ? (
            <circle
              key={k}
              cx={geo.coords[idx].x}
              cy={geo.coords[idx].y}
              r={3}
              fill="#080d18"
              stroke={k === 0 ? "#5f9e73" : "#bf5a4c"}
              strokeWidth={1.6}
            />
          ) : null,
        )}

        {/* Points */}
        {geo.coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={1.9} fill={couleur} opacity={0.55} />
        ))}

        {/* Dates */}
        {[0, Math.floor(geo.coords.length / 2), geo.coords.length - 1]
          .filter((v, i, a) => a.indexOf(v) === i)
          .map((i) => (
            <text
              key={i}
              x={Math.min(Math.max(geo.coords[i].x, geo.mgG + 14), geo.mgG + geo.w - 14)}
              y={hauteur - 8}
              textAnchor="middle"
              className="fill-current text-argent-400"
              style={{ fontSize: 10 }}
            >
              {fmtD(geo.coords[i].t)}
            </text>
          ))}

        {/* Guide de survol */}
        {actif && (
          <g>
            <line
              x1={actif.x}
              y1={geo.mgH}
              x2={actif.x}
              y2={geo.mgH + geo.h}
              stroke={couleur}
              strokeOpacity={0.4}
              strokeDasharray="3 3"
            />
            <circle cx={actif.x} cy={actif.y} r={4.5} fill={couleur} />
            <circle cx={actif.x} cy={actif.y} r={8} fill={couleur} opacity={0.2} />
          </g>
        )}
      </svg>

      {/* Infobulle */}
      {actif && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-[2px] border border-or-500/35 bg-nuit-950/95 px-2.5 py-1.5 text-[0.72rem] shadow-lg backdrop-blur"
          style={{
            left: Math.min(Math.max(actif.x, 62), largeur - 62),
            top: Math.max(actif.y - 54, 0),
          }}
        >
          <div className="font-semibold tabular-nums text-or-200">
            {fmtV(actif.v)} {unite}
          </div>
          <div className="text-givre-300/70">{fmtD(actif.t)}</div>
          {actif.note && <div className="text-givre-300/50">{actif.note}</div>}
        </div>
      )}
    </div>
  );
}

/** Mini-courbe sans axes : listes et tableaux. */
export function MiniCourbe({
  points,
  largeur = 84,
  hauteur = 26,
  couleur = "#7ba4c8",
}: {
  points: number[];
  largeur?: number;
  hauteur?: number;
  couleur?: string;
}) {
  if (points.length < 2) return <span className="text-xs text-givre-300/35">—</span>;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const pas = largeur / (points.length - 1);
  const d = points
    .map((v, i) => `${i === 0 ? "M" : "L"} ${i * pas} ${hauteur - ((v - min) / span) * (hauteur - 4) - 2}`)
    .join(" ");
  const hausse = points[points.length - 1] >= points[0];
  return (
    <svg width={largeur} height={hauteur} className="overflow-visible" aria-hidden>
      <path d={d} fill="none" stroke={hausse ? "#5f9e73" : "#bf5a4c"} strokeWidth={1.4} strokeLinecap="round" />
      <circle
        cx={(points.length - 1) * pas}
        cy={hauteur - ((points[points.length - 1] - min) / span) * (hauteur - 4) - 2}
        r={2}
        fill={hausse ? "#5f9e73" : "#bf5a4c"}
      />
    </svg>
  );
}
