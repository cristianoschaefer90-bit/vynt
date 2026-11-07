"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { cart, useCart, useHydrated } from "@/lib/cart";
import { formatBRL } from "@/lib/money";
import { quoteShipping } from "@/app/actions/checkout";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

export function Account() {
  const hydrated = useHydrated();
  const orders = useCart((s) => s.orders);
  const addresses = useCart((s) => s.addresses);
  const profile = useCart((s) => s.profile);
  const [tab, setTab] = useState<"pedidos" | "enderecos" | "dados">("pedidos");

  if (!hydrated) return <div className="h-[40vh]" aria-busy="true" />;

  return (
    <div className="mt-8">
      <div role="tablist" aria-label="Seções da conta" className="flex gap-6 border-b border-linha">
        {(
          [
            ["pedidos", `Pedidos (${orders.length})`],
            ["enderecos", `Endereços (${addresses.length})`],
            ["dados", "Meus dados"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            role="tab"
            id={`tab-${k}`}
            aria-selected={tab === k}
            aria-controls={`painel-${k}`}
            onClick={() => setTab(k)}
            className={`-mb-px min-h-12 border-b-2 text-sm ${tab === k ? "border-tinta font-medium" : "border-transparent text-tinta-3"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-tinta-3">Seus dados ficam salvos só neste aparelho. Comprou em outro celular? Use o link do pedido que enviamos no WhatsApp.</p>

      {tab === "pedidos" && (
        <section role="tabpanel" id="painel-pedidos" aria-labelledby="tab-pedidos" className="mt-8">
          {orders.length === 0 ? (
            <div>
              <p className="font-serif text-4xl">Nenhum pedido por aqui.</p>
              <Link href="/loja" className="btn btn-tinta mt-6">
                Ver tênis
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-linha border-y border-linha">
              {orders.map((o) => (
                <li key={o.code}>
                  <Link href={o.url ?? `/pedido/${o.code}?t=${o.token}`} className="grid grid-cols-[1fr_auto] items-center gap-4 py-5 hover:bg-papel-2/60 sm:grid-cols-[8rem_1fr_auto_auto]">
                    <span className="num font-medium">#{o.code}</span>
                    <span className="hidden text-sm text-tinta-3 sm:block">
                      {dateFmt.format(new Date(o.createdAt))} · {o.items} {o.items === 1 ? "par" : "pares"}
                    </span>
                    <span className="num">{formatBRL(o.totalCents)}</span>
                    <span className="hidden text-sm underline underline-offset-4 sm:block">Acompanhar</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "enderecos" && (
        <section role="tabpanel" id="painel-enderecos" aria-labelledby="tab-enderecos" className="mt-8 grid gap-10 lg:grid-cols-2">
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
                    {a.district} · {a.city}/{a.uf} · <span className="num">{a.cep.replace(/(\d{5})(\d{3})/, "$1-$2")}</span>
                  </p>
                </div>
                <button type="button" className="min-h-10 text-tinta-3 underline underline-offset-4" onClick={() => cart.removeAddress(a.id)}>
                  Remover
                </button>
              </li>
            ))}
          </ul>
          <NewAddress />
        </section>
      )}

      {tab === "dados" && (
        <section role="tabpanel" id="painel-dados" aria-labelledby="tab-dados" className="mt-8 max-w-lg">
          <ProfileForm initial={profile} />
        </section>
      )}
    </div>
  );
}

function NewAddress() {
  const [cep, setCep] = useState("");
  const [addr, setAddr] = useState<{ cep: string; street: string; district: string; city: string; uf: string } | null>(null);
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [label, setLabel] = useState("Casa");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-3 border border-linha p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!addr) return;
        if (!number.trim() || !addr.street.trim()) return setErr("Preencha rua e número.");
        cart.saveAddress({ id: addr.cep + number, label, cep: addr.cep, street: addr.street, number, complement, district: addr.district, city: addr.city, uf: addr.uf });
        setAddr(null);
        setCep("");
        setNumber("");
        setComplement("");
        setErr(null);
      }}
    >
      <h2 className="font-serif text-2xl">Novo endereço</h2>
      <label className="block text-sm">
        CEP
        <input
          className="campo num mt-1.5"
          inputMode="numeric"
          autoComplete="postal-code"
          value={cep}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, "").slice(0, 8);
            setCep(d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d);
            if (d.length === 8)
              start(async () => {
                const r = await quoteShipping(d, 0);
                if (r.ok) {
                  setAddr(r.address);
                  setErr(null);
                } else setErr(r.error);
              });
          }}
        />
      </label>
      {pending && <p className="text-sm text-tinta-3">Buscando…</p>}
      {addr && (
        <>
          <label className="block text-sm">
            Rua
            <input className="campo mt-1.5" value={addr.street} onChange={(e) => setAddr({ ...addr, street: e.target.value })} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              Número
              <input className="campo num mt-1.5" value={number} onChange={(e) => setNumber(e.target.value.slice(0, 10))} />
            </label>
            <label className="block text-sm">
              Apelido
              <input className="campo mt-1.5" value={label} onChange={(e) => setLabel(e.target.value.slice(0, 20))} />
            </label>
          </div>
          <label className="block text-sm">
            Complemento
            <input className="campo mt-1.5" value={complement} onChange={(e) => setComplement(e.target.value.slice(0, 60))} />
          </label>
          <p className="text-sm text-tinta-3">
            {addr.district} · {addr.city}/{addr.uf}
          </p>
        </>
      )}
      {err && <p className="text-sm text-telha">{err}</p>}
      <button type="submit" className="btn btn-tinta w-full" disabled={!addr}>
        Salvar endereço
      </button>
    </form>
  );
}

function ProfileForm({ initial }: { initial: { name: string; phone: string; email: string } }) {
  const [p, setP] = useState(initial);
  const [ok, setOk] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        cart.saveProfile({ ...p, phone: p.phone.replace(/\D/g, "") });
        setOk(true);
      }}
    >
      <label className="block text-sm">
        Nome
        <input className="campo mt-1.5" autoComplete="name" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
      </label>
      <label className="block text-sm">
        WhatsApp
        <input className="campo num mt-1.5" inputMode="tel" autoComplete="tel-national" value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} />
      </label>
      <label className="block text-sm">
        E-mail
        <input className="campo mt-1.5" type="email" autoComplete="email" value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} />
      </label>
      <button type="submit" className="btn btn-tinta">
        Salvar
      </button>
      <p aria-live="polite" className="text-sm text-ok">
        {ok ? "Dados salvos neste aparelho." : ""}
      </p>
    </form>
  );
}
