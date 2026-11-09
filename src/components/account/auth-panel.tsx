"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { login, signup, type AuthResult } from "@/app/actions/account";
import { useCart } from "@/lib/cart";

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

/** Entrar / Criar conta. Pedidos feitos neste aparelho são vinculados à conta. */
export function AuthPanel({ defaultMode = "entrar", initial, onDone }: { defaultMode?: "entrar" | "criar"; initial?: { name?: string; email?: string; phone?: string }; onDone?: () => void }) {
  const router = useRouter();
  const deviceOrders = useCart((s) => s.orders);
  const [mode, setMode] = useState(defaultMode);
  const [res, setRes] = useState<AuthResult | null>(null);
  const [pending, start] = useTransition();
  const [phone, setPhone] = useState(initial?.phone ? maskPhone(initial.phone) : "");
  const [show, setShow] = useState(false);
  const proofs = deviceOrders.map((o) => ({ code: o.code, token: o.token }));
  const f = res && !res.ok ? res.fields ?? {} : {};
  const err = (k: string) => f[k] && <p id={`e-${k}`} className="mt-1.5 text-sm text-telha">{f[k]}</p>;
  const inv = (k: string) => ({ "aria-invalid": f[k] ? true : undefined, "aria-describedby": f[k] ? `e-${k}` : undefined });

  return (
    <div>
      <div role="tablist" aria-label="Acesso" className="grid grid-cols-2 border border-tinta p-1">
        {(
          [
            ["entrar", "Entrar"],
            ["criar", "Criar conta"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            role="tab"
            type="button"
            aria-selected={mode === k}
            onClick={() => {
              setMode(k);
              setRes(null);
            }}
            className={`min-h-11 text-sm transition-colors ${mode === k ? "bg-tinta text-papel" : ""}`}
          >
            {l}
          </button>
        ))}
      </div>

      <form
        className="mt-6 space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const data = Object.fromEntries(fd) as Record<string, string>;
          start(async () => {
            const r = mode === "entrar" ? await login({ ...data, proofs }) : await signup({ ...data, phone, proofs });
            setRes(r);
            if (r.ok) {
              onDone?.();
              router.refresh();
            }
          });
        }}
      >
        {mode === "criar" && (
          <>
            <label className="block text-sm">
              Nome completo
              <input name="name" defaultValue={initial?.name} autoComplete="name" className="campo mt-1.5" {...inv("name")} />
              {err("name")}
            </label>
            <label className="block text-sm">
              WhatsApp
              <input name="phone" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} inputMode="tel" autoComplete="tel-national" placeholder="(51) 99999-9999" className="campo num mt-1.5" {...inv("phone")} />
              {err("phone")}
            </label>
          </>
        )}
        <label className="block text-sm">
          E-mail
          <input name="email" type="email" defaultValue={initial?.email} autoComplete="email" className="campo mt-1.5" {...inv("email")} />
          {err("email")}
        </label>
        <label className="block text-sm">
          Senha
          <span className="relative mt-1.5 block">
            <input
              name="password"
              type={show ? "text" : "password"}
              autoComplete={mode === "entrar" ? "current-password" : "new-password"}
              className="campo pr-20"
              aria-invalid={f.password ? true : undefined}
              aria-describedby={[mode === "criar" ? "senha-ajuda" : "", f.password ? "e-password" : ""].filter(Boolean).join(" ") || undefined}
            />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute inset-y-0 right-0 px-3 text-xs text-tinta-3 underline" aria-label={show ? "Esconder senha" : "Mostrar senha"}>
              {show ? "Esconder" : "Mostrar"}
            </button>
          </span>
          {mode === "criar" && (
            <span id="senha-ajuda" className="mt-1.5 block text-xs text-tinta-3">
              Mínimo de 8 caracteres, com letras e números.
            </span>
          )}
          {err("password")}
        </label>

        {res && !res.ok && (
          <p role="alert" className="border-l-2 border-telha pl-3 text-sm text-telha">
            {res.error}
          </p>
        )}
        <button className="btn btn-tinta w-full" disabled={pending}>
          {pending ? "Aguarde…" : mode === "entrar" ? "Entrar" : "Criar conta"}
        </button>
        {mode === "entrar" && (
          <p className="text-sm text-tinta-3">
            Esqueceu a senha?{" "}
            <a className="underline underline-offset-4" href="https://wa.me/5551996793808?text=Oi%2C%20Vynt!%20Esqueci%20a%20senha%20da%20minha%20conta." target="_blank" rel="noopener noreferrer">
              Chama no WhatsApp
            </a>
          </p>
        )}
        {proofs.length > 0 && <p className="text-xs text-tinta-3">Os {proofs.length} pedido(s) feitos neste aparelho vão para a sua conta.</p>}
      </form>
    </div>
  );
}
