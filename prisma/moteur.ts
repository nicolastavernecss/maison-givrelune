/**
 * Bascule le moteur de base de données entre SQLite (développement local)
 * et PostgreSQL (mise en ligne).
 *
 *   npm run db:postgres   → prépare le schéma pour PostgreSQL
 *   npm run db:sqlite     → revient à SQLite
 *
 * Le schéma est écrit pour être portable : aucun enum SQL, aucun type natif
 * spécifique. Seule la ligne `provider` change.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CHEMIN = join(process.cwd(), "prisma", "schema.prisma");
const cible = process.argv.includes("--sqlite") ? "sqlite" : "postgresql";

const schema = readFileSync(CHEMIN, "utf8");
const actuel = schema.match(/provider\s*=\s*"(sqlite|postgresql)"/)?.[1];

if (!actuel) {
  console.error("❖ Ligne `provider` introuvable dans prisma/schema.prisma.");
  process.exit(1);
}

if (actuel === cible) {
  console.log(`❖ Le schéma est déjà en ${cible}. Rien à faire.`);
} else {
  writeFileSync(
    CHEMIN,
    schema.replace(/provider\s*=\s*"(sqlite|postgresql)"/, `provider = "${cible}"`),
    "utf8",
  );
  console.log(`❖ Moteur basculé : ${actuel} → ${cible}`);
}

console.log("");
if (cible === "postgresql") {
  console.log("Étapes suivantes :");
  console.log("  1. Mettez l'URL PostgreSQL dans DATABASE_URL (fichier .env)");
  console.log("  2. npx prisma db push      — crée les tables");
  console.log("  3. npm run db:seed         — amorce les référentiels");
  console.log("");
  console.log("La recherche passera automatiquement en insensible à la casse.");
} else {
  console.log("Étapes suivantes :");
  console.log('  1. DATABASE_URL="file:./givrelune.db" dans .env');
  console.log("  2. npx prisma db push");
}
