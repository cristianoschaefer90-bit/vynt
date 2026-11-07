"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import layout from "@/data/explode.json";
import { gsap, useGSAP } from "@/components/motion";

// Peças da vista explodida do Órbita, de cima para baixo.
// dy/dx = deslocamento (px no quadro de 1100) até a posição "montada".
const PARTS: Record<string, { label: string; spec: string; dy: number; dx?: number; sx?: number }> = {
  cadarco: { label: "Cadarço chato", spec: "Algodão encerado, não desamarra", dy: 302, dx: 40, sx: 0.55 },
  sela: { label: "Painel em sela", spec: "Couro sintético, segura o meio do pé", dy: 228 },
  cabedal: { label: "Cabedal em malha", spec: "Respira no verão, seca rápido", dy: 46 },
  palmilha: { label: "Palmilha removível", spec: "Espuma com memória, lavável", dy: -30 },
  entressola: { label: "Espuma dupla", spec: "38 mm no calcanhar, drop de 8 mm", dy: -60 },
  solado: { label: "Solado de borracha", spec: "Tração em asfalto molhado", dy: -105 },
};

const { W, H, pieces } = layout;
const LW = 380; // coluna de legendas à direita das peças (px no quadro)
const FW = W + LW;
const pct = (v: number, of: number) => `${(v / of) * 100}%`;

export function Explode({ priceLabel }: { priceLabel: string }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const q = gsap.utils.selector(el);
      const mm = gsap.matchMedia();

      mm.add(
        { motion: "(prefers-reduced-motion: no-preference)", desktop: "(min-width: 1024px)" },
        (ctx) => {
          const { desktop } = ctx.conditions as { desktop: boolean };
          const stage = q("[data-stage]")[0] as HTMLElement;
          const unit = () => stage.getBoundingClientRect().width / FW;

          // estado inicial: foto montada visível, peças recolhidas por baixo
          gsap.set(q("[data-part]"), {
            x: (_, t: HTMLElement) => (PARTS[t.dataset.part!].dx ?? 0) * unit(),
            y: (_, t: HTMLElement) => PARTS[t.dataset.part!].dy * unit(),
            scaleX: (_, t: HTMLElement) => PARTS[t.dataset.part!].sx ?? 1,
            opacity: 0,
          });
          gsap.set(q("[data-label]"), { opacity: 0, x: -10 });
          gsap.set(q("[data-step]"), { opacity: 0.28 });

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: el,
              start: "top top",
              end: desktop ? "+=220%" : "+=170%",
              scrub: 0.6,
              pin: q("[data-pin]")[0],
              anticipatePin: 1,
              invalidateOnRefresh: true,
              refreshPriority: 1,
            },
          });
          tl.to(q("[data-whole]"), { opacity: 0, duration: 0.12 }, 0.08)
            .to(q("[data-part]"), { opacity: 1, duration: 0.08 }, 0.08)
            .to(
              q("[data-part]"),
              { x: 0, y: 0, scaleX: 1, duration: 0.6, ease: "expo.out", stagger: { each: 0.04, from: "edges" } },
              0.18,
            )
            .to(q("[data-label]"), { opacity: 1, x: 0, duration: 0.2, stagger: 0.04, ease: "power2.out" }, 0.5)
            .to(q("[data-step='0']"), { opacity: 0.28, duration: 0.05 }, 0.2)
            .to(q("[data-step='1']"), { opacity: 1, duration: 0.05 }, 0.2)
            .to(q("[data-step='1']"), { opacity: 0.28, duration: 0.05 }, 0.55)
            .to(q("[data-step='2']"), { opacity: 1, duration: 0.05 }, 0.55)
            .to({}, { duration: 0.12 });
          gsap.set(q("[data-step='0']"), { opacity: 1 });
        },
      );
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="explode-titulo" className="relative bg-papel">
      <div data-pin className="mx-auto grid min-h-[100svh] max-w-[1440px] items-center gap-6 px-4 py-10 md:px-8 lg:grid-cols-12 lg:py-0">
        <div className="lg:col-span-4">
          <p className="rotulo">Por dentro do Órbita</p>
          <h2 id="explode-titulo" className="mt-3 font-serif text-titulo">
            Seis peças. Nenhuma sobrando.
          </h2>
          <ol className="mt-6 hidden space-y-4 text-tinta-2 lg:block">
            <li data-step="0">
              <span className="num mr-3 text-tinta-3">01</span>Montado, pesa 268 g no nº 40.
            </li>
            <li data-step="1">
              <span className="num mr-3 text-tinta-3">02</span>Cada camada tem uma função, de baixo para cima.
            </li>
            <li data-step="2">
              <span className="num mr-3 text-tinta-3">03</span>Experimenta em casa: se o número não servir, o motoboy troca.
            </li>
          </ol>
          <div className="mt-8 hidden lg:block">
            <Link href="/p/orbita" className="btn btn-tinta">
              Ver o Órbita · {priceLabel}
            </Link>
          </div>
        </div>

        <div className="relative lg:col-span-8">
          <div
            data-stage
            className="relative mx-auto w-full"
            style={{ aspectRatio: `${FW} / ${H}`, maxWidth: `min(100%, calc((100svh - 140px) * ${FW / H}))` }}
          >
            <div data-whole className="absolute inset-y-0 left-0 motion-reduce:hidden" style={{ width: pct(W, FW) }}>
              <Image src="/produtos/orbita/1.webp" alt="Tênis Órbita Runner montado" fill sizes="(min-width: 1024px) 45vw, 75vw" className="object-contain" />
            </div>
            {pieces.map((p) => {
              return (
                <div
                  key={p.name}
                  data-part={p.name}
                  className="absolute will-change-transform"
                  style={{ left: pct(p.x, FW), top: pct(p.y, H), width: pct(p.w, FW), height: pct(p.h, H) }}
                >
                  <Image src={`/explode/${p.name}.webp`} alt="" fill sizes="(min-width: 1024px) 45vw, 80vw" className="object-contain" />
                </div>
              );
            })}
            {pieces.map((p) => {
              const info = PARTS[p.name];
              const cy = p.y + p.h / 2;
              const from = p.x + p.w + 12;
              return (
                <div key={`l-${p.name}`} className="pointer-events-none absolute" style={{ top: pct(cy, H), left: pct(from, FW), right: 0, transform: "translateY(-50%)" }}>
                  <div data-label className="flex items-center">
                  <span aria-hidden className="h-px shrink-0 bg-tinta/40" style={{ width: `${((W + 24 - from) / (FW - from)) * 100}%` }} />
                  <p className="min-w-0 pl-2 text-[0.625rem] leading-tight sm:text-xs">
                    <span className="block font-medium text-tinta">{info.label}</span>
                    <span className="hidden text-tinta-3 md:block">{info.spec}</span>
                  </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 lg:hidden">
            <Link href="/p/orbita" className="btn btn-tinta w-full">
              Ver o Órbita · {priceLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
