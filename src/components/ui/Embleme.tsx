/**
 * Emblème de la Maison Givrelune.
 * Loup hurlant · croissant de lune · motif de givre.
 * Entièrement vectoriel, sans dépendance ni fichier externe.
 */

const TETE_DE_LOUP =
  "M26.5 56.4 C31 51.8 36.6 48.6 42.4 46.9 C45.5 46 47.8 45 49.3 43.4 " +
  "L51.6 25.2 C51.8 23.6 53.6 23 54.7 24.2 L64.2 34.8 " +
  "L73.4 25.6 C74.6 24.4 76.6 25.3 76.6 27 L76.8 44.8 " +
  "C81.9 49.4 85.6 55.6 87.2 62.7 C89.2 71.6 87.5 80.6 82.6 87.7 " +
  "C81.9 88.7 80.3 88.3 80.1 87.1 L78.9 79.8 " +
  "C78.7 78.6 77.1 78.3 76.5 79.4 L71.6 88.4 " +
  "C71 89.5 69.4 89.2 69.2 88 L68.1 80.7 " +
  "C67.9 79.4 66.2 79.2 65.7 80.4 L61.9 89.6 " +
  "C61.4 90.8 59.7 90.6 59.5 89.3 L58.2 81.2 " +
  "C56.4 79.7 54.9 77.9 53.8 75.8 C51.6 71.7 47.9 68.6 43.5 67.2 " +
  "L28.4 62.3 C26.3 61.6 25 59.4 25.3 57.9 Z";

export function Embleme({
  taille = 120,
  variante = "sceau",
  className = "",
}: {
  taille?: number;
  variante?: "sceau" | "simple";
  className?: string;
}) {
  const id = variante;
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 120 120"
      fill="none"
      role="img"
      aria-label="Emblème de la Maison Givrelune"
      className={className}
    >
      <defs>
        <linearGradient id={`${id}-loup`} x1="20" y1="20" x2="95" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#eef5fb" />
          <stop offset="45%" stopColor="#b9cee0" />
          <stop offset="100%" stopColor="#6d8aa6" />
        </linearGradient>
        <linearGradient id={`${id}-lune`} x1="60" y1="8" x2="60" y2="112" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f4e7c2" />
          <stop offset="55%" stopColor="#d2b873" />
          <stop offset="100%" stopColor="#98793a" />
        </linearGradient>
        <radialGradient id={`${id}-halo`} cx="60" cy="52" r="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7ba4c8" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#7ba4c8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Halo froid */}
      <circle cx="60" cy="54" r="50" fill={`url(#${id}-halo)`} />

      {/* Croissant de lune */}
      <path
        d="M60 10 A44 44 0 1 0 60 98 A35 35 0 1 1 60 10 Z"
        fill={`url(#${id}-lune)`}
        opacity="0.9"
        transform="rotate(-24 60 54)"
      />

      {variante === "sceau" && (
        <>
          {/* Anneau du sceau */}
          <circle cx="60" cy="60" r="57" stroke="#bd9c4d" strokeOpacity="0.55" strokeWidth="1" />
          <circle cx="60" cy="60" r="53.5" stroke="#bd9c4d" strokeOpacity="0.28" strokeWidth="0.6" />
          {/* Cristaux de givre en couronne */}
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i * Math.PI * 2) / 24;
            const long = i % 3 === 0;
            const r1 = 53.5;
            const r2 = long ? 57 : 55.6;
            return (
              <line
                key={i}
                x1={60 + Math.cos(a) * r1}
                y1={60 + Math.sin(a) * r1}
                x2={60 + Math.cos(a) * r2}
                y2={60 + Math.sin(a) * r2}
                stroke="#d2b873"
                strokeOpacity={long ? 0.75 : 0.35}
                strokeWidth={long ? 1.1 : 0.7}
              />
            );
          })}
        </>
      )}

      {/* Tête de loup hurlant */}
      <path d={TETE_DE_LOUP} fill={`url(#${id}-loup)`} />
      <path d={TETE_DE_LOUP} fill="none" stroke="#0b1220" strokeOpacity="0.45" strokeWidth="0.9" />

      {/* Oreilles : creux */}
      <path d="M55.2 30.5 L62.2 38.3 L56.3 41.2 Z" fill="#26384c" opacity="0.55" />
      <path d="M72.9 31.8 L73.1 42.6 L67.4 38.8 Z" fill="#26384c" opacity="0.55" />

      {/* Œil */}
      <path d="M52.4 51.6 L58 50.2 L55.6 54.6 Z" fill="#0b1220" opacity="0.85" />

      {/* Naseau et ligne de gueule */}
      <circle cx="29.4" cy="56.6" r="1.7" fill="#0b1220" opacity="0.7" />
      <path
        d="M29.5 60.2 C34.5 60.9 39.4 59.9 43.6 57.6"
        stroke="#0b1220"
        strokeOpacity="0.4"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Cristal de givre en pointe basse */}
      <g stroke="#e6f1f9" strokeOpacity="0.75" strokeWidth="1" strokeLinecap="round">
        <path d="M60 100 V113" />
        <path d="M54.6 103.4 L60 106.6 L65.4 103.4" />
        <path d="M56.2 109 L60 111.2 L63.8 109" />
      </g>
    </svg>
  );
}

/** Version compacte pour l'en-tête et les onglets. */
export function EmblemeCompact({ taille = 32, className = "" }: { taille?: number; className?: string }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 120 120"
      fill="none"
      role="img"
      aria-label="Maison Givrelune"
      className={className}
    >
      <defs>
        <linearGradient id="cpt-loup" x1="20" y1="20" x2="95" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#eef5fb" />
          <stop offset="100%" stopColor="#7f9db8" />
        </linearGradient>
      </defs>
      <path
        d="M60 10 A44 44 0 1 0 60 98 A35 35 0 1 1 60 10 Z"
        fill="#d2b873"
        opacity="0.85"
        transform="rotate(-24 60 54)"
      />
      <path d={TETE_DE_LOUP} fill="url(#cpt-loup)" />
      <path d={TETE_DE_LOUP} fill="none" stroke="#0b1220" strokeOpacity="0.4" strokeWidth="1" />
      <path d="M52.4 51.6 L58 50.2 L55.6 54.6 Z" fill="#0b1220" opacity="0.8" />
    </svg>
  );
}

/** Séparateur ornemental : ━━━ ❖ ━━━ */
export function Ornement({
  className = "",
  symbole = "❖",
}: {
  className?: string;
  symbole?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-hidden>
      <span className="filet flex-1" />
      <span className="text-[0.7rem] text-or-400/70">{symbole}</span>
      <span className="filet flex-1" />
    </div>
  );
}

/** Bannière verticale décorative (colonnes latérales des pages publiques). */
export function BanniereVerticale({ className = "" }: { className?: string }) {
  return (
    <svg
      width="34"
      height="220"
      viewBox="0 0 34 220"
      fill="none"
      aria-hidden
      className={className}
    >
      <defs>
        <linearGradient id="ban-fond" x1="17" y1="0" x2="17" y2="220" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#17233d" />
          <stop offset="70%" stopColor="#101a2e" />
          <stop offset="100%" stopColor="#101a2e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M2 0 H32 V196 L17 214 L2 196 Z" fill="url(#ban-fond)" stroke="#bd9c4d" strokeOpacity="0.4" />
      <circle cx="17" cy="34" r="9" stroke="#d2b873" strokeOpacity="0.7" />
      <path d="M17 27 A7 7 0 1 0 17 41 A5.5 5.5 0 1 1 17 27 Z" fill="#d2b873" fillOpacity="0.8" />
      <path d="M17 52 V172" stroke="#bd9c4d" strokeOpacity="0.28" />
      {[70, 100, 130, 160].map((y) => (
        <g key={y} stroke="#e6f1f9" strokeOpacity="0.35" strokeWidth="0.9">
          <path d={`M11 ${y} H23`} />
          <path d={`M14 ${y - 3} L17 ${y} L14 ${y + 3}`} />
          <path d={`M20 ${y - 3} L17 ${y} L20 ${y + 3}`} />
        </g>
      ))}
    </svg>
  );
}
