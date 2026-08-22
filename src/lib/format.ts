/** Formatage — tout le site parle français et compte en Septims. */

const NOMBRE = new Intl.NumberFormat("fr-FR");
const DECIMAL = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

export function nombre(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return Number.isInteger(n) ? NOMBRE.format(n) : DECIMAL.format(n);
}

export function septims(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${NOMBRE.format(Math.round(n))} ⊙`;
}

/** Version longue, pour les libellés isolés. */
export function septimsLong(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const arrondi = Math.round(n);
  return `${NOMBRE.format(arrondi)} ${Math.abs(arrondi) === 1 ? "Septim" : "Septims"}`;
}

export function date(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function dateLongue(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function dateHeure(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Valeur pour un <input type="date"> */
export function pourInputDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate(),
  ).padStart(2, "0")}`;
}

export function relatif(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const j = Math.floor(diff / 86_400_000);
  if (diff < 0) {
    const jf = Math.abs(j);
    if (jf === 0) return "aujourd'hui";
    if (jf === 1) return "demain";
    if (jf < 31) return `dans ${jf} jours`;
    if (jf < 365) return `dans ${Math.round(jf / 30)} mois`;
    return `dans ${Math.round(jf / 365)} an${jf >= 730 ? "s" : ""}`;
  }
  if (j === 0) {
    const h = Math.floor(diff / 3_600_000);
    if (h === 0) {
      const m = Math.floor(diff / 60_000);
      return m <= 1 ? "à l'instant" : `il y a ${m} min`;
    }
    return `il y a ${h} h`;
  }
  if (j === 1) return "hier";
  if (j < 31) return `il y a ${j} jours`;
  if (j < 365) return `il y a ${Math.round(j / 30)} mois`;
  return `il y a ${Math.round(j / 365)} an${j >= 730 ? "s" : ""}`;
}

export function pourcentage(n: number | null | undefined, decimales = 0): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${n.toFixed(decimales).replace(".", ",")} %`;
}

/** Variation entre deux cours, en %. */
export function variation(actuel: number, precedent: number): number | null {
  if (!precedent) return null;
  return ((actuel - precedent) / precedent) * 100;
}

export function tronquer(texte: string, max = 90): string {
  if (texte.length <= max) return texte;
  return `${texte.slice(0, max - 1).trimEnd()}…`;
}

export function initiales(nom: string): string {
  return nom
    .split(/[\s'-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase() ?? "")
    .join("");
}

/** Slug simple pour les ancres et les clés de matière. */
export function slug(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
