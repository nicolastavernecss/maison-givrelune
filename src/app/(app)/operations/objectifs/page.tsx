import type { Metadata } from "next";
import { PageRegistre } from "@/components/registre/PageRegistre";
import { registre } from "@/lib/registres";

const def = registre("objectifs")!;

export const metadata: Metadata = { title: def.titre };
export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <PageRegistre def={def} params={await searchParams} />;
}
