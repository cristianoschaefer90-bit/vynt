import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Order } from "./store";

// Cópia assinada do pedido no link de confirmação. Garante que o cliente veja o pedido
// mesmo em hospedagem sem disco compartilhado (Vercel sem banco). O status "ao vivo"
// continua vindo do armazenamento quando ele existe.

const secret = () => process.env.ORDER_SECRET ?? process.env.ADMIN_SECRET ?? (process.env.NODE_ENV !== "production" ? "dev-order-secret" : "");

export function signOrder(o: Order) {
  const s = secret();
  if (!s) return null;
  const { token: _t, ...rest } = o;
  void _t;
  const body = Buffer.from(JSON.stringify(rest)).toString("base64url");
  const sig = createHmac("sha256", s).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readOrder(snapshot: string, code: number): Order | null {
  const s = secret();
  if (!s || snapshot.length > 12_000) return null;
  const [body, sig] = snapshot.split(".");
  if (!body || !sig) return null;
  const expect = createHmac("sha256", s).update(body).digest("base64url");
  const a = Buffer.from(sig), b = Buffer.from(expect);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const o = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Order;
    return o.code === code ? { ...o, token: "" } : null;
  } catch {
    return null;
  }
}
