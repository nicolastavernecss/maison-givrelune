import { Coquille } from "@/components/layout/Coquille";
import { exigerMembre, peut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NAVIGATION, type Compteurs } from "@/lib/navigation";
import { PERMISSIONS } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function LayoutApplication({ children }: { children: React.ReactNode }) {
  const membre = await exigerMembre();

  // La navigation ne montre que ce que le membre a le droit de consulter.
  const sections = NAVIGATION.map((s) => ({
    ...s,
    entrees: s.entrees.filter((e) => !e.droit || peut(membre, e.droit)),
  })).filter((s) => s.entrees.length > 0);

  const [impayes, demandes, permisAttente, tickets, patrouilles] = await Promise.all([
    peut(membre, PERMISSIONS.ORDER_READ)
      ? prisma.craftOrder.count({ where: { resteAPayer: { gt: 0 }, etat: { not: "annulee" } } })
      : 0,
    peut(membre, PERMISSIONS.ROLE_REQUEST_READ)
      ? prisma.roleRequest.count({ where: { statut: "en_attente" } })
      : 0,
    peut(membre, PERMISSIONS.HARVEST_READ)
      ? prisma.harvestPermit.count({ where: { statut: "en_attente" } })
      : 0,
    peut(membre, PERMISSIONS.TICKET_MANAGE)
      ? prisma.ticket.count({ where: { statut: { in: ["ouvert", "en_cours"] } } })
      : peut(membre, PERMISSIONS.TICKET_READ)
        ? prisma.ticket.count({ where: { auteurId: membre.id, statut: { in: ["ouvert", "en_cours"] } } })
        : 0,
    peut(membre, PERMISSIONS.PATROL_READ)
      ? prisma.patrol.count({ where: { statut: "planifiee" } })
      : 0,
  ]);

  const compteurs: Compteurs = { impayes, demandes, permisAttente, tickets, patrouilles };

  return (
    <Coquille
      sections={sections}
      compteurs={compteurs}
      membre={{
        id: membre.id,
        nomRp: membre.nomRp,
        rang: membre.rank.label,
        rangLevel: membre.rank.level,
        branche: membre.branch?.label,
        grade: membre.grade?.label,
        conseil: membre.councilRole?.label,
        avatarUrl: membre.avatarUrl || null,
        statut: membre.status,
      }}
    >
      {children}
    </Coquille>
  );
}
