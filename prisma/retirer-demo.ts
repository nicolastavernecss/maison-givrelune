/**
 * Retire les membres de démonstration inventés, en ne gardant que les
 * fondateurs. Les référentiels, la matrice de permissions et tout le reste
 * sont conservés : les droits continuent de découler automatiquement du
 * rang, du grade et de la fonction de Conseil.
 *
 *   npx tsx prisma/retirer-demo.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const A_GARDER = ["nicolas.varian"];

async function main() {
  const partants = await prisma.user.findMany({
    where: { login: { notIn: A_GARDER } },
    select: { id: true, login: true, nomRp: true },
  });

  if (partants.length === 0) {
    console.log("❖ Rien à retirer : seuls les fondateurs sont présents.");
  } else {
    // Détacher ce qui pointe vers eux sans être supprimé en cascade.
    await prisma.circle.updateMany({
      where: { leaderId: { in: partants.map((p) => p.id) } },
      data: { leaderId: null },
    });

    const n = await prisma.user.deleteMany({ where: { id: { in: partants.map((p) => p.id) } } });
    console.log(`❖ ${n.count} membre(s) retiré(s) :`);
    for (const p of partants) console.log(`    ${p.nomRp} (${p.login})`);
  }

  const restants = await prisma.user.findMany({
    include: { rank: true, councilRole: true, _count: { select: { permissions: true } } },
    orderBy: { dateEntree: "asc" },
  });
  console.log("❖ Membres conservés :");
  for (const u of restants) {
    const droits = await prisma.rankPermission.count({ where: { rankId: u.rankId } });
    console.log(
      `    ${u.nomRp} (${u.login}) — ${u.rank.label}${u.councilRole ? ` · ${u.councilRole.label}` : ""} — ${droits} droit(s) hérités du rang`,
    );
  }
  console.log("❖ Les prochains membres seront créés depuis Gouvernance → Membres & rôles,");
  console.log("   ou par acceptation d'une demande de rôle. Les droits suivent le rang attribué.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
