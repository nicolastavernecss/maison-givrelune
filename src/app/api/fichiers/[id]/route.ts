import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { utilisateurCourant } from "@/lib/auth";

/**
 * Sert une pièce jointe stockée en base (photos d'ateliers, captures RP,
 * courriers). Le stockage en base garde le site déployable partout,
 * y compris sur un hébergement gratuit sans disque persistant.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await utilisateurCourant())) {
    return new NextResponse("Accès réservé aux membres.", { status: 401 });
  }

  const { id } = await ctx.params;
  const fichier = await prisma.attachment.findUnique({ where: { id } });
  if (!fichier) return new NextResponse("Introuvable", { status: 404 });

  return new NextResponse(new Uint8Array(fichier.data), {
    headers: {
      "Content-Type": fichier.mime,
      "Content-Length": String(fichier.size),
      "Content-Disposition": `inline; filename="${encodeURIComponent(fichier.filename)}"`,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
