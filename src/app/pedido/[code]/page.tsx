import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { getOrder, type Order } from "@/lib/store";
import { readOrder } from "@/lib/order-snapshot";
import { pixConfig, STORE } from "@/lib/config";
import { pixPayload } from "@/lib/pix";
import { formatBRL } from "@/lib/money";
import { waLink } from "@/lib/whatsapp";
import { CopyButton } from "@/components/order/copy-button";
import { AutoRefresh } from "@/components/order/auto-refresh";
import { currentCustomer } from "@/lib/customer-auth";
import { AuthPanel } from "@/components/account/auth-panel";
import { LinkOrderButton } from "@/components/order/link-order";

export const metadata: Metadata = { title: "Seu pedido", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const STEPS: { key: Order["status"]; label: string; retirada?: string }[] = [
  { key: "aguardando_pagamento", label: "Pedido recebido" },
  { key: "pago", label: "Pagamento confirmado" },
  { key: "separando", label: "Separando seu par" },
  { key: "em_rota", label: "Saiu para entrega", retirada: "Pronto para retirar" },
  { key: "entregue", label: "Entregue", retirada: "Retirado" },
];

const timeFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

export default async function Pedido({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ t?: string; s?: string }> }) {
  const { code } = await params;
  const { t, s } = await searchParams;
  const valid = /^\d+$/.test(code);
  const live = valid && t && /^[a-f0-9]{32}$/.test(t) ? await getOrder(Number(code), t) : null;
  const order = live ?? (valid && s ? readOrder(s, Number(code)) : null);

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24">
        <h1 className="font-serif text-5xl">Pedido não encontrado</h1>
        <p className="mt-4 text-tinta-2">Confere o link que você recebeu ou fala com a gente.</p>
        <a className="btn btn-tinta mt-8" href={waLink(`Oi, Vynt! Não estou achando meu pedido #${code}.`)} target="_blank" rel="noopener noreferrer">
          Falar no WhatsApp
        </a>
      </div>
    );
  }

  const me = await currentCustomer();
  const pickup = order.delivery.method === "retirada";
  const statusIdx = order.status === "pronto_retirada" ? 3 : STEPS.findIndex((s) => s.key === order.status);
  const cancelled = order.status === "cancelado";
  const whenOf = (k: Order["status"]) =>
    order.history.find((h) => h.status === k || (k === "em_rota" && h.status === "pronto_retirada"))?.at;

  const pix = order.payment === "pix" && order.status === "aguardando_pagamento" ? pixConfig() : null;
  const payload = pix ? pixPayload({ ...pix, amountCents: order.totalCents, txid: `VYNT${order.code}` }) : null;
  const qr = payload ? await QRCode.toString(payload, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#151515", light: "#ffffff" } }) : null;

  const waMsg =
    order.payment === "cartao"
      ? `Oi, Vynt! Fiz o pedido #${order.code} (${formatBRL(order.totalCents)}). Pode me mandar o link do cartão?`
      : order.payment === "pix"
        ? `Oi, Vynt! Paguei o Pix do pedido #${order.code} (${formatBRL(order.totalCents)}). Segue o comprovante.`
        : `Oi, Vynt! Quero combinar o pagamento do pedido #${order.code} (${formatBRL(order.totalCents)}).`;

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-24 pt-8 md:px-8">
      <AutoRefresh active={!cancelled && order.status !== "entregue"} />
      <p className="rotulo num">Pedido #{order.code}</p>
      <h1 className="mt-2 font-serif text-[clamp(2.8rem,7vw,6rem)] leading-[0.92]">
        {cancelled ? "Pedido cancelado." : order.status === "aguardando_pagamento" ? (order.payment === "pix" ? "Falta só o Pix." : "Pedido recebido.") : "Tudo certo."}
      </h1>
      <p className="mt-4 max-w-xl text-lg text-tinta-2">
        {cancelled
          ? "Se foi engano, chama a gente no WhatsApp."
          : pickup
            ? "Avisamos no WhatsApp quando estiver separado na loja."
            : `${order.delivery.label}: ${order.delivery.eta.toLowerCase()}.`}
      </p>

      <div className="mt-12 grid gap-12 lg:grid-cols-12">
        <div className="space-y-12 lg:col-span-7">
          {qr && payload && (
            <section aria-labelledby="pix-titulo" className="border border-tinta bg-white p-6 md:p-8">
              <h2 id="pix-titulo" className="font-serif text-3xl">
                Pague com Pix
              </h2>
              <p className="num mt-1 text-2xl">{formatBRL(order.totalCents)}</p>
              <div className="mt-6 grid gap-6 sm:grid-cols-[200px_1fr] sm:items-center">
                <div className="mx-auto w-[200px] [&_svg]:h-auto [&_svg]:w-full" role="img" aria-label="QR Code do Pix" dangerouslySetInnerHTML={{ __html: qr }} />
                <div className="min-w-0 space-y-3 text-sm">
                  <p className="text-tinta-2">No celular, copie o código e cole no app do banco em Pix → Copia e cola.</p>
                  <p className="break-all border border-linha bg-papel p-3 font-mono text-xs text-tinta-2">{payload}</p>
                  <CopyButton text={payload} />
                </div>
              </div>
              {STORE.demo && <p className="mt-4 text-xs text-telha">Demonstração: a chave Pix é fictícia. Não pague este código.</p>}
            </section>
          )}

          {!cancelled && (
            <section aria-labelledby="status-titulo">
              <h2 id="status-titulo" className="rotulo !text-tinta">
                Acompanhe
              </h2>
              <ol className="mt-6 space-y-0">
                {STEPS.map((s, i) => {
                  const done = i <= statusIdx;
                  const at = done ? whenOf(s.key) : undefined;
                  return (
                    <li key={s.key} className="grid grid-cols-[1.5rem_1fr] gap-4" aria-current={i === statusIdx ? "step" : undefined}>
                      <div className="flex flex-col items-center">
                        <span className={`mt-1.5 size-3 rounded-full border ${done ? "border-tinta bg-tinta" : "border-linha bg-papel"} ${i === statusIdx ? "ring-4 ring-telha/25" : ""}`} />
                        {i < STEPS.length - 1 && <span className={`w-px flex-1 ${i < statusIdx ? "bg-tinta" : "bg-linha"}`} />}
                      </div>
                      <div className="pb-7">
                        <p className={done ? "font-medium" : "text-tinta-3"}>{pickup && s.retirada ? s.retirada : s.label}</p>
                        {at && <p className="num text-sm text-tinta-3">{timeFmt.format(new Date(at))}</p>}
                        {s.key === "em_rota" && order.tracking && <p className="text-sm text-tinta-2">Rastreio: {order.tracking}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {!order.userId && order.token && (
            <section aria-labelledby="salvar-titulo" className="border border-linha bg-white p-6">
              <h2 id="salvar-titulo" className="font-serif text-3xl">
                Salve este pedido na sua conta
              </h2>
              <p className="mt-1 text-sm text-tinta-2">Acompanhe todos os pedidos de qualquer celular e compre mais rápido na próxima.</p>
              <div className="mt-5">
                {me ? (
                  <LinkOrderButton code={order.code} token={order.token} />
                ) : (
                  <AuthPanel defaultMode="criar" initial={{ name: order.customer.name, email: order.customer.email, phone: order.customer.phone }} />
                )}
              </div>
            </section>
          )}

          <a className="btn btn-tinta w-full sm:w-auto" href={waLink(waMsg)} target="_blank" rel="noopener noreferrer">
            {order.payment === "cartao" ? "Pedir o link do cartão no WhatsApp" : order.payment === "pix" ? "Enviar comprovante no WhatsApp" : "Combinar no WhatsApp"}
          </a>
        </div>

        <aside className="lg:col-span-5">
          <div className="border border-linha bg-white p-6">
            <h2 className="font-serif text-2xl">Resumo</h2>
            <ul className="mt-4 divide-y divide-linha">
              {order.items.map((i) => (
                <li key={i.sku} className="flex gap-3 py-3 text-sm">
                  <div className="relative size-14 shrink-0 bg-papel-2">
                    <Image src={i.thumb} alt="" fill sizes="56px" className="object-contain" />
                  </div>
                  <div className="flex flex-1 justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {i.qty}× {i.name}
                      </p>
                      <p className="text-tinta-3">Nº {i.size}</p>
                    </div>
                    <p className="num">{formatBRL(i.unitCents * i.qty)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1.5 border-t border-linha pt-3 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="num">{formatBRL(order.subtotalCents)}</dd>
              </div>
              {(order.qtyCents ?? 0) > 0 && (
                <div className="flex justify-between text-ok">
                  <dt>Leve 2</dt>
                  <dd className="num">− {formatBRL(order.qtyCents!)}</dd>
                </div>
              )}
              {order.couponCents > 0 && (
                <div className="flex justify-between text-ok">
                  <dt>Cupom {order.couponCode}</dt>
                  <dd className="num">− {formatBRL(order.couponCents)}</dd>
                </div>
              )}
              {order.pixCents > 0 && (
                <div className="flex justify-between text-ok">
                  <dt>Desconto Pix</dt>
                  <dd className="num">− {formatBRL(order.pixCents)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>{order.delivery.label}</dt>
                <dd className="num">{order.shippingCents ? formatBRL(order.shippingCents) : "Grátis"}</dd>
              </div>
              <div className="flex justify-between border-t border-linha pt-2 text-base">
                <dt className="font-medium">Total</dt>
                <dd className="num">{formatBRL(order.totalCents)}</dd>
              </div>
            </dl>
            {order.delivery.address && (
              <p className="mt-4 border-t border-linha pt-4 text-sm text-tinta-2">
                {order.delivery.address.street}, {order.delivery.address.number}
                {order.delivery.address.complement ? ` — ${order.delivery.address.complement}` : ""}
                <br />
                {order.delivery.address.district} · {order.delivery.address.city}/{order.delivery.address.uf}
              </p>
            )}
            {pickup && <p className="mt-4 border-t border-linha pt-4 text-sm text-tinta-2">{STORE.pickupAddress}</p>}
          </div>
          <p className="mt-4 text-sm text-tinta-3">
            Guarde este link: ele mostra o status do pedido. Também fica em{" "}
            <Link href="/conta" className="underline underline-offset-4">
              Minha conta
            </Link>
            .
          </p>
        </aside>
      </div>
    </div>
  );
}
