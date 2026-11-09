"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { variantBySku } from "@/data/catalogo";
import { STORE } from "@/lib/config";
import { couponDiscount, findCoupon } from "@/lib/coupons";
import { qtyDiscount } from "@/lib/promo";
import { cleanCep, lookupCep, optionsFor, PICKUP, type ShippingOption } from "@/lib/shipping";
import { createOrder, effectiveProduct, StockError, stockOf, type OrderItem } from "@/lib/store";
import { rateLimit } from "@/lib/rate-limit";
import { signOrder } from "@/lib/order-snapshot";
import { currentCustomer } from "@/lib/customer-auth";

const cartSchema = z
  .array(z.object({ sku: z.string().max(40), qty: z.number().int().min(1).max(10) }))
  .min(1)
  .max(20);

async function ip() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

/** Preço do servidor para cada item — o cliente nunca define preço. */
async function priceCart(cart: z.infer<typeof cartSchema>) {
  const merged = new Map<string, number>();
  for (const it of cart) merged.set(it.sku, Math.min(10, (merged.get(it.sku) ?? 0) + it.qty));
  const items: OrderItem[] = [];
  const problems: { sku: string; available: number }[] = [];
  for (const [sku, qty] of merged) {
    const hit = variantBySku.get(sku);
    if (!hit) continue;
    const p = await effectiveProduct(hit.product.slug);
    if (!p || !p.active) {
      problems.push({ sku, available: 0 });
      continue;
    }
    const available = await stockOf(sku);
    if (available < qty) problems.push({ sku, available });
    items.push({
      sku,
      slug: p.slug,
      name: p.name,
      color: hit.variant.color,
      size: hit.variant.size,
      unitCents: p.priceCents,
      qty,
      thumb: p.colors[0].thumb,
    });
  }
  const subtotalCents = items.reduce((s, i) => s + i.unitCents * i.qty, 0);
  return { items, subtotalCents, problems };
}

export async function quoteShipping(cepRaw: string, subtotalCents: number) {
  if (!rateLimit(`cep:${await ip()}`, 30, 60_000)) return { ok: false as const, error: "Muitas consultas. Tente em 1 minuto." };
  const cep = cleanCep(String(cepRaw));
  if (!cep) return { ok: false as const, error: "CEP precisa ter 8 números." };
  const addr = await lookupCep(cep);
  if (!addr) return { ok: false as const, error: "Não achamos esse CEP. Confere os números?" };
  const sub = Number.isFinite(subtotalCents) ? Math.max(0, Math.min(10_000_000, subtotalCents)) : 0;
  return { ok: true as const, address: addr, options: [...optionsFor(addr, sub), PICKUP] };
}

export async function checkCoupon(code: string, cart: unknown) {
  if (!rateLimit(`cupom:${await ip()}`, 15, 10 * 60_000)) return { ok: false as const, error: "Muitas tentativas. Tente mais tarde." };
  const parsed = cartSchema.safeParse(cart);
  if (!parsed.success) return { ok: false as const, error: "Sacola vazia." };
  const c = findCoupon(code);
  if (!c) return { ok: false as const, error: "Cupom inválido ou expirado." };
  const { subtotalCents } = await priceCart(parsed.data);
  const { items } = await priceCart(parsed.data);
  const qty = items.reduce((n, i) => n + i.qty, 0);
  const off = couponDiscount(c, subtotalCents - qtyDiscount(subtotalCents, qty));
  if (!off) return { ok: false as const, error: `Esse cupom vale para compras a partir de R$ ${(c.minSubtotalCents / 100).toFixed(0)}.` };
  return { ok: true as const, code: c.code, label: c.label, discountCents: off };
}

const orderSchema = z.object({
  cart: cartSchema,
  name: z.string().trim().min(3, "Digite seu nome completo").max(80),
  phone: z
    .string()
    .transform((s) => s.replace(/\D/g, ""))
    .refine((s) => s.length === 10 || s.length === 11, "WhatsApp com DDD, só números"),
  email: z.string().trim().email("E-mail inválido").max(120).optional().or(z.literal("")),
  delivery: z.enum(["motoboy", "correios_pac", "correios_sedex", "retirada"]),
  cep: z.string().optional(),
  number: z.string().trim().max(10).optional(),
  complement: z.string().trim().max(60).optional(),
  street: z.string().trim().max(120).optional(),
  district: z.string().trim().max(80).optional(),
  payment: z.enum(["pix", "cartao", "whatsapp"]),
  coupon: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(300).optional(),
  website: z.string().max(0).optional(), // honeypot
});

export type PlaceOrderResult =
  | { ok: true; code: number; token: string; snapshot: string | null; totalCents: number; whatsappUrl: string; payment: "pix" | "cartao" | "whatsapp" }
  | { ok: false; error: string; fields?: Record<string, string>; stock?: { sku: string; available: number }[] };

export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  if (!rateLimit(`order:${await ip()}`, 6, 10 * 60_000))
    return { ok: false, error: "Muitos pedidos seguidos. Chama a gente no WhatsApp." };

  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[String(i.path[0])] ??= i.message;
    return { ok: false, error: "Confere os campos marcados.", fields };
  }
  const d = parsed.data;
  if (d.website) return { ok: false, error: "Não foi possível enviar." };

  const { items, subtotalCents, problems } = await priceCart(d.cart);
  if (!items.length) return { ok: false, error: "Sua sacola está vazia." };
  if (problems.length) return { ok: false, error: "Algum tamanho acabou de esgotar.", stock: problems };

  // frete recalculado aqui, nunca confiado do navegador
  let shipping: ShippingOption = PICKUP;
  let address: NonNullable<Parameters<typeof createOrder>[0]["delivery"]["address"]> | undefined;
  if (d.delivery !== "retirada") {
    const cep = cleanCep(d.cep ?? "");
    const addr = cep ? await lookupCep(cep) : null;
    if (!addr) return { ok: false, error: "Confere o CEP.", fields: { cep: "CEP não encontrado" } };
    if (!d.number) return { ok: false, error: "Falta o número.", fields: { number: "Número da casa" } };
    const street = addr.street || d.street || "";
    const district = addr.district || d.district || "";
    if (!street) return { ok: false, error: "Falta a rua.", fields: { street: "Digite a rua" } };
    const opt = optionsFor(addr, subtotalCents).find((o) => o.method === d.delivery);
    if (!opt) return { ok: false, error: "Essa entrega não atende o seu CEP.", fields: { delivery: "Escolha outra entrega" } };
    shipping = opt;
    address = { cep: addr.cep, street, number: d.number, complement: d.complement || undefined, district, city: addr.city, uf: addr.uf };
  }

  const coupon = findCoupon(d.coupon);
  const qtyCents = qtyDiscount(subtotalCents, items.reduce((n, i) => n + i.qty, 0));
  const couponCents = coupon ? couponDiscount(coupon, subtotalCents - qtyCents) : 0;
  const pixCents = d.payment === "pix" ? Math.floor(((subtotalCents - qtyCents - couponCents) * STORE.pixDiscountPct) / 100) : 0;
  const totalCents = subtotalCents - qtyCents - couponCents - pixCents + shipping.priceCents;

  try {
    const me = await currentCustomer();
    const order = await createOrder({
      userId: me?.id,
      customer: { name: d.name, phone: d.phone, email: d.email || undefined },
      delivery: { method: shipping.method, label: shipping.label, eta: shipping.eta, address },
      payment: d.payment,
      items,
      subtotalCents,
      couponCode: couponCents ? coupon!.code : undefined,
      couponCents,
      qtyCents,
      pixCents,
      shippingCents: shipping.priceCents,
      totalCents,
      notes: d.notes || undefined,
    });
    return {
      ok: true,
      code: order.code,
      token: order.token,
      snapshot: signOrder(order),
      totalCents: order.totalCents,
      payment: order.payment,
      whatsappUrl: whatsappForOrder(order),
    };
  } catch (e) {
    if (e instanceof StockError) return { ok: false, error: "Algum tamanho acabou de esgotar.", stock: [{ sku: e.sku, available: e.available }] };
    console.error("placeOrder", e);
    return { ok: false, error: "Não conseguimos registrar o pedido. Tenta de novo ou chama no WhatsApp." };
  }
}

function whatsappForOrder(o: Awaited<ReturnType<typeof createOrder>>) {
  const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const pay = { pix: "Pix (com desconto)", cartao: "Cartão — me manda o link", whatsapp: "Combinar por aqui" }[o.payment];
  const lines = [
    `Oi, Vynt! Pedido #${o.code}`,
    ...o.items.map((i) => `• ${i.qty}× ${i.name} — nº ${i.size} — ${brl(i.unitCents * i.qty)}`),
    `Entrega: ${o.delivery.label}${o.delivery.address ? ` — ${o.delivery.address.street}, ${o.delivery.address.number}, ${o.delivery.address.city}` : ""}`,
    `Pagamento: ${pay}`,
    `Total: ${brl(o.totalCents)}`,
    `Nome: ${o.customer.name}`,
  ];
  return `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;
}
