"use client";

import { useState, useTransition } from "react";
import { cart, useCart } from "@/lib/cart";
import { checkCoupon } from "@/app/actions/checkout";

export function CouponField() {
  const lines = useCart((s) => s.lines);
  const applied = useCart((s) => s.coupon);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [openField, setOpenField] = useState(false);

  if (applied) {
    return (
      <div className="flex items-center justify-between text-sm">
        <p>
          Cupom <strong className="font-medium">{applied}</strong> aplicado
        </p>
        <button type="button" className="min-h-10 text-tinta-3 underline underline-offset-4" onClick={() => cart.setCoupon(null)}>
          Tirar
        </button>
      </div>
    );
  }

  if (!openField) {
    return (
      <button type="button" className="min-h-10 text-sm underline underline-offset-4" onClick={() => setOpenField(true)}>
        Tenho um cupom
      </button>
    );
  }

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await checkCoupon(code, lines);
          if (r.ok) {
            cart.setCoupon(r.code);
            setMsg(null);
          } else setMsg({ ok: false, text: r.error });
        });
      }}
    >
      <label htmlFor="cupom" className="sr-only">
        Código do cupom
      </label>
      <div className="flex gap-2">
        <input
          id="cupom"
          className="campo !min-h-11 uppercase"
          placeholder="Código do cupom"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 20))}
          autoComplete="off"
          autoCapitalize="characters"
          aria-invalid={msg ? !msg.ok : undefined}
          aria-describedby={msg ? "cupom-msg" : undefined}
        />
        <button type="submit" className="btn btn-linha !min-h-11 shrink-0" disabled={pending || code.length < 3}>
          {pending ? "…" : "Aplicar"}
        </button>
      </div>
      {msg && (
        <p id="cupom-msg" role="alert" className="text-sm text-telha">
          {msg.text}
        </p>
      )}
    </form>
  );
}
