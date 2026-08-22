import { prisma } from "./db";
import { DUREE_MAX_POSTE_H } from "./domain";

/**
 * Prise de poste — qui est en jeu, maintenant.
 *
 * Un poste reste « ouvert » tant que le membre ne l'a pas quitté. Comme on
 * ferme souvent le navigateur sans y penser, un poste ouvert depuis plus de
 * DUREE_MAX_POSTE_H heures cesse simplement d'être compté : on ne réécrit
 * rien en base pendant l'affichage, on filtre à la lecture.
 */

export function seuilPoste(): Date {
  return new Date(Date.now() - DUREE_MAX_POSTE_H * 3_600_000);
}

const INCLUDE_MEMBRE = {
  user: {
    select: {
      id: true,
      nomRp: true,
      avatarUrl: true,
      rank: { select: { label: true, level: true, color: true } },
      branch: { select: { label: true, color: true, icon: true, key: true } },
      grade: { select: { label: true } },
      circle: { select: { label: true } },
      metiers: {
        include: { metier: { select: { key: true, label: true, category: true } } },
        orderBy: { isPrimary: "desc" },
      },
    },
  },
} as const;

/** Tous les postes actuellement ouverts, le plus ancien d'abord. */
export async function postesOuverts() {
  return prisma.dutySession.findMany({
    where: { finLe: null, debutLe: { gte: seuilPoste() } },
    include: INCLUDE_MEMBRE,
    orderBy: { debutLe: "asc" },
  });
}

export type PosteOuvert = Awaited<ReturnType<typeof postesOuverts>>[number];

/** Le poste ouvert du membre, s'il en a un. */
export async function monPoste(userId: string) {
  return prisma.dutySession.findFirst({
    where: { userId, finLe: null, debutLe: { gte: seuilPoste() } },
    orderBy: { debutLe: "desc" },
  });
}

/** Combien de membres sont en poste — pour les compteurs et pastilles. */
export async function nombreEnPoste(): Promise<number> {
  return prisma.dutySession.count({
    where: { finLe: null, debutLe: { gte: seuilPoste() } },
  });
}

/** Durée d'un poste, formatée court : « 2 h 15 ». */
export function dureePoste(debut: Date, fin?: Date | null): string {
  const ms = (fin ? fin.getTime() : Date.now()) - debut.getTime();
  const minutes = Math.max(0, Math.floor(ms / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}
