import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/catalogo";
import { formatBRL, installments } from "@/lib/money";
import { STORE } from "@/lib/config";
import { QuickAdd } from "./quick-add";
import { QTY_PROMO } from "@/lib/promo";

export function ProductCard({
  p,
  priority,
  sizes = "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw",
  outOfStock,
  stock,
}: {
  p: Product & { priceCents: number };
  priority?: boolean;
  sizes?: string;
  outOfStock?: boolean;
  stock?: Record<string, number>;
}) {
  const pix = Math.round(p.priceCents * (1 - STORE.pixDiscountPct / 100));
  const parc = installments(p.priceCents, STORE.maxInstallments, STORE.minInstallmentCents);
  const off = p.compareAtCents ? Math.round((1 - p.priceCents / p.compareAtCents) * 100) : 0;
  const hover = p.lifestyle ?? p.colors[0].images[1];

  return (
    <div className="group relative">
      <div className="relative aspect-[4/5] overflow-hidden bg-papel-2">
        <Link href={`/p/${p.slug}`} className="absolute inset-0 block" tabIndex={-1} aria-hidden>
          <Image
            src={p.colors[0].images[0]}
            alt=""
            fill
            priority={priority}
            sizes={sizes}
            className="object-cover transition-transform duration-[1.2s] ease-expo group-hover:scale-[1.04]"
          />
          <Image src={hover} alt="" fill sizes={sizes} className="object-cover opacity-0 transition-opacity duration-700 ease-expo group-hover:opacity-100 max-md:hidden" />
        </Link>
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1">
          {outOfStock ? (
            <span className="bg-papel px-2 py-1 text-[0.6875rem] uppercase tracking-[0.12em]">Esgotado</span>
          ) : (
            <>
              {p.badge && <span className="bg-papel px-2 py-1 text-[0.6875rem] uppercase tracking-[0.12em]">{p.badge === "novo" ? "Novo" : "Mais vendido"}</span>}
              {off > 0 && <span className="bg-telha px-2 py-1 text-[0.6875rem] uppercase tracking-[0.12em] text-white">−{off}%</span>}
            </>
          )}
        </div>
        {!outOfStock && (
          <span className="pointer-events-none absolute bottom-14 left-3 bg-papel/90 px-2 py-1 text-[0.625rem] uppercase leading-tight tracking-[0.1em] md:bottom-3 md:group-hover:opacity-0">
            −{QTY_PROMO.pct}% levando 2
          </span>
        )}
        {!outOfStock && <QuickAdd name={p.name} variants={p.variants} stock={stock} />}
      </div>
      <Link href={`/p/${p.slug}`} className="block">
        <div className="mt-3 sm:flex sm:items-baseline sm:justify-between sm:gap-3">
          <h3 className="font-medium leading-snug group-hover:underline group-hover:underline-offset-4">{p.name}</h3>
          <p className="num shrink-0">
            {p.compareAtCents && <span className="mr-2 text-sm text-tinta-3 line-through">{formatBRL(p.compareAtCents)}</span>}
            {formatBRL(p.priceCents)}
          </p>
        </div>
        <p className="num mt-0.5 text-sm text-tinta-3">
          {formatBRL(pix)} no Pix · ou {parc.n}× de {formatBRL(parc.each)}
        </p>
      </Link>
    </div>
  );
}
