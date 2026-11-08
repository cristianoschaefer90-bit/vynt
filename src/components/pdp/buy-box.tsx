"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { Variant } from "@/data/catalogo";
import { cart } from "@/lib/cart";
import { formatBRL } from "@/lib/money";
import { STORE } from "@/lib/config";
import { waLink } from "@/lib/whatsapp";
import { quoteShipping } from "@/app/actions/checkout";
import { Magnetic } from "@/components/motion";
import { SizePicker } from "@/components/size-picker";
import { useLive } from "@/components/use-cart-totals";
import { SameDay } from "@/components/same-day";
import { SizeGuide } from "./size-guide";
import { QTY_PROMO } from "@/lib/promo";

type Quote = Awaited<ReturnType<typeof quoteShipping>>;

export function BuyBox({ slug, name, variants, stock, priceCents }: { slug: string; name: string; variants: Variant[]; stock: Record<string, number>; priceCents: number }) {
  const router = useRouter();
  const live = useLive();
  const st = Object.keys(live.stock).length ? live.stock : stock;
  const [sku, setSku] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  const [cep, setCep] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [pending, start] = useTransition();
  const soldOut = variants.every((v) => (st[v.sku] ?? v.stock) <= 0);
  const size = variants.find((v) => v.sku === sku)?.size;
  const ctaRef = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(false);

  // barra fixa no celular quando os botões principais saem da tela
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const add = (go: boolean) => {
    if (!sku) return setErr(true);
    cart.add(sku);
    if (go) {
      cart.open(false);
      router.push("/checkout");
    }
  };

  return (
    <div className="space-y-6">
      {soldOut ? (
        <div className="space-y-3">
          <p className="font-medium">Esgotado em todos os números.</p>
          <a className="btn btn-linha w-full" href={waLink(`Oi, Vynt! Quero ser avisado quando o ${name} voltar.`)} target="_blank" rel="noopener noreferrer">
            Avisar quando voltar
          </a>
        </div>
      ) : (
        <>
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>
                Numeração{size ? <span className="ml-1 font-medium">· {size}</span> : null}
              </span>
              <SizeGuide />
            </div>
            <SizePicker variants={variants} stock={st} value={sku} onChange={(s) => { setSku(s); setErr(false); }} error={err} />
          </div>
          <div ref={ctaRef} className="grid gap-2 sm:grid-cols-2">
            <Magnetic className="w-full">
              <button type="button" className="btn btn-tinta w-full" onClick={() => add(false)}>
                Colocar na sacola
              </button>
            </Magnetic>
            <button type="button" className="btn btn-linha w-full" onClick={() => add(true)}>
              Comprar agora
            </button>
          </div>
        </>
      )}

      <div className="space-y-1 border-l-2 border-telha pl-3 text-sm">
        <SameDay />
        <p className="text-tinta-2">
          Leve 2 pares e ganhe <strong className="font-medium">{QTY_PROMO.pct}%</strong> nos dois.{" "}
          <a className="underline underline-offset-4" href={waLink(`Oi, Vynt! Qual número do ${name} eu pego? Uso __ em outro tênis.`)} target="_blank" rel="noopener noreferrer">
            Dúvida no número? Chama no WhatsApp
          </a>
        </p>
      </div>

      <form
        className="border-t border-linha pt-5"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => setQuote(await quoteShipping(cep, priceCents)));
        }}
      >
        <label htmlFor={`cep-${slug}`} className="text-sm font-medium">
          Calcular entrega
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id={`cep-${slug}`}
            className="campo num !min-h-11"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            value={cep}
            onChange={(e) => {
              const d = e.target.value.replace(/\D/g, "").slice(0, 8);
              setCep(d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d);
            }}
          />
          <button type="submit" className="btn btn-linha !min-h-11 shrink-0" disabled={pending || cep.replace(/\D/g, "").length !== 8}>
            {pending ? "…" : "Calcular"}
          </button>
        </div>
        <div aria-live="polite">
          {quote && !quote.ok && <p className="mt-2 text-sm text-telha">{quote.error}</p>}
          {quote?.ok && (
            <div className="mt-3">
              <p className="text-sm text-tinta-3">
                {quote.address.city}/{quote.address.uf}
              </p>
              <ul className="mt-2 divide-y divide-linha text-sm">
                {quote.options.map((o) => (
                  <li key={o.method} className="flex items-start justify-between gap-4 py-2.5">
                    <div>
                      <p className="font-medium">{o.label}</p>
                      <p className="text-tinta-3">{o.eta}</p>
                    </div>
                    <p className="num shrink-0">{o.priceCents === 0 ? "Grátis" : formatBRL(o.priceCents)}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </form>

      {!soldOut && (
        <div
          aria-hidden={!showBar}
          className={`fixed inset-x-0 bottom-0 z-30 border-t border-linha bg-papel/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm transition-transform duration-500 ease-expo md:hidden ${showBar ? "translate-y-0" : "translate-y-full"}`}
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="num text-sm text-tinta-3">
                {formatBRL(priceCents)}
                {size ? ` · nº ${size}` : ""}
              </p>
            </div>
            <button
              type="button"
              tabIndex={showBar ? 0 : -1}
              className="btn btn-tinta !min-h-12 shrink-0"
              onClick={() => {
                if (sku) return add(false);
                ctaRef.current?.parentElement?.scrollIntoView({ behavior: "smooth", block: "center" });
                setErr(true);
              }}
            >
              {sku ? "Colocar na sacola" : "Escolher número"}
            </button>
          </div>
        </div>
      )}

      <ul className="space-y-2 border-t border-linha pt-5 text-sm text-tinta-2">
        <li>Original, com nota fiscal.</li>
        <li>Troca de número grátis em {STORE.freeExchangeDays} dias, buscamos na sua casa no Vale.</li>
        <li>Retirada na loja em 1 hora.</li>
      </ul>
    </div>
  );
}
