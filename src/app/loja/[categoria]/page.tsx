import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Listing } from "@/components/catalog/listing";
import { categories, type CategorySlug } from "@/data/catalogo";

export function generateStaticParams() {
  return categories.map((c) => ({ categoria: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ categoria: string }> }): Promise<Metadata> {
  const { categoria } = await params;
  const c = categories.find((x) => x.slug === categoria);
  if (!c) return {};
  return { title: `Tênis ${c.name.toLowerCase()}`, description: `${c.tagline} Entrega hoje em Três Coroas e região.`, alternates: { canonical: `/loja/${c.slug}` } };
}

export default async function Categoria({
  params,
  searchParams,
}: {
  params: Promise<{ categoria: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { categoria } = await params;
  if (!categories.some((c) => c.slug === categoria)) notFound();
  return <Listing category={categoria as CategorySlug} searchParams={await searchParams} />;
}
