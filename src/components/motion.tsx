"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

export const EXPO = "expo.out";

/** Botão/Link magnético: segue o ponteiro de leve (só mouse, sem reduced-motion). Sem dependência extra. */
export function Magnetic({ children, strength = 0.28, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "expo.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "expo.out" });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const leave = () => {
      xTo(0);
      yTo(0);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [strength]);
  return (
    <span ref={ref} className={`inline-flex ${className ?? ""}`}>
      {children}
    </span>
  );
}

/** Título revelado por máscara, linha a linha. */
export function MaskTitle({
  as: Tag = "h2",
  children,
  className,
  delay = 0,
  immediate = false,
}: {
  as?: "h1" | "h2" | "h3" | "p";
  children: ReactNode;
  className?: string;
  delay?: number;
  immediate?: boolean;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        let split: SplitText | null = null;
        const run = () => {
          split = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "linha-mask", aria: "none" });
          gsap.set(el, { opacity: 1 });
          gsap.fromTo(
            split.lines,
            { yPercent: 108 },
            {
              yPercent: 0,
              duration: 1.15,
              ease: EXPO,
              stagger: 0.09,
              delay,
              scrollTrigger: immediate ? undefined : { trigger: el, start: "top 88%", once: true },
            },
          );
        };
        if (document.fonts?.status === "loaded") run();
        else document.fonts.ready.then(run);
        return () => split?.revert();
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(el, { opacity: 1 });
      });
    },
    { scope: ref },
  );
  return (
    <Tag ref={ref} className={`surge ${className ?? ""}`}>
      {children}
    </Tag>
  );
}

/** Bloco que sobe e aparece ao entrar na tela. */
export function Reveal({ children, className, y = 28, delay = 0, immediate = false }: { children: ReactNode; className?: string; y?: number; delay?: number; immediate?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          el,
          { opacity: 0, y },
          { opacity: 1, y: 0, duration: 1.1, ease: EXPO, delay, scrollTrigger: immediate ? undefined : { trigger: el, start: "top 95%", once: true } },
        );
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(el, { opacity: 1 });
      });
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={`surge ${className ?? ""}`}>
      {children}
    </div>
  );
}

/** Número que conta até o valor final (o valor real fica em sr-only). */
export function CountUp({ value, decimals = 0, suffix = "", className }: { value: number; decimals?: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const o = { v: 0 };
        el.textContent = fmt(0);
        gsap.to(o, {
          v: value,
          duration: 1.8,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: () => {
            el.textContent = fmt(o.v);
          },
        });
      });
    },
    { scope: ref, dependencies: [value] },
  );
  return (
    <span className={className}>
      <span className="sr-only">{fmt(value)}</span>
      <span ref={ref} aria-hidden className="num">
        {fmt(value)}
      </span>
    </span>
  );
}

export { gsap, ScrollTrigger, useGSAP };
