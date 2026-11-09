"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { linkOrder } from "@/app/actions/account";

export function LinkOrderButton({ code, token }: { code: number; token: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="btn btn-tinta"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await linkOrder(code, token);
          router.refresh();
        })
      }
    >
      {pending ? "Salvando…" : "Salvar na minha conta"}
    </button>
  );
}
