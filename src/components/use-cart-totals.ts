"use client";

import { useEffect, useSyncExternalStore } from "react";
import { productBySlug, variantBySku } from "@/data/catalogo";
import { couponDiscount, findCoupon } from "@/lib/coupons";
import { STORE } from "@/lib/config";
import { qtyDiscount } from "@/lib/promo";
import { useCart } from "@/lib/cart";

// Estoque e preço "vivos" (ajustes do admin), buscados do servidor.
interface Live {
  stock: Record<string, number>;
  prices: Record<string, number>;
  inactive: string[];
}
let live: Live = { stock: {}, prices: {}, inactive: [] };
let lastFetch = 0;
const subs = new Set<() => void>();

export function refreshLive(force = false) {
  if (!force && Date.now() - lastFetch < 30_000) return;
  lastFetch = Date.now();
  fetch("/api/estoque", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((j: Live | null) => {
      if (!j) return;
      live = j;
      subs.forEach((f) => f());
    })
    .catch(() => {});
}

export function useLive() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => live,
    () => live,
  );
}

export function useCartTotals() {
  const lines = useCart((s) => s.lines);
  const code = useCart((s) => s.coupon);
  const open = useCart((s) => s.open);
  const l = useLive();
  useEffect(() => {
    refreshLive(open);
  }, [open]);

  const prices: Record<string, number> = {};
  let subtotal = 0;
  let count = 0;
  for (const line of lines) {
    const hit = variantBySku.get(line.sku);
    if (!hit) continue;
    const price = l.prices[hit.product.slug] ?? productBySlug.get(hit.product.slug)!.priceCents;
    prices[hit.product.slug] = price;
    subtotal += price * line.qty;
    count += line.qty;
  }
  const c = findCoupon(code);
  const qty = qtyDiscount(subtotal, count);
  const coupon = c ? couponDiscount(c, subtotal - qty) : 0;
  const net = subtotal - qty - coupon;
  const pixTotal = net - Math.floor((net * STORE.pixDiscountPct) / 100);
  return { subtotal, qty, coupon, net, couponObj: coupon ? c : null, pixTotal, count, prices, stock: l.stock, inactive: l.inactive };
}
