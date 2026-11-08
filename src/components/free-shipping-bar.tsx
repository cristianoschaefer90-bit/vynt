"use client";

import { formatBRL } from "@/lib/money";
import { FREE_SHIPPING_CENTS, QTY_PROMO } from "@/lib/promo";

/** Barra de progresso até o frete grátis (Correios RS/SC) + dica do "leve 2". */
export function FreeShippingBar({ subtotal, count }: { subtotal: number; count: number }) {
  const left = Math.max(0, FREE_SHIPPING_CENTS - subtotal);
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_CENTS) * 100);
  return (
    <div className="space-y-2 text-sm">
      <p aria-live="polite">
        {left > 0 ? (
          <>
            Faltam <strong className="num font-medium">{formatBRL(left)}</strong> para frete grátis pelos Correios (RS e SC).
          </>
        ) : (
          <strong className="font-medium text-ok">Frete grátis pelos Correios liberado (RS e SC).</strong>
        )}
      </p>
      <div className="h-1 bg-papel-2" role="progressbar" aria-label="Progresso até o frete grátis" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
        <div className="h-full bg-tinta transition-[width] duration-700 ease-expo" style={{ width: `${pct}%` }} />
      </div>
      {count < QTY_PROMO.minQty && <p className="text-tinta-3">Leve mais um par e ganhe {QTY_PROMO.pct}% nos dois.</p>}
    </div>
  );
}
