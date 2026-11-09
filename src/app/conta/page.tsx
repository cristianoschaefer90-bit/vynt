import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { currentCustomer } from "@/lib/customer-auth";
import { addressesOf, ordersOfUser, type Order } from "@/lib/store";
import { formatBRL } from "@/lib/money";
import { AuthPanel } from "@/components/account/auth-panel";
import { DeviceOrders } from "@/components/account/device-orders";
import { AddressForm, DeleteAddress, LogoutButton, ProfileForm } from "@/components/account/account-forms";

export const metadata: Metadata = { title: "Minha conta", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUS: Record<Order["status"], string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  separando: "Separando",
  em_rota: "Saiu para entrega",
  pronto_retirada: "Pronto para retirar",
  entregue: "Entregue",
  cancelado: "Cancelado",
};
const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Sao_Paulo" });

export default async function Conta({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const me = await currentCustomer();
  const { aba = "pedidos" } = await searchParams;

  if (!me) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-6 md:px-8">
        <h1 className="font-serif text-[clamp(2.8rem,7vw,6rem)] leading-none">Minha conta</h1>
        <div className="mt-10 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <AuthPanel />
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <h2 className="font-serif text-3xl">Com a conta você</h2>
            <ul className="mt-4 space-y-3 text-tinta-2">
              <li>Acompanha todos os pedidos em qualquer celular ou computador.</li>
              <li>Compra mais rápido, com dados e endereço já preenchidos.</li>
              <li>Pede troca de número pelo WhatsApp direto do pedido.</li>
            </ul>
            <DeviceOrders />
          </div>
        </div>
      </div>
    );
  }

  const [orders, addresses] = await Promise.all([ordersOfUser(me.id), addressesOf(me.id)]);
  const tabs = [
    ["pedidos", `Pedidos (${orders.length})`],
    ["enderecos", `Endereços (${addresses.length})`],
    ["dados", "Meus dados"],
  ] as const;

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-6 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="rotulo">Minha conta</p>
          <h1 className="mt-1 font-serif text-[clamp(2.6rem,6vw,5rem)] leading-none">Oi, {me.name.split(" ")[0]}.</h1>
        </div>
        <LogoutButton />
      </div>

      <nav aria-label="Seções da conta" className="mt-8 flex gap-6 border-b border-linha">
        {tabs.map(([k, l]) => (
          <Link key={k} href={`/conta?aba=${k}`} aria-current={aba === k ? "page" : undefined} className={`-mb-px inline-flex min-h-12 items-center border-b-2 text-sm ${aba === k ? "border-tinta font-medium" : "border-transparent text-tinta-3"}`}>
            {l}
          </Link>
        ))}
      </nav>

      {aba === "pedidos" && (
        <section aria-label="Pedidos" className="mt-8">
          {orders.length === 0 ? (
            <div>
              <p className="font-serif text-4xl">Nenhum pedido ainda.</p>
              <p className="mt-2 text-tinta-2">Compre logado e o pedido aparece aqui automaticamente.</p>
              <Link href="/loja" className="btn btn-tinta mt-6">
                Ver tênis
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => (
                <li key={o.code}>
                  <Link href={`/pedido/${o.code}?t=${o.token}`} className="grid gap-4 border border-linha bg-white p-4 hover:border-tinta sm:grid-cols-[auto_1fr_auto] sm:items-center md:p-5">
                    <div className="flex -space-x-3">
                      {o.items.slice(0, 3).map((i) => (
                        <span key={i.sku} className="relative size-14 overflow-hidden rounded-full border-2 border-white bg-papel-2">
                          <Image src={i.thumb} alt="" fill sizes="56px" className="object-cover" />
                        </span>
                      ))}
                    </div>
                    <div>
                      <p className="num font-medium">
                        Pedido #{o.code} · {dateFmt.format(new Date(o.createdAt))}
                      </p>
                      <p className="text-sm text-tinta-3">
                        {o.items.map((i) => `${i.qty}× ${i.name} nº ${i.size}`).join(" · ")}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
                      <p className={`text-sm ${o.status === "cancelado" ? "text-telha" : o.status === "entregue" ? "text-ok" : ""}`}>{STATUS[o.status]}</p>
                      <p className="num">{formatBRL(o.totalCents)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {aba === "enderecos" && (
        <section aria-label="Endereços" className="mt-8 grid gap-10 lg:grid-cols-2">
          <ul className="space-y-3">
            {addresses.length === 0 && <li className="text-tinta-2">Nenhum endereço salvo.</li>}
            {addresses.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-4 border border-linha bg-white p-4 text-sm">
                <div>
                  <p className="font-medium">{a.label}</p>
                  <p className="text-tinta-2">
                    {a.street}, {a.number}
                    {a.complement ? ` — ${a.complement}` : ""}
                  </p>
                  <p className="text-tinta-3">
                    {a.district} · {a.city}/{a.uf}
                  </p>
                </div>
                <DeleteAddress id={a.id} />
              </li>
            ))}
          </ul>
          <AddressForm />
        </section>
      )}

      {aba === "dados" && (
        <section aria-label="Meus dados" className="mt-8 max-w-lg">
          <p className="text-sm text-tinta-3">E-mail de acesso: {me.email}</p>
          <ProfileForm initial={{ name: me.name, phone: me.phone }} />
        </section>
      )}
    </div>
  );
}
