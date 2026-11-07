import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { adminConfig, isAdmin } from "@/lib/admin-auth";
import { listOrders, productOverrides, stockMap, type Order } from "@/lib/store";
import { products } from "@/data/catalogo";
import { formatBRL } from "@/lib/money";
import { logout, updateOrder, updateProduct, updateStock } from "@/app/actions/admin";
import { LoginForm } from "@/components/admin/login-form";
import { waLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Painel", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const STATUS: Record<Order["status"], string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  separando: "Separando",
  em_rota: "Em rota",
  pronto_retirada: "Pronto p/ retirar",
  entregue: "Entregue",
  cancelado: "Cancelado",
};
const timeFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

export default async function Admin({ searchParams }: { searchParams: Promise<{ aba?: string; status?: string }> }) {
  const cfg = adminConfig();
  if (!(await isAdmin())) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
        <p className="font-serif text-5xl">Vynt</p>
        <h1 className="rotulo mt-2">Painel da loja</h1>
        {cfg.enabled ? (
          <LoginForm hint={cfg.dev ? "Em desenvolvimento a senha é vynt-demo." : undefined} />
        ) : (
          <p className="mt-6 text-sm text-tinta-2">Defina ADMIN_PASSWORD (8+ caracteres) e ADMIN_SECRET nas variáveis de ambiente para liberar o painel.</p>
        )}
      </div>
    );
  }

  const { aba = "pedidos", status } = await searchParams;
  const [orders, stock, overrides] = await Promise.all([listOrders(), stockMap(), productOverrides()]);
  const filtered = status ? orders.filter((o) => o.status === status) : orders;
  const today = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const todays = orders.filter((o) => new Date(o.createdAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) === today && o.status !== "cancelado");
  const lowStock = products.flatMap((p) => p.variants.filter((v) => (stock[v.sku] ?? 0) <= 1).map((v) => ({ p, v })));

  return (
    <div className="min-h-dvh bg-papel">
      <header className="sticky top-0 z-30 border-b border-linha bg-papel">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 md:px-8">
          <div className="flex items-baseline gap-3">
            <Link href="/" className="font-serif text-3xl">
              Vynt
            </Link>
            <span className="rotulo">Painel</span>
          </div>
          <nav className="flex gap-1 text-sm" aria-label="Seções do painel">
            {[
              ["pedidos", "Pedidos"],
              ["estoque", "Estoque"],
              ["produtos", "Produtos"],
            ].map(([k, l]) => (
              <Link key={k} href={`/admin?aba=${k}`} aria-current={aba === k ? "page" : undefined} className={`inline-flex min-h-11 items-center px-3 ${aba === k ? "bg-tinta text-papel" : ""}`}>
                {l}
              </Link>
            ))}
          </nav>
          <form action={logout}>
            <button className="min-h-11 text-sm underline underline-offset-4">Sair</button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 py-8 md:px-8">
        <dl className="grid grid-cols-2 gap-px border border-linha bg-linha md:grid-cols-4">
          {[
            ["Pedidos hoje", String(todays.length)],
            ["Vendido hoje", formatBRL(todays.reduce((s, o) => s + o.totalCents, 0))],
            ["Aguardando pagamento", String(orders.filter((o) => o.status === "aguardando_pagamento").length)],
            ["Números com ≤ 1 par", String(lowStock.length)],
          ].map(([k, v]) => (
            <div key={k} className="bg-papel p-5">
              <dt className="rotulo">{k}</dt>
              <dd className="num mt-1 font-serif text-4xl">{v}</dd>
            </div>
          ))}
        </dl>

        {aba === "pedidos" && (
          <section className="mt-10">
            <div className="flex flex-wrap gap-2 text-sm">
              <Link href="/admin?aba=pedidos" className={`border px-3 py-2 ${!status ? "border-tinta bg-tinta text-papel" : "border-linha"}`}>
                Todos ({orders.length})
              </Link>
              {Object.entries(STATUS).map(([k, l]) => (
                <Link key={k} href={`/admin?aba=pedidos&status=${k}`} className={`border px-3 py-2 ${status === k ? "border-tinta bg-tinta text-papel" : "border-linha"}`}>
                  {l} ({orders.filter((o) => o.status === k).length})
                </Link>
              ))}
            </div>
            {filtered.length === 0 ? (
              <p className="mt-10 text-tinta-2">Nenhum pedido aqui ainda. Faça um pedido de teste pela loja.</p>
            ) : (
              <ul className="mt-6 space-y-3">
                {filtered.map((o) => (
                  <li key={o.code} className="border border-linha bg-white p-4 md:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="num font-medium">
                          #{o.code} · {o.customer.name}
                        </p>
                        <p className="num text-sm text-tinta-3">
                          {timeFmt.format(new Date(o.createdAt))} · {o.delivery.label} · {o.payment === "pix" ? "Pix" : o.payment === "cartao" ? "Cartão (link)" : "WhatsApp"}
                        </p>
                        <ul className="mt-2 text-sm text-tinta-2">
                          {o.items.map((i) => (
                            <li key={i.sku}>
                              {i.qty}× {i.name} · nº {i.size} <span className="text-tinta-3">({i.sku})</span>
                            </li>
                          ))}
                        </ul>
                        {o.delivery.address && (
                          <p className="mt-1 text-sm text-tinta-3">
                            {o.delivery.address.street}, {o.delivery.address.number} · {o.delivery.address.district} · {o.delivery.address.city}
                          </p>
                        )}
                        {o.notes && <p className="mt-1 text-sm">Obs.: {o.notes}</p>}
                      </div>
                      <div className="text-right">
                        <p className="num text-xl">{formatBRL(o.totalCents)}</p>
                        <a
                          className="text-sm underline underline-offset-4"
                          href={waLink(`Oi, ${o.customer.name.split(" ")[0]}! Aqui é da Vynt, sobre o pedido #${o.code}.`).replace(/wa\.me\/\d+/, `wa.me/55${o.customer.phone}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Chamar cliente
                        </a>
                      </div>
                    </div>
                    <form action={updateOrder} className="mt-4 flex flex-wrap items-end gap-2 border-t border-linha pt-4">
                      <input type="hidden" name="code" value={o.code} />
                      <label className="text-sm">
                        <span className="mb-1 block text-tinta-3">Status</span>
                        <select name="status" defaultValue={o.status} className="h-11 border border-linha bg-white px-2">
                          {Object.entries(STATUS).map(([k, l]) => (
                            <option key={k} value={k}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </label>
                      {o.delivery.method.startsWith("correios") && (
                        <label className="text-sm">
                          <span className="mb-1 block text-tinta-3">Rastreio</span>
                          <input name="tracking" defaultValue={o.tracking} className="h-11 border border-linha bg-white px-2" maxLength={40} />
                        </label>
                      )}
                      <button className="btn btn-tinta !min-h-11">Salvar</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {aba === "estoque" && (
          <section className="mt-10 space-y-8">
            {products.map((p) => (
              <div key={p.slug} className="border border-linha bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="relative size-12 bg-papel-2">
                    <Image src={p.colors[0].thumb} alt="" fill sizes="48px" className="object-contain" />
                  </div>
                  <p className="font-medium">{p.name}</p>
                  <p className="num ml-auto text-sm text-tinta-3">{p.variants.reduce((s, v) => s + (stock[v.sku] ?? 0), 0)} pares</p>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-11">
                  {p.variants.map((v) => (
                    <form key={v.sku} action={updateStock} className="flex flex-col gap-1 text-center text-sm">
                      <input type="hidden" name="sku" value={v.sku} />
                      <label htmlFor={`s-${v.sku}`} className="num text-tinta-3">
                        Nº {v.size}
                      </label>
                      <input
                        id={`s-${v.sku}`}
                        name="qty"
                        type="number"
                        min={0}
                        max={999}
                        defaultValue={stock[v.sku] ?? 0}
                        className={`num h-11 w-full border bg-white text-center ${(stock[v.sku] ?? 0) <= 1 ? "border-telha" : "border-linha"}`}
                      />
                      <button className="min-h-9 border border-linha text-xs hover:bg-tinta hover:text-papel">Salvar</button>
                    </form>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {aba === "produtos" && (
          <section className="mt-10">
            <ul className="divide-y divide-linha border-y border-linha">
              {products.map((p) => {
                const o = overrides[p.slug] ?? {};
                return (
                  <li key={p.slug}>
                    <form action={updateProduct} className="grid grid-cols-[3rem_1fr] items-center gap-4 py-4 sm:grid-cols-[3rem_1fr_10rem_8rem_auto]">
                      <input type="hidden" name="slug" value={p.slug} />
                      <div className="relative size-12 bg-papel-2">
                        <Image src={p.colors[0].thumb} alt="" fill sizes="48px" className="object-contain" />
                      </div>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <Link href={`/p/${p.slug}`} className="text-sm text-tinta-3 underline underline-offset-4">
                          Ver na loja
                        </Link>
                      </div>
                      <label className="text-sm">
                        <span className="sr-only">Preço (R$)</span>
                        <input name="price" inputMode="decimal" defaultValue={((o.priceCents ?? p.priceCents) / 100).toFixed(2).replace(".", ",")} className="campo num !min-h-11" />
                      </label>
                      <label className="flex min-h-11 items-center gap-2 text-sm">
                        <input type="checkbox" name="active" defaultChecked={o.active !== false} className="size-4 accent-tinta" />
                        À venda
                      </label>
                      <button className="btn btn-tinta !min-h-11">Salvar</button>
                    </form>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-sm text-tinta-3">Fotos, descrição e novos modelos: edite src/data/catalogo.ts (veja o README). Com o Supabase ligado, isso vira cadastro aqui no painel.</p>
          </section>
        )}
      </div>
    </div>
  );
}
