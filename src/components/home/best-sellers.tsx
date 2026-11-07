"use client";

import Link from "next/link";
import { useRef } from "react";
import { ProductCard } from "@/components/product-card";
import { gsap, useGSAP } from "@/components/motion";
import type { Product } from "@/data/catalogo";

/** Galeria horizontal: pin no desktop (≥1024, sem reduced-motion); no celular, arrasta com snap. */
export function BestSellers({ items }: { items: (Product & { priceCents: number; stockBySku?: Record<string, number> })[] }) {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const track = root.current!.querySelector<HTMLElement>("[data-track]")!;
        const dist = () => Math.max(0, track.scrollWidth - track.clientWidth);
        gsap.to(track.children, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${dist()}`,
            pin: true,
            scrub: 0.5,
            invalidateOnRefresh: true,
          },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="mais-vendidos" className="overflow-hidden bg-papel py-16 lg:flex lg:min-h-[100svh] lg:flex-col lg:justify-center lg:py-0">
      <div className="mx-auto flex w-full max-w-[1440px] items-end justify-between gap-6 px-4 md:px-8">
        <div>
          <p className="rotulo">O que mais sai da prateleira</p>
          <h2 id="mais-vendidos" className="mt-2 font-serif text-titulo">
            Mais vendidos
          </h2>
        </div>
        <Link href="/loja?ordem=vendidos" className="link shrink-0 text-sm">
          Ver todos
        </Link>
      </div>
      <div
        data-track
        className="mt-10 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] md:gap-6 md:px-8 lg:snap-none lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((p, i) => (
          <div key={p.slug} className="w-[78vw] max-w-[360px] shrink-0 snap-start sm:w-[44vw] lg:w-[25vw] lg:max-w-[380px]">
            <p className="num mb-2 text-xs text-tinta-3">{String(i + 1).padStart(2, "0")}</p>
            <ProductCard p={p} stock={p.stockBySku} sizes="(min-width: 1024px) 25vw, 78vw" />
          </div>
        ))}
      </div>
    </section>
  );
}
