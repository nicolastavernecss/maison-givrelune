import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Parchemin } from "@/components/ui/base";
import { Embleme, Ornement } from "@/components/ui/Embleme";
import { Recit } from "@/components/ui/Recit";
import { prisma } from "@/lib/db";
import { MAISON } from "@/lib/domain";

export const metadata: Metadata = { title: "Histoire de la Maison" };
export const dynamic = "force-dynamic";

export default async function PageHistoire() {
  const page = await prisma.sitePage.findUnique({ where: { key: "histoire" } });
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <header className="mb-10 flex flex-col items-center text-center">
        <Embleme taille={104} />
        <p className="sur-titre mt-6">Chronique</p>
        <h1 className="titre-imperial mt-2 text-3xl text-givre-50 sm:text-4xl">{page.titre}</h1>
        <Ornement className="mt-7 w-full max-w-sm" />
      </header>

      <Parchemin>
        <Recit texte={page.contenu} className="text-parchemin-900" />
      </Parchemin>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {MAISON.citations.map((c) => (
          <blockquote
            key={c}
            className="carte carte-texture recit p-5 text-[0.95rem] text-givre-200/85 italic"
          >
            « {c} »
          </blockquote>
        ))}
      </div>
    </div>
  );
}
