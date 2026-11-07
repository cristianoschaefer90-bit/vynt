"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { checkPassword, endSession, requireAdmin, startSession } from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";
import { setOrderStatus, setProduct, setStock, type OrderStatus } from "@/lib/store";

export async function login(_: unknown, form: FormData) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (!rateLimit(`login:${ip}`, 8, 15 * 60_000)) return { error: "Muitas tentativas. Espere 15 minutos." };
  const pwd = String(form.get("senha") ?? "");
  if (!checkPassword(pwd)) return { error: "Senha incorreta." };
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin");
}

const statuses = ["aguardando_pagamento", "pago", "separando", "em_rota", "pronto_retirada", "entregue", "cancelado"] as const;

export async function updateOrder(form: FormData) {
  await requireAdmin();
  const d = z
    .object({ code: z.coerce.number().int().positive(), status: z.enum(statuses), tracking: z.string().max(40).optional() })
    .parse({ code: form.get("code"), status: form.get("status"), tracking: form.get("tracking") ?? undefined });
  await setOrderStatus(d.code, d.status as OrderStatus, d.tracking);
  revalidatePath("/admin");
  revalidatePath(`/pedido/${d.code}`);
}

export async function updateStock(form: FormData) {
  await requireAdmin();
  const d = z.object({ sku: z.string().max(40), qty: z.coerce.number().int().min(0).max(999) }).parse({
    sku: form.get("sku"),
    qty: form.get("qty"),
  });
  await setStock(d.sku, d.qty);
  revalidatePath("/admin");
  revalidatePath("/", "layout");
}

export async function updateProduct(form: FormData) {
  await requireAdmin();
  const d = z
    .object({
      slug: z.string().max(40),
      price: z.string().transform((s) => Math.round(Number(s.replace(/\./g, "").replace(",", ".")) * 100)),
      active: z.string().optional(),
    })
    .parse({ slug: form.get("slug"), price: form.get("price"), active: form.get("active") ?? undefined });
  if (!Number.isFinite(d.price) || d.price < 100 || d.price > 10_000_00) throw new Error("Preço inválido");
  await setProduct(d.slug, { priceCents: d.price, active: d.active === "on" });
  revalidatePath("/", "layout");
}
