"use client";

import { useEffect, useRef, useState } from "react";
import type { Variant } from "@/data/catalogo";
import { cart } from "@/lib/cart";
import { useLive } from "./use-cart-totals";

/** Botão "Comprar" no card: abre a grade de números sobre a foto e coloca na sacola. */
export function QuickAdd({ name, variants, stock }: { name: string; variants: Variant[]; stock?: Record<string, number> }) {
  const [open, setOpen] = useState(false);
  const live = useLive();
  const st = Object.keys(live.stock).length ? live.stock : stock ?? {};
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLButtonElement>("button:not([disabled])")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => !panel.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute inset-x-2 bottom-2 min-h-11 bg-tinta text-sm text-papel transition-[opacity,transform] duration-500 ease-expo md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-visible:translate-y-0 md:focus-visible:opacity-100"
          aria-label={`Comprar ${name}: escolher número`}
        >
          Comprar
        </button>
      )}
      {open && (
        <div ref={panel} role="dialog" aria-label={`Escolha o número do ${name}`} className="absolute inset-x-0 bottom-0 bg-papel/95 p-3 backdrop-blur-sm">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium">Escolha o número</span>
            <button type="button" className="min-h-8 px-1 text-tinta-3 underline" onClick={() => setOpen(false)}>
              Fechar
            </button>
          </div>
          <div className="grid grid-cols-6 gap-1">
            {variants.map((v) => {
              const out = (st[v.sku] ?? v.stock) <= 0;
              return (
                <button
                  key={v.sku}
                  type="button"
                  disabled={out}
                  onClick={() => {
                    cart.add(v.sku);
                    setOpen(false);
                  }}
                  className="num h-9 border border-linha bg-white text-xs hover:border-tinta hover:bg-tinta hover:text-papel disabled:cursor-not-allowed disabled:text-tinta-3/50 disabled:line-through"
                  aria-label={`Número ${v.size}${out ? ", esgotado" : ""}`}
                >
                  {v.size}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
