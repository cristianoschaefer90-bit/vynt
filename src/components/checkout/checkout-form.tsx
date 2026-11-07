"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { variantBySku } from "@/data/catalogo";
import { cart, useCart, useHydrated } from "@/lib/cart";
import { formatBRL, installments } from "@/lib/money";
import { STORE } from "@/lib/config";
import { placeOrder, quoteShipping } from "@/app/actions/checkout";
import { CouponField } from "@/components/coupon-field";
import { useCartTotals } from "@/components/use-cart-totals";
import { Magnetic } from "@/components/motion";

type Quote = Extract<Awaited<ReturnType<typeof quoteShipping>>, { ok: true }>;
type Method = "motoboy" | "correios_pac" | "correios_sedex" | "retirada";
type Pay = "pix" | "cartao" | "whatsapp";

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};
const maskCep = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

export function CheckoutForm() {
  const router = useRouter();
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const coupon = useCart((s) => s.coupon);
  const profile = useCart((s) => s.profile);
  const saved = useCart((s) => s.addresses);
  const totals = useCartTotals();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"entrega" | "retirada">("entrega");
  const [cep, setCep] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [cepErr, setCepErr] = useState<string | null>(null);
  const [method, setMethod] = useState<Method | null>(null);
  const [street, setStreet] = useState("");
  const [district, setDistrict] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [pay, setPay] = useState<Pay>("pix");
  const [notes, setNotes] = useState("");
  const [saveData, setSaveData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formErr, setFormErr] = useState<string | null>(null);
  const [cepPending, startCep] = useTransition();
  const [sending, startSend] = useTransition();
  const filled = useRef(false);
  const numberRef = useRef<HTMLInputElement>(null);

  // pré-preenche com o que ficou salvo no aparelho
  useEffect(() => {
    if (!hydrated || filled.current) return;
    filled.current = true;
    if (profile.name) setName(profile.name);
    if (profile.phone) setPhone(maskPhone(profile.phone));
    if (profile.email) setEmail(profile.email);
    const a = saved[0];
    if (a) {
      setCep(maskCep(a.cep));
      setNumber(a.number);
      setComplement(a.complement ?? "");
      lookup(a.cep, a);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const lookup = (raw: string, prefill?: { street: string; district: string }) => {
    const d = raw.replace(/\D/g, "");
    if (d.length !== 8) return;
    setCepErr(null);
    startCep(async () => {
      const r = await quoteShipping(d, totals.subtotal);
      if (!r.ok) {
        setQuote(null);
        setCepErr(r.error);
        return;
      }
      setQuote(r);
      setStreet(r.address.street || prefill?.street || "");
      setDistrict(r.address.district || prefill?.district || "");
      const opts = r.options.filter((o) => o.method !== "retirada");
      setMethod((m) => (m && opts.some((o) => o.method === m) ? m : (opts[0]?.method as Method)));
      if (!prefill) setTimeout(() => numberRef.current?.focus(), 50);
    });
  };

  const deliveryOpts = quote?.options.filter((o) => o.method !== "retirada") ?? [];
  const chosen = mode === "retirada" ? { priceCents: 0, label: "Retirar na loja", eta: "Pronto em 1 hora" } : deliveryOpts.find((o) => o.method === method);
  const shipping = chosen?.priceCents ?? 0;
  const afterCoupon = totals.subtotal - totals.coupon;
  const pixOff = pay === "pix" ? Math.floor((afterCoupon * STORE.pixDiscountPct) / 100) : 0;
  const total = afterCoupon - pixOff + shipping;
  const parc = installments(afterCoupon + shipping, STORE.maxInstallments, STORE.minInstallmentCents);

  const stockIssue = useMemo(
    () => lines.some((l) => (totals.stock[l.sku] ?? variantBySku.get(l.sku)?.variant.stock ?? 0) < l.qty),
    [lines, totals.stock],
  );

  if (!hydrated) return <div className="h-[60vh]" aria-busy="true" />;

  if (!lines.length) {
    return (
      <div className="border border-linha p-10">
        <p className="font-serif text-4xl">Sua sacola está vazia.</p>
        <Link href="/loja" className="btn btn-tinta mt-6">
          Ver tênis
        </Link>
      </div>
    );
  }

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErr(null);
    const errs: Record<string, string> = {};
    if (name.trim().length < 3) errs.name = "Digite seu nome completo";
    const ph = phone.replace(/\D/g, "");
    if (ph.length < 10) errs.phone = "WhatsApp com DDD";
    if (mode === "entrega") {
      if (!quote) errs.cep = "Digite um CEP válido";
      if (!method) errs.delivery = "Escolha a entrega";
      if (!street.trim()) errs.street = "Digite a rua";
      if (!number.trim()) errs.number = "Número da casa";
    }
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(`f-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    const fd = new FormData(e.currentTarget);
    startSend(async () => {
      const r = await placeOrder({
        cart: lines,
        name,
        phone: ph,
        email,
        delivery: mode === "retirada" ? "retirada" : method,
        cep,
        number,
        complement,
        street,
        district,
        payment: pay,
        coupon: coupon ?? undefined,
        notes,
        website: String(fd.get("website") ?? ""),
      });
      if (!r.ok) {
        setFormErr(r.error);
        if (r.fields) setErrors(r.fields);
        if (r.stock) {
          for (const s of r.stock) if (s.available <= 0) cart.setQty(s.sku, 0); else cart.setQty(s.sku, s.available);
        }
        return;
      }
      if (saveData) {
        cart.saveProfile({ name, phone: ph, email });
        if (mode === "entrega" && quote)
          cart.saveAddress({
            id: quote.address.cep + number,
            label: "Casa",
            cep: quote.address.cep,
            street,
            number,
            complement,
            district,
            city: quote.address.city,
            uf: quote.address.uf,
          });
      }
      const url = `/pedido/${r.code}?t=${r.token}${r.snapshot ? `&s=${r.snapshot}` : ""}`;
      cart.saveOrder({ code: r.code, token: r.token, url, totalCents: r.totalCents, createdAt: new Date().toISOString(), items: totals.count });
      cart.clear();
      router.push(url);
    });
  };

  const clear = (k: string) => errors[k] && setErrors(({ [k]: _drop, ...rest }) => (void _drop, rest));
  const err = (k: string) =>
    errors[k] ? (
      <p id={`e-${k}`} className="mt-1.5 text-sm text-telha">
        {errors[k]}
      </p>
    ) : null;
  const inv = (k: string) => ({ "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? `e-${k}` : undefined });

  return (
    <form onSubmit={submit} noValidate className="grid gap-12 lg:grid-cols-12">
      <div className="space-y-12 lg:col-span-7">
        {/* contato */}
        <fieldset className="space-y-4">
          <legend className="mb-4 flex items-baseline gap-3 font-serif text-3xl">
            <span className="num text-base text-tinta-3">1</span>Seus dados
          </legend>
          <div>
            <label htmlFor="f-name" className="mb-1.5 block text-sm">
              Nome completo
            </label>
            <input id="f-name" className="campo" autoComplete="name" value={name} onChange={(e) => { setName(e.target.value); clear("name"); }} {...inv("name")} />
            {err("name")}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="f-phone" className="mb-1.5 block text-sm">
                WhatsApp
              </label>
              <input id="f-phone" className="campo num" inputMode="tel" autoComplete="tel-national" placeholder="(51) 99999-9999" value={phone} onChange={(e) => { setPhone(maskPhone(e.target.value)); clear("phone"); }} {...inv("phone")} />
              {err("phone")}
            </div>
            <div>
              <label htmlFor="f-email" className="mb-1.5 block text-sm">
                E-mail <span className="text-tinta-3">(opcional)</span>
              </label>
              <input id="f-email" type="email" className="campo" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} {...inv("email")} />
              {err("email")}
            </div>
          </div>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        </fieldset>

        {/* entrega */}
        <fieldset className="space-y-4">
          <legend className="mb-4 flex items-baseline gap-3 font-serif text-3xl">
            <span className="num text-base text-tinta-3">2</span>Entrega
          </legend>
          <div role="radiogroup" aria-label="Como receber" className="grid grid-cols-2 border border-tinta p-1">
            {(["entrega", "retirada"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => setMode(m)}
                className={`min-h-11 text-sm transition-colors duration-300 ${mode === m ? "bg-tinta text-papel" : ""}`}
              >
                {m === "entrega" ? "Receber em casa" : "Retirar na loja"}
              </button>
            ))}
          </div>

          {mode === "retirada" ? (
            <div className="border border-linha bg-white p-5 text-sm">
              <p className="font-medium">Pronto em 1 hora, sem custo</p>
              <p className="mt-1 text-tinta-2">{STORE.pickupAddress}</p>
              <p className="text-tinta-3">{STORE.pickupHours}</p>
              <p className="mt-3 text-tinta-2">Avisamos no WhatsApp quando estiver separado. Pode provar e trocar o número na hora.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-[12rem_1fr] sm:items-start">
                <div>
                  <label htmlFor="f-cep" className="mb-1.5 block text-sm">
                    CEP
                  </label>
                  <input
                    id="f-cep"
                    className="campo num"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="95660-000"
                    value={cep}
                    onChange={(e) => {
                      const v = maskCep(e.target.value);
                      setCep(v);
                      clear("cep");
                      if (v.replace(/\D/g, "").length === 8) lookup(v);
                      else setQuote(null);
                    }}
                    {...inv("cep")}
                  />
                  {err("cep")}
                  {cepErr && <p className="mt-1.5 text-sm text-telha">{cepErr}</p>}
                </div>
                <p className="text-sm text-tinta-3 sm:pt-9" aria-live="polite">
                  {cepPending ? "Buscando endereço…" : quote ? `${quote.address.city}/${quote.address.uf}` : (
                    <a className="underline underline-offset-4" href="https://buscacepinter.correios.com.br/" target="_blank" rel="noopener noreferrer">
                      Não sei meu CEP
                    </a>
                  )}
                </p>
              </div>

              {quote && (
                <>
                  <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
                    <div>
                      <label htmlFor="f-street" className="mb-1.5 block text-sm">
                        Rua
                      </label>
                      <input id="f-street" className="campo" autoComplete="address-line1" value={street} onChange={(e) => { setStreet(e.target.value); clear("street"); }} {...inv("street")} />
                      {err("street")}
                    </div>
                    <div>
                      <label htmlFor="f-number" className="mb-1.5 block text-sm">
                        Número
                      </label>
                      <input id="f-number" ref={numberRef} className="campo num" inputMode="numeric" autoComplete="address-line2" value={number} onChange={(e) => { setNumber(e.target.value.slice(0, 10)); clear("number"); }} {...inv("number")} />
                      {err("number")}
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="f-district" className="mb-1.5 block text-sm">
                        Bairro
                      </label>
                      <input id="f-district" className="campo" value={district} onChange={(e) => setDistrict(e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="f-complement" className="mb-1.5 block text-sm">
                        Complemento <span className="text-tinta-3">(opcional)</span>
                      </label>
                      <input id="f-complement" className="campo" value={complement} onChange={(e) => setComplement(e.target.value.slice(0, 60))} />
                    </div>
                  </div>

                  <div role="radiogroup" aria-label="Opções de entrega" id="f-delivery" tabIndex={-1} className="space-y-2">
                    {deliveryOpts.map((o) => (
                      <label key={o.method} className="opcao">
                        <input type="radio" name="delivery" className="mt-1 size-4 accent-tinta" checked={method === o.method} onChange={() => { setMethod(o.method as Method); clear("delivery"); }} />
                        <span className="flex-1">
                          <span className="flex justify-between gap-3">
                            <span className="font-medium">{o.label}</span>
                            <span className="num">{o.priceCents === 0 ? "Grátis" : formatBRL(o.priceCents)}</span>
                          </span>
                          <span className="block text-sm text-tinta-3">
                            {o.eta}
                            {o.note ? ` · ${o.note}` : ""}
                          </span>
                        </span>
                      </label>
                    ))}
                    {err("delivery")}
                  </div>
                </>
              )}
            </>
          )}
        </fieldset>

        {/* pagamento */}
        <fieldset className="space-y-2">
          <legend className="mb-4 flex items-baseline gap-3 font-serif text-3xl">
            <span className="num text-base text-tinta-3">3</span>Pagamento
          </legend>
          {(
            [
              { v: "pix", t: `Pix · ${STORE.pixDiscountPct}% de desconto`, d: "QR Code e copia e cola na próxima tela. Confirmamos na hora." },
              { v: "cartao", t: `Cartão em até ${parc.n}× sem juros`, d: "Mandamos um link de pagamento seguro no seu WhatsApp." },
              { v: "whatsapp", t: "Combinar no WhatsApp", d: "Fecha o pagamento direto com a gente. Na retirada, dá pra pagar na loja." },
            ] as const
          ).map((o) => (
            <label key={o.v} className="opcao">
              <input type="radio" name="payment" className="mt-1 size-4 accent-tinta" checked={pay === o.v} onChange={() => setPay(o.v)} />
              <span>
                <span className="block font-medium">{o.t}</span>
                <span className="block text-sm text-tinta-3">{o.d}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <div>
          <label htmlFor="f-notes" className="mb-1.5 block text-sm">
            Observações <span className="text-tinta-3">(opcional)</span>
          </label>
          <textarea id="f-notes" rows={3} className="campo" placeholder="Ponto de referência, horário melhor para receber…" value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 300))} />
          <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" className="size-4 accent-tinta" checked={saveData} onChange={(e) => setSaveData(e.target.checked)} />
            Salvar meus dados neste aparelho para a próxima compra
          </label>
        </div>
      </div>

      {/* resumo */}
      <aside aria-labelledby="resumo" className="lg:col-span-5">
        <div className="border border-linha bg-white p-5 lg:sticky lg:top-[calc(var(--barra)+16px)] md:p-6">
          <h2 id="resumo" className="font-serif text-3xl">
            Resumo
          </h2>
          <ul className="mt-4 divide-y divide-linha">
            {lines.map((l) => {
              const hit = variantBySku.get(l.sku);
              if (!hit) return null;
              const price = totals.prices[hit.product.slug] ?? hit.product.priceCents;
              return (
                <li key={l.sku} className="flex gap-3 py-3">
                  <div className="relative size-16 shrink-0 bg-papel-2">
                    <Image src={hit.product.colors[0].thumb} alt="" fill sizes="64px" className="object-contain" />
                    <span className="num absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-tinta text-[0.7rem] text-papel">{l.qty}</span>
                  </div>
                  <div className="flex flex-1 justify-between gap-3 text-sm">
                    <div>
                      <p className="font-medium">{hit.product.name}</p>
                      <p className="text-tinta-3">Nº {hit.variant.size}</p>
                    </div>
                    <p className="num">{formatBRL(price * l.qty)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-2 border-t border-linha pt-4">
            <CouponField />
          </div>
          <dl className="mt-4 space-y-1.5 border-t border-linha pt-4 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="num">{formatBRL(totals.subtotal)}</dd>
            </div>
            {totals.coupon > 0 && (
              <div className="flex justify-between text-ok">
                <dt>Cupom {coupon}</dt>
                <dd className="num">− {formatBRL(totals.coupon)}</dd>
              </div>
            )}
            {pixOff > 0 && (
              <div className="flex justify-between text-ok">
                <dt>Desconto Pix</dt>
                <dd className="num">− {formatBRL(pixOff)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Entrega</dt>
              <dd className="num">{chosen ? (shipping === 0 ? "Grátis" : formatBRL(shipping)) : "—"}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-linha pt-3">
              <dt className="font-medium">Total</dt>
              <dd className="num text-2xl">{formatBRL(total)}</dd>
            </div>
            {pay === "cartao" && (
              <p className="num text-right text-tinta-3">
                ou {parc.n}× de {formatBRL(parc.each)}
              </p>
            )}
          </dl>

          {formErr && (
            <p role="alert" className="mt-4 border-l-2 border-telha pl-3 text-sm text-telha">
              {formErr}
            </p>
          )}
          {stockIssue && <p className="mt-4 text-sm text-telha">Algum número tem menos pares do que na sacola. Ajuste antes de enviar.</p>}

          <Magnetic className="mt-5 w-full">
            <button type="submit" className="btn btn-telha w-full" disabled={sending || stockIssue}>
              {sending ? "Enviando pedido…" : pay === "pix" ? `Gerar Pix · ${formatBRL(total)}` : pay === "cartao" ? "Pedir link do cartão" : "Enviar pedido no WhatsApp"}
            </button>
          </Magnetic>
          <p className="mt-3 text-center text-xs text-tinta-3">Preço, frete e estoque conferidos no servidor antes de confirmar.</p>
        </div>
      </aside>
    </form>
  );
}
