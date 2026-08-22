import { PrismaClient } from "@prisma/client";

const global_ = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  global_.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") global_.prisma = prisma;

/**
 * Recherche textuelle insensible à la casse, quel que soit le moteur.
 *
 * SQLite ignore la casse d'office sur l'ASCII ; PostgreSQL non. Sans cette
 * précaution, chercher « dorik » ne trouverait plus « Dorik » une fois le
 * site en ligne. On ajoute donc `mode: "insensitive"` uniquement quand on
 * tourne sur PostgreSQL — l'option n'existe pas côté SQLite.
 */
const INSENSIBLE = (process.env.DATABASE_URL ?? "").startsWith("postgres");

export function contient(valeur: string) {
  return (
    INSENSIBLE ? { contains: valeur, mode: "insensitive" } : { contains: valeur }
  ) as { contains: string };
}
