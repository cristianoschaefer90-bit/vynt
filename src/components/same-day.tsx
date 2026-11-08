"use client";

import { useEffect, useState } from "react";
import { SAME_DAY_CUTOFF } from "@/lib/promo";

// Contagem real até o horário de corte da entrega no mesmo dia (horário de Brasília).
function nowBrt() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", hour12: false, weekday: "short", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { wd, min: (Number(get("hour")) % 24) * 60 + Number(get("minute")) };
}

export function useSameDay() {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const { wd, min } = nowBrt();
      const cut = SAME_DAY_CUTOFF.hour * 60 + SAME_DAY_CUTOFF.minute;
      setLeft(SAME_DAY_CUTOFF.days.includes(wd) && min < cut ? cut - min : 0);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return left;
}

export const fmtLeft = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}min` : `${m}min`);

/** Linha "Peça em Xh Ymin e recebe hoje em Três Coroas". Fora do horário, mostra o próximo envio. */
export function SameDay({ className }: { className?: string }) {
  const left = useSameDay();
  if (left === null) return <p className={className}>&nbsp;</p>;
  return (
    <p className={className} aria-live="off">
      {left > 0 ? (
        <>
          Peça em <strong className="num font-medium">{fmtLeft(left)}</strong> e recebe <strong className="font-medium">hoje</strong> em Três Coroas.
        </>
      ) : (
        <>Pedidos de agora saem no próximo envio do motoboy. Retirada na loja em 1 hora no horário de funcionamento.</>
      )}
    </p>
  );
}
