"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/admin";

export function LoginForm({ hint }: { hint?: string }) {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="mt-8 space-y-4">
      <label className="block text-sm">
        Senha
        <input name="senha" type="password" autoComplete="current-password" required className="campo mt-1.5" aria-invalid={state?.error ? true : undefined} />
      </label>
      {state?.error && (
        <p role="alert" className="text-sm text-telha">
          {state.error}
        </p>
      )}
      <button className="btn btn-tinta w-full" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
      {hint && <p className="text-xs text-tinta-3">{hint}</p>}
    </form>
  );
}
