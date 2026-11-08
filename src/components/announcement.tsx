"use client";

import { usePathname } from "next/navigation";
import { STORE } from "@/lib/config";

const ITEMS = [
  `Pediu até 16h, recebe hoje em ${STORE.city}`,
  "Leve 2 pares, ganhe 10%",
  "Troca de número grátis",
  `${STORE.pixDiscountPct}% de desconto no Pix`,
  `${STORE.maxInstallments}× sem juros no cartão`,
  "Retire na loja em 1 hora",
  "Originais com nota fiscal",
];

/** Faixa de avisos com rolagem lenta (para em hover e com reduced-motion). */
export function Announcement() {
  const path = usePathname();
  if (path.startsWith("/admin") || path.startsWith("/checkout")) return null;
  const row = (hidden?: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {ITEMS.map((t) => (
        <li key={t} className="flex items-center whitespace-nowrap px-6">
          <span aria-hidden className="mr-6 inline-block size-1 rounded-full bg-telha" />
          {t}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="overflow-hidden bg-tinta py-2 text-[0.6875rem] uppercase tracking-[0.12em] text-papel">
      <p className="sr-only">{ITEMS.join(". ")}</p>
      <div aria-hidden className="flex w-max animate-[faixa_40s_linear_infinite] hover:[animation-play-state:paused] motion-reduce:animate-none">
        {row(true)}
        {row(true)}
      </div>
    </div>
  );
}
