/**
 * Remise à zéro des chiffres de la Maison.
 *
 *   npm run db:vider          → économie seule : prix, stocks, coffre, commandes
 *   npm run db:vider -- --tout → + registres, opérations, diplomatie, vie, journal
 *
 * Ne touche jamais aux référentiels (rangs, branches, métiers, matières,
 * recettes, permissions) ni aux membres : c'est le patrimoine de la Maison.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TOUT = process.argv.includes("--tout");

async function main() {
  console.log("❖ Remise à zéro…");

  // ── Économie ───────────────────────────────────────────────
  const mouvements = await prisma.inventoryMovement.deleteMany();
  const stocks = await prisma.inventoryItem.deleteMany();
  const prix = await prisma.marketPrice.deleteMany();
  const commandes = await prisma.craftOrder.deleteMany();
  const commerce = await prisma.trade.deleteMany();
  const mvtCoffre = await prisma.treasuryMovement.deleteMany();
  const productions = await prisma.productionEntry.deleteMany();
  const rapports = await prisma.rapport.deleteMany();
  const prixAteliers = await prisma.metierPrice.deleteMany();

  await prisma.treasury.upsert({
    where: { id: "maison" },
    update: { septims: 0, valeurStock: 0, responsableId: null, note: "" },
    create: { id: "maison", septims: 0, valeurStock: 0 },
  });

  console.log(`  ❖ Cours du marché      : ${prix.count} relevés effacés`);
  console.log(`  ❖ Stocks & stashs      : ${stocks.count} lignes, ${mouvements.count} mouvements`);
  console.log(`  ❖ Commandes & commerce : ${commandes.count} commandes, ${commerce.count} opérations`);
  console.log(`  ❖ Coffre               : remis à 0 (${mvtCoffre.count} mouvements effacés)`);
  console.log(
    `  ❖ Production           : ${productions.count} fabrications, ${rapports.count} comptes rendus, ${prixAteliers.count} prix d'atelier`,
  );

  // ── Reste des registres ────────────────────────────────────
  if (TOUT) {
    const r = {
      permis: (await prisma.harvestPermit.deleteMany()).count,
      passages: (await prisma.passageRight.deleteMany()).count,
      patrouilles: (await prisma.patrol.deleteMany()).count,
      postes: (await prisma.dutySession.deleteMany()).count,
      rapports: (await prisma.report.deleteMany()).count,
      missions: (await prisma.mission.deleteMany()).count,
      objectifs: (await prisma.objective.deleteMany()).count,
      contrats: (await prisma.contract.deleteMany()).count,
      alliances: (await prisma.alliance.deleteMany()).count,
      courriers: (await prisma.correspondence.deleteMany()).count,
      annonces: (await prisma.announcement.deleteMany()).count,
      evenements: (await prisma.event.deleteMany()).count,
      absences: (await prisma.attendance.deleteMany()).count,
      galerie: (await prisma.galleryItem.deleteMany()).count,
      demandes: (await prisma.roleRequest.deleteMany()).count,
      tickets: (await prisma.ticket.deleteMany()).count,
      sanctions: (await prisma.sanction.deleteMany()).count,
      journal: (await prisma.auditLog.deleteMany()).count,
    };
    const total = Object.values(r).reduce((a, b) => a + b, 0);
    console.log(`  ❖ Registres, opérations, vie, journal : ${total} entrées effacées`);
  }

  const restes = {
    membres: await prisma.user.count(),
    matieres: await prisma.material.count(),
    recettes: await prisma.recipe.count(),
    metiers: await prisma.metier.count(),
  };
  console.log(
    `❖ Conservés : ${restes.membres} membres, ${restes.metiers} métiers, ${restes.matieres} matières, ${restes.recettes} recettes.`,
  );
  console.log("❖ La Maison repart de zéro. Nés sans titre, élevés par nos actes.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
