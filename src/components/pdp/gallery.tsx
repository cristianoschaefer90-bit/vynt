"use client";

import Image from "next/image";
import { useRef, useState } from "react";

const ALT = ["vista lateral", "detalhe da biqueira e do cabedal", "detalhe do calcanhar"];

/** Desktop: galeria vertical. Celular: carrossel com snap e indicador. */
export function Gallery({ images, name }: { images: string[]; name: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);

  return (
    <div>
      <div
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIdx(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] md:flex-col md:gap-3 md:overflow-visible [&::-webkit-scrollbar]:hidden"
        aria-label={`Fotos do ${name}`}
        role="region"
        tabIndex={0}
      >
        {images.map((src, i) => (
          <div key={src} className="relative aspect-[4/5] w-full shrink-0 snap-center bg-papel-2">
            <Image
              src={src}
              alt={`${name}, ${ALT[i] ?? "foto"}`}
              fill
              priority={i === 0}
              fetchPriority={i === 0 ? "high" : undefined}
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-2 md:hidden" aria-hidden>
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            tabIndex={-1}
            className={`h-1 transition-all duration-500 ease-expo ${i === idx ? "w-8 bg-tinta" : "w-4 bg-linha"}`}
            onClick={() => track.current?.scrollTo({ left: i * track.current.clientWidth, behavior: "smooth" })}
          />
        ))}
      </div>
      <p className="mt-2 px-4 text-xs text-tinta-3 md:px-0">Fotos ilustrativas.</p>
    </div>
  );
}
