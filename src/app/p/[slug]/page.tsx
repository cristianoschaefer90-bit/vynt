import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { products, categories } from "@/data/catalogo";
import { liveCatalog, avgRating } from "@/lib/catalog-server";
import { formatBRL, installments } from "@/lib/money";
import { SITE_URL, STORE } from "@/lib/config";
import { BuyBox } from "@/components/pdp/buy-box";
import { Gallery } from "@/components/pdp/gallery";
import { Reviews } from "@/components/pdp/reviews";
import { ProductCard } from "@/components/product-card";
import { MaskTitle, Reveal } from "@/components/motion";

export const revalidate = 60;

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = products.find((x) => x.slug === slug);
  if (!p) return {};
  return {
    title: p.name,
    description: `${p.short} ${formatBRL(p.priceCents)} ou ${STORE.pixDiscountPct}% off no Pix. Entrega hoje em Três Coroas.`,
    alternates: { canonical: `/p/${p.slug}` },
    openGraph: { images: [{ url: p.colors[0].images[0] }] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const all = await liveCatalog();
  const p = all.find((x) => x.slug === slug);
  if (!p) notFound();
  const cat = categories.find((c) => c.slug === p.category)!;
  const pairs = p.pairsWith.map((s) => all.find((x) => x.slug === s)).filter(Boolean) as typeof all;
  const parc = installments(p.priceCents, STORE.maxInstallments, STORE.minInstallmentCents);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.short,
    image: p.colors[0].images.map((i) => `${SITE_URL}${i}`),
    sku: p.slug.toUpperCase(),
    brand: { "@type": "Brand", name: "Vynt" },
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: (p.priceCents / 100).toFixed(2),
      availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/p/${p.slug}`,
    },
    // aggregateRating só com avaliações reais (STORE.demo = false)
    ...(!STORE.demo && p.reviews.length
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: avgRating(p).toFixed(1), reviewCount: p.reviews.length } }
      : {}),
  };

  return (
    <article className="mx-auto max-w-[1440px] px-4 md:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Você está em" className="py-4 text-sm text-tinta-3">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link href="/loja" className="hover:text-tinta">
              Loja
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={`/loja/${cat.slug}`} className="hover:text-tinta">
              {cat.name}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-tinta">
            {p.name}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="-mx-4 md:mx-0 lg:col-span-7">
          <Gallery images={p.colors[0].images} name={p.name} />
        </div>
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-[calc(var(--barra)+24px)]">
            {p.badge && <p className="rotulo !text-telha">{p.badge === "novo" ? "Novo" : "Mais vendido"}</p>}
            <h1 className="mt-1 font-serif text-[clamp(2.8rem,5vw,4.5rem)] leading-[0.95]">{p.name}</h1>
            <p className="mt-2 text-tinta-2">{p.short}</p>
            <div className="mt-6 flex flex-wrap items-baseline gap-x-3">
              <p className="num text-3xl">{formatBRL(p.priceCents)}</p>
              {p.compareAtCents && <p className="num text-tinta-3 line-through">{formatBRL(p.compareAtCents)}</p>}
            </div>
            <p className="num mt-1 text-sm text-tinta-2">
              {formatBRL(Math.round(p.priceCents * (1 - STORE.pixDiscountPct / 100)))} no Pix · {parc.n}× de {formatBRL(parc.each)} sem juros
            </p>
            <p className="mt-4 text-sm">
              Cor: <span className="font-medium">{p.colors[0].name}</span>
            </p>
            <div className="mt-6">
              <BuyBox slug={p.slug} name={p.name} variants={p.variants} stock={p.stockBySku} priceCents={p.priceCents} />
            </div>
          </div>
        </div>
      </div>

      <section aria-labelledby="historia" className="mt-24 grid gap-8 border-t border-tinta pt-8 lg:grid-cols-12">
        <p className="rotulo lg:col-span-3">A história da peça</p>
        <div className="lg:col-span-6">
          <MaskTitle className="font-serif text-4xl leading-tight md:text-5xl">
            <span id="historia">{p.story}</span>
          </MaskTitle>
        </div>
        <Reveal className="space-y-6 text-sm lg:col-span-3">
          <div>
            <h3 className="rotulo mb-2">Cuidados</h3>
            <p className="text-tinta-2">{p.care}</p>
          </div>
          <div>
            <h3 className="rotulo mb-2">Numeração</h3>
            <p className="text-tinta-2">Forma regular. Entre dois números, pegue o maior. Se não servir, troca grátis em {STORE.freeExchangeDays} dias.</p>
          </div>
        </Reveal>
      </section>

      <Reviews reviews={p.reviews} productName={p.name} />

      {pairs.length > 0 && (
        <section aria-labelledby="combina" className="mt-24">
          <h2 id="combina" className="font-serif text-titulo">
            Combina com
          </h2>
          <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-6">
            {pairs.map((x) => (
              <li key={x.slug} className="last:max-md:hidden">
                <ProductCard p={x} sizes="(min-width: 768px) 30vw, 46vw" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
