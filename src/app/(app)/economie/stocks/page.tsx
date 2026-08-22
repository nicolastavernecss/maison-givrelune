import type { Metadata } from "next";
import { PageInventaire } from "@/components/economie/PageInventaire";
import { exigerDroit, peut } from "@/lib/auth";
import { PERMISSIONS as P } from "@/lib/domain";

export const metadata: Metadata = { title: "Stock commun" };
export const dynamic = "force-dynamic";

export default async function Stocks({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const membre = await exigerDroit(P.INVENTORY_HOUSE_READ);
  const { edit } = await searchParams;

  return (
    <PageInventaire
      ownerType="maison"
      titre="Registre des stocks"
      surTitre="Biens communs de la Maison"
      description="Ce que la Maison possède en propre. Tout prélèvement se déclare et se consigne (règlement §VI) : chaque écart laisse une trace nominative dans l'historique."
      editable={peut(membre, P.INVENTORY_HOUSE_MANAGE)}
      avecSeuil
      edit={edit}
      cheminBase="/economie/stocks"
    />
  );
}
