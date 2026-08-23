/**
 * Récapitulatif des droits attribués automatiquement.
 *   npx tsx prisma/droits.ts
 *
 * Utile pour vérifier, avant d'attribuer un rôle à un nouveau membre, ce
 * qu'il obtiendra sans avoir rien à cocher à la main.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("❖ Droits hérités du RANG");
  for (const r of await prisma.rank.findMany({
    orderBy: { level: "asc" },
    include: { permissions: true },
  })) {
    console.log(`   ${r.label.padEnd(14)} ${String(r.permissions.length).padStart(3)} droits`);
  }

  console.log("\n❖ Droits ajoutés par la BRANCHE (tous ses membres, sans condition de grade)");
  for (const b of await prisma.branch.findMany({
    orderBy: { position: "asc" },
    include: { permissions: { include: { permission: true } } },
  })) {
    const cles = b.permissions.map((x) => x.permission.key);
    console.log(`   ${b.label.padEnd(14)} ${cles.join(", ") || "—"}`);
  }

  console.log("\n❖ Droits ajoutés par le GRADE (chefs de branche)");
  for (const g of await prisma.grade.findMany({
    where: { level: 1 },
    include: { branch: true, permissions: { include: { permission: true } } },
    orderBy: { branch: { position: "asc" } },
  })) {
    const cles = g.permissions
      .map((x) => x.permission.key)
      .filter((k) => k.includes("validate") || k.includes("manage") || k.includes("sign"));
    console.log(`   ${g.label.padEnd(24)} (${g.branch.label})`);
    console.log(`      valide : ${cles.join(", ") || "—"}`);
  }

  console.log("\n❖ Droits ajoutés par la FONCTION DE CONSEIL");
  for (const c of await prisma.councilRole.findMany({
    orderBy: { position: "asc" },
    include: { permissions: true },
  })) {
    console.log(`   ${c.label.padEnd(12)} +${String(c.permissions.length).padStart(2)} droits`);
  }

  console.log("\n❖ Membres actuels");
  for (const u of await prisma.user.findMany({
    include: { rank: true, branch: true, grade: true, councilRole: true },
    orderBy: { dateEntree: "asc" },
  })) {
    const parts = [u.rank.label, u.grade?.label, u.branch?.label, u.councilRole?.label].filter(
      Boolean,
    );
    console.log(`   ${u.nomRp.padEnd(26)} ${u.login.padEnd(18)} ${parts.join(" · ")}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
