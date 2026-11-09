"use client";

import Link from "next/link";
import { useCart, useHydrated } from "@/lib/cart";
import { formatBRL } from "@/lib/money";

/** Pedidos feitos neste aparelho sem conta (links com token). */
export function DeviceOrders() {
  const hydrated = useHydrated();
  const orders = useCart((s) => s.orders);
  if (!hydrated || !orders.length) return null;
  return (
    <div className="mt-10">
      <h2 className="rotulo !text-tinta">Pedidos feitos neste aparelho</h2>
      <ul className="mt-3 divide-y divide-linha border-y border-linha">
        {orders.map((o) => (
          <li key={o.code}>
            <Link href={o.url ?? `/pedido/${o.code}?t=${o.token}`} className="flex items-center justify-between gap-4 py-4 hover:bg-papel-2/60">
              <span className="num font-medium">#{o.code}</span>
              <span className="num">{formatBRL(o.totalCents)}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-tinta-3">Entre ou crie sua conta para guardar estes pedidos e ver em qualquer aparelho.</p>
    </div>
  );
}
