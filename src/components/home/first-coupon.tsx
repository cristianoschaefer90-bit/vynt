"use client";

import { useState } from "react";
import { cart, useCart } from "@/lib/cart";
import { QTY_PROMO } from "@/lib/promo";

/** Faixa do cupom de primeira compra (sem pop-up): aplica na sacola com um toque. */
export function FirstCoupon() {
  const applied = useCart((s) => s.coupon === "PRIMEIRO10");
  const [done, setDone] = useState(false);
  return (
    <div className="grid gap-4 border border-tinta p-5 md:grid-cols-[1fr_auto_1fr] md:items-center md:p-6">
      <p className="font-serif text-3xl leading-tight md:text-4xl">Primeira compra? 10% off.</p>
      <button
        type="button"
        onClick={() => {
          cart.setCoupon("PRIMEIRO10");
          setDone(true);
        }}
        className="btn btn-linha font-mono tracking-widest"
        aria-describedby="cupom-ajuda"
      >
        {applied || done ? "PRIMEIRO10 aplicado" : "Usar PRIMEIRO10"}
      </button>
      <p id="cupom-ajuda" className="text-sm text-tinta-2 md:text-right">
        Vale para o primeiro pedido. Leve 2 pares e ganhe mais {QTY_PROMO.pct}%, somado ao Pix.
      </p>
    </div>
  );
}
