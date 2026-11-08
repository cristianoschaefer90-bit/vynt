"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { cart, useCart } from "@/lib/cart";
import { variantBySku } from "@/data/catalogo";
import { formatBRL } from "@/lib/money";
import { STORE } from "@/lib/config";
import { QTY_PROMO } from "@/lib/promo";
import { FreeShippingBar } from "./free-shipping-bar";
import { CouponField } from "./coupon-field";
import { useCartTotals } from "./use-cart-totals";

const EASE = [0.16, 1, 0.3, 1] as const;

export function BagSheet() {
  const open = useCart((s) => s.open);
  const lines = useCart((s) => s.lines);
  const path = usePathname();
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const totals = useCartTotals();

  const firstPath = useRef(path);
  useEffect(() => {
    if (path !== firstPath.current) {
      firstPath.current = path;
      cart.open(false);
    }
  }, [path]);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => closeRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cart.open(false);
      if (e.key === "Tab" && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>("a[href],button:not([disabled]),input,select");
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    const ov = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = ov;
      prev?.focus?.();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="presentation">
          <motion.button
            type="button"
            aria-label="Fechar sacola"
            tabIndex={-1}
            className="absolute inset-0 bg-tinta/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.35 }}
            onClick={() => cart.open(false)}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sacola-titulo"
            className="absolute inset-y-0 right-0 flex w-full max-w-[460px] flex-col bg-papel shadow-2xl"
            initial={reduce ? { opacity: 0 } : { x: "100%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={{ duration: reduce ? 0 : 0.6, ease: EASE }}
          >
            <div className="flex items-center justify-between border-b border-linha px-5 py-4">
              <h2 id="sacola-titulo" className="font-serif text-3xl">
                Sacola
              </h2>
              <button ref={closeRef} type="button" onClick={() => cart.open(false)} className="min-h-11 px-2 text-sm underline-offset-4 hover:underline">
                Fechar
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col justify-center gap-6 px-5">
                <p className="font-serif text-4xl leading-tight">Nada aqui ainda.</p>
                <p className="text-tinta-2">Escolhe um par e a gente entrega hoje em Três Coroas.</p>
                <Link href="/loja" className="btn btn-tinta w-full" onClick={() => cart.open(false)}>
                  Ver tênis
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-linha overflow-y-auto overscroll-contain px-5">
                  {lines.map((l) => {
                    const hit = variantBySku.get(l.sku);
                    if (!hit) return null;
                    const { product: p, variant: v } = hit;
                    const sizes = p.variants.filter((x) => x.colorSlug === v.colorSlug);
                    return (
                      <li key={l.sku} className="flex gap-4 py-5">
                        <Link href={`/p/${p.slug}`} className="relative block size-24 shrink-0 bg-papel-2" onClick={() => cart.open(false)}>
                          <Image src={p.colors[0].thumb} alt={p.name} fill sizes="96px" className="object-contain" />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{p.name}</p>
                              <p className="text-sm text-tinta-3">{v.color}</p>
                            </div>
                            <p className="num text-sm">{formatBRL((totals.prices[p.slug] ?? p.priceCents) * l.qty)}</p>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <label className="sr-only" htmlFor={`tam-${l.sku}`}>
                              Numeração
                            </label>
                            <select
                              id={`tam-${l.sku}`}
                              value={l.sku}
                              onChange={(e) => cart.swap(l.sku, e.target.value)}
                              className="h-10 border border-linha bg-white px-2 text-sm"
                            >
                              {sizes.map((s) => (
                                <option key={s.sku} value={s.sku} disabled={s.sku !== l.sku && (totals.stock[s.sku] ?? s.stock) === 0}>
                                  Nº {s.size}
                                  {s.sku !== l.sku && (totals.stock[s.sku] ?? s.stock) === 0 ? " (esgotado)" : ""}
                                </option>
                              ))}
                            </select>
                            <div className="flex h-10 items-center border border-linha bg-white">
                              <button type="button" className="h-full w-10" aria-label="Diminuir quantidade" onClick={() => cart.setQty(l.sku, l.qty - 1)}>
                                −
                              </button>
                              <span className="num w-6 text-center text-sm" aria-live="polite">
                                {l.qty}
                              </span>
                              <button
                                type="button"
                                className="h-full w-10 disabled:opacity-30"
                                aria-label="Aumentar quantidade"
                                disabled={l.qty >= Math.min(10, totals.stock[l.sku] ?? v.stock)}
                                onClick={() => cart.setQty(l.sku, l.qty + 1)}
                              >
                                +
                              </button>
                            </div>
                            <button type="button" className="ml-auto min-h-10 text-sm text-tinta-3 underline-offset-4 hover:underline" onClick={() => cart.setQty(l.sku, 0)}>
                              Remover
                            </button>
                          </div>
                          {(totals.stock[l.sku] ?? v.stock) < l.qty && (
                            <p className="mt-2 text-sm text-telha">Só {totals.stock[l.sku] ?? v.stock} disponível nesse número.</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="space-y-4 border-t border-linha px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
                  <FreeShippingBar subtotal={totals.subtotal} count={totals.count} />
                  <CouponField />
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <dt>Subtotal</dt>
                      <dd className="num">{formatBRL(totals.subtotal)}</dd>
                    </div>
                    {totals.qty > 0 && (
                      <div className="flex justify-between text-ok">
                        <dt>Leve 2 ({QTY_PROMO.pct}% off)</dt>
                        <dd className="num">− {formatBRL(totals.qty)}</dd>
                      </div>
                    )}
                    {totals.coupon > 0 && (
                      <div className="flex justify-between text-ok">
                        <dt>Cupom</dt>
                        <dd className="num">− {formatBRL(totals.coupon)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between text-tinta-3">
                      <dt>No Pix ({STORE.pixDiscountPct}% off)</dt>
                      <dd className="num">{formatBRL(totals.pixTotal)}</dd>
                    </div>
                  </dl>
                  <Link href="/checkout" className="btn btn-tinta w-full" onClick={() => cart.open(false)}>
                    Finalizar compra · {formatBRL(totals.net)}
                  </Link>
                  <p className="text-center text-xs text-tinta-3">Frete calculado no próximo passo. Troca de número grátis em {STORE.freeExchangeDays} dias.</p>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
