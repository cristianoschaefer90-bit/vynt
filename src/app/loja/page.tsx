import type { Metadata } from "next";
import { Listing } from "@/components/catalog/listing";

export const metadata: Metadata = {
  title: "Todos os tênis",
  description: "Casual, streetwear e corrida. Tênis originais com entrega hoje em Três Coroas e região.",
  alternates: { canonical: "/loja" },
};

export default async function Loja({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <Listing searchParams={await searchParams} />;
}
