"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Atualiza o status do pedido a cada 15 s enquanto a aba está visível. */
export function AutoRefresh({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 15_000);
    return () => clearInterval(id);
  }, [active, router]);
  return null;
}
