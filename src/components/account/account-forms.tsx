"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addAddress, deleteAddress, logout, updateProfile } from "@/app/actions/account";

export function LogoutButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="min-h-11 text-sm underline underline-offset-4"
      onClick={() =>
        start(async () => {
          await logout();
          router.refresh();
        })
      }
    >
      Sair da conta
    </button>
  );
}

export function DeleteAddress({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} className="min-h-10 text-tinta-3 underline underline-offset-4" onClick={() => start(() => deleteAddress(id))}>
      Remover
    </button>
  );
}

export function AddressForm() {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-3 border border-linha p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = Object.fromEntries(new FormData(form));
        start(async () => {
          const r = await addAddress(data);
          if (r.ok) {
            form.reset();
            setMsg(null);
          } else setMsg(r.error);
        });
      }}
    >
      <h2 className="font-serif text-2xl">Novo endereço</h2>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          CEP
          <input name="cep" required inputMode="numeric" autoComplete="postal-code" className="campo num mt-1.5" placeholder="95660-000" />
        </label>
        <label className="block text-sm">
          Apelido
          <input name="label" defaultValue="Casa" className="campo mt-1.5" maxLength={20} />
        </label>
      </div>
      <label className="block text-sm">
        Rua <span className="text-tinta-3">(preenchida pelo CEP quando possível)</span>
        <input name="street" autoComplete="address-line1" className="campo mt-1.5" maxLength={120} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          Número
          <input name="number" required className="campo num mt-1.5" maxLength={10} />
        </label>
        <label className="block text-sm">
          Complemento
          <input name="complement" className="campo mt-1.5" maxLength={60} />
        </label>
      </div>
      {msg && (
        <p role="alert" className="text-sm text-telha">
          {msg}
        </p>
      )}
      <button className="btn btn-tinta w-full" disabled={pending}>
        {pending ? "Salvando…" : "Salvar endereço"}
      </button>
    </form>
  );
}

export function ProfileForm({ initial }: { initial: { name: string; phone: string } }) {
  const [p, setP] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await updateProfile(p);
          setMsg(r.ok ? { ok: true, text: "Dados salvos." } : { ok: false, text: r.error });
        });
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
      <button className="btn btn-tinta" disabled={pending}>
        Salvar
      </button>
      <p aria-live="polite" className={`text-sm ${msg?.ok ? "text-ok" : "text-telha"}`}>
        {msg?.text}
      </p>
    </form>
  );
}
