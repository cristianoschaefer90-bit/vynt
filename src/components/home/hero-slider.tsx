"use client";

import { Children, useEffect, useState, type ReactNode } from "react";

/** Capa com até 3 slides: troca suave a cada 7 s, pausa no hover/foco, sem auto com reduced-motion. */
export function HeroSlider({ children, labels }: { children: ReactNode; labels: string[] }) {
  const slides = Children.toArray(children);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(() => setI((v) => (v + 1) % slides.length), 7000);
    return () => clearTimeout(id);
  }, [i, paused, slides.length]);

  return (
    <div
      className="relative h-full"
      role="region"
      aria-roledescription="carrossel"
      aria-label="Destaques da loja"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((s, n) => (
        <div
          key={n}
          role="group"
          aria-roledescription="slide"
          aria-label={`${n + 1} de ${slides.length}: ${labels[n] ?? ""}`}
          aria-hidden={n !== i}
          inert={n !== i}
          className={`absolute inset-0 transition-opacity duration-1000 ease-expo ${n === i ? "z-10 opacity-100" : "z-0 opacity-0"}`}
        >
          {s}
        </div>
      ))}
      {slides.length > 1 && (
        <div className="absolute right-2 top-2 z-20 flex items-center gap-1 md:bottom-8 md:right-8 md:top-auto">
          {slides.map((_, n) => (
            <button
              key={n}
              type="button"
              onClick={() => setI(n)}
              aria-label={`Ver destaque ${n + 1}: ${labels[n] ?? ""}`}
              aria-current={n === i}
              className="flex h-11 w-9 items-center justify-center"
            >
              <span className={`block h-0.5 transition-all duration-500 ease-expo ${n === i ? "w-7 bg-papel" : "w-4 bg-papel/50"}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
