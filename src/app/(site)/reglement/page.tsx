import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Parchemin } from "@/components/ui/base";
import { Ornement } from "@/components/ui/Embleme";
import { Recit } from "@/components/ui/Recit";
import { prisma } from "@/lib/db";
import { MAISON } from "@/lib/domain";

export const metadata: Metadata = { title: "Règlement" };
export const dynamic = "force-dynamic";

export default async function PageReglement() {
  const page = await prisma.sitePage.findUnique({ where: { key: "reglement" } });
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <header className="mb-10 text-center">
        <p className="sur-titre">Loi de la Maison</p>
        <h1 className="titre-imperial mt-2 text-3xl text-givre-50 sm:text-4xl">{page.titre}</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-givre-300/70">
          Huit sections. Elles s'appliquent à tous, du Fils au Patriarche. Nul ne peut s'en prévaloir de
          l'ignorance.
        </p>
        <Ornement className="mt-7" />
      </header>

      <Parchemin>
        <Recit texte={page.contenu} className="text-parchemin-900" />
        <div className="mt-10 border-t border-parchemin-700/25 pt-5 text-center">
          <p className="recit text-[0.95rem] text-parchemin-800 italic">« {MAISON.devise} »</p>
        </div>
      </Parchemin>

      <p className="mt-6 text-center text-xs text-givre-300/45">
        Dernière mise à jour :{" "}
        {page.updatedAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
      </p>
    </div>
  );
}
