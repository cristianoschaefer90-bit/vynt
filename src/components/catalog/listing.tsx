import Link from "next/link";
import { liveCatalog } from "@/lib/catalog-server";
import { apply, parseFilters } from "@/lib/filters";
import { categories, type CategorySlug } from "@/data/catalogo";
import { ProductCard } from "@/components/product-card";
import { FilterForm } from "./filter-form";
import { MaskTitle } from "@/components/motion";

export async function Listing({ category, searchParams }: { category?: CategorySlug; searchParams: Record<string, string | string[] | undefined> }) {
  const f = parseFilters(searchParams);
  const all = await liveCatalog();
  const base = category ? all.filter((p) => p.category === category) : all;
  const list = apply(base, f);
  const cat = categories.find((c) => c.slug === category);

  return (
    <div className="mx-auto max-w-[1440px] px-4 md:px-8">
      <nav aria-label="Categorias" className="flex gap-2 overflow-x-auto py-4 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link href="/loja" aria-current={!category ? "page" : undefined} className={`shrink-0 border px-4 py-2.5 ${!category ? "border-tinta bg-tinta text-papel" : "border-linha"}`}>
          Tudo
        </Link>
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/loja/${c.slug}`}
            aria-current={category === c.slug ? "page" : undefined}
            className={`shrink-0 border px-4 py-2.5 ${category === c.slug ? "border-tinta bg-tinta text-papel" : "border-linha hover:border-tinta"}`}
          >
            {c.name}
          </Link>
        ))}
      </nav>

      <header className="grid gap-4 pb-8 pt-6 md:grid-cols-12 md:items-end">
        <MaskTitle as="h1" immediate className="font-serif text-[clamp(3.2rem,9vw,8rem)] leading-[0.9] md:col-span-8">
          {cat?.name ?? "Todos os tênis"}
        </MaskTitle>
        <p className="text-tinta-2 md:col-span-4">{cat?.tagline ?? "Curadoria da Vynt. Tudo original, com nota fiscal e troca de número grátis."}</p>
      </header>

      <div className="grid gap-x-10 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <div className="lg:sticky lg:top-[calc(var(--barra)+16px)]">
            <FilterForm key={JSON.stringify(f)} f={f} total={list.length} />
          </div>
        </aside>
        <section aria-labelledby="produtos-titulo" className="lg:col-span-9">
          <h2 id="produtos-titulo" className="sr-only">
            Produtos
          </h2>
          <p className="num py-4 text-sm text-tinta-3 lg:hidden" aria-live="polite">
            {list.length} {list.length === 1 ? "modelo" : "modelos"}
          </p>
          {list.length === 0 ? (
            <div className="border border-linha p-10">
              <p className="font-serif text-4xl">Nada com esse filtro.</p>
              <p className="mt-2 text-tinta-2">Tira algum filtro ou chama no WhatsApp que a gente procura o seu número.</p>
              <Link href={category ? `/loja/${category}` : "/loja"} className="btn btn-linha mt-6">
                Limpar filtros
              </Link>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-x-3 gap-y-10 md:gap-x-6 lg:grid-cols-3 lg:pt-3">
              {list.map((p, i) => (
                <li key={p.slug}>
                  <ProductCard p={p} stock={p.stockBySku} priority={i < 3} outOfStock={!p.inStock} sizes="(min-width: 1024px) 24vw, 46vw" />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
