import { prisma } from "./db";

/**
 * Journal d'audit : octrois, validations, mouvements de trésorerie et de
 * stocks, sanctions. Ne jamais faire échouer l'action métier à cause du
 * journal — on trace, on ne bloque pas.
 */
export async function tracer(opts: {
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  label?: string;
  details?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: opts.userId ?? null,
        action: opts.action,
        entityType: opts.entityType ?? "",
        entityId: opts.entityId ?? "",
        label: opts.label ?? "",
        details: opts.details ?? "",
      },
    });
  } catch (e) {
    console.error("[audit] écriture impossible :", e);
  }
}

export const ACTIONS: Record<string, { label: string; ton: "neutre" | "succes" | "alerte" | "danger" }> = {
  creation: { label: "Création", ton: "neutre" },
  modification: { label: "Modification", ton: "neutre" },
  suppression: { label: "Suppression", ton: "danger" },
  validation: { label: "Validation", ton: "succes" },
  refus: { label: "Refus", ton: "danger" },
  octroi: { label: "Octroi", ton: "succes" },
  revocation: { label: "Révocation", ton: "danger" },
  tresorerie: { label: "Trésorerie", ton: "alerte" },
  stock: { label: "Stock commun", ton: "alerte" },
  sanction: { label: "Sanction", ton: "danger" },
  membre: { label: "Membre", ton: "alerte" },
  connexion: { label: "Connexion", ton: "neutre" },
};
