"use client";

import { useState } from "react";
import type { LiveProduct } from "@/lib/catalog-server";
import { cart } from "@/lib/cart";
import { Magnetic } from "@/components/motion";
import { SizePicker } from "@/components/size-picker";
import { useLive } from "@/components/use-cart-totals";

export function HeroAdd({ product }: { product: Pick<LiveProduct, "variants" | "stockBySku" | "name" | "slug"> }) {
  const [sku, setSku] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  const live = useLive();
  const stock = Object.keys(live.stock).length ? live.stock : product.stockBySku;
  const sizes = product.variants;

  return (
    <div className="space-y-4">
      <SizePicker variants={sizes} stock={stock} value={sku} onChange={(s) => { setSku(s); setErr(false); }} error={err} />
      <Magnetic className="w-full">
        <button
          type="button"
          className="btn btn-tinta w-full"
          onClick={() => {
            if (!sku) return setErr(true);
            cart.add(sku);
          }}
        >
          Colocar na sacola
        </button>
      </Magnetic>
    </div>
  );
}
