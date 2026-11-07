import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/catalogo";
import { formatBRL } from "@/lib/money";
import { STORE } from "@/lib/config";

export function ProductCard({
  p,
  priority,
  sizes = "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw",
  outOfStock,
}: {
  p: Product & { priceCents: number };
  priority?: boolean;
  sizes?: string;
  outOfStock?: boolean;
}) {
  const pix = Math.round(p.priceCents * (1 - STORE.pixDiscountPct / 100));
  return (
    <Link href={`/p/${p.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-papel-2">
        <Image
          src={p.colors[0].images[0]}
          alt=""
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover transition-transform duration-[1.2s] ease-expo group-hover:scale-[1.04]"
        />
        <Image
          src={p.colors[0].images[1]}
          alt=""
          fill
          sizes={sizes}
          className="object-cover opacity-0 transition-opacity duration-700 ease-expo group-hover:opacity-100 max-md:hidden"
        />
        {(p.badge || outOfStock) && (
          <span className="absolute left-3 top-3 bg-papel px-2 py-1 text-[0.6875rem] uppercase tracking-[0.12em]">
            {outOfStock ? "Esgotado" : p.badge === "novo" ? "Novo" : "Mais vendido"}
          </span>
        )}
      </div>
      <div className="mt-3 sm:flex sm:items-baseline sm:justify-between sm:gap-3">
        <h3 className="font-medium leading-snug">{p.name}</h3>
        <p className="num shrink-0">{formatBRL(p.priceCents)}</p>
      </div>
      <div className="mt-0.5 text-sm text-tinta-3 sm:flex sm:items-baseline sm:justify-between sm:gap-3">
        <p className="max-sm:hidden">{p.colors[0].name}</p>
        <p className="num shrink-0">{formatBRL(pix)} no Pix</p>
      </div>
    </Link>
  );
}
