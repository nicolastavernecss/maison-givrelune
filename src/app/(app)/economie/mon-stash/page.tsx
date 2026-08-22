import type { Metadata } from "next";
import { PageInventaire } from "@/components/economie/PageInventaire";
import { exigerDroit } from "@/lib/auth";
import { PERMISSIONS as P } from "@/lib/domain";

export const metadata: Metadata = { title: "Mon stash" };
export const dynamic = "force-dynamic";

export default async function MonStash({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const membre = await exigerDroit(P.INVENTORY_OWN);
  const { edit } = await searchParams;

  return (
    <PageInventaire
      ownerType="membre"
      ownerUserId={membre.id}
      titre="Mon stash"
      surTitre="Inventaire personnel"
      description="Ce que vous possédez en propre : récolté, produit, acheté. Valorisé au cours du marché, avec photos des pièces pour montrer votre travail."
      editable
      edit={edit}
      cheminBase="/economie/mon-stash"
    />
  );
}
