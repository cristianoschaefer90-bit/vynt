"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { rateLimit } from "@/lib/rate-limit";
import { currentCustomer, dummyVerify, endCustomerSession, hashPassword, startCustomerSession, verifyPassword } from "@/lib/customer-auth";
import { claimOrders, createUser, findUserByEmail, removeAddress, saveAddress, updateUser } from "@/lib/store";
import { lookupCep } from "@/lib/shipping";

async function ip() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

const proofs = z.array(z.object({ code: z.number().int().positive(), token: z.string().regex(/^[a-f0-9]{32}$/) })).max(50).default([]);

const signupSchema = z.object({
  name: z.string().trim().min(3, "Digite seu nome completo").max(80),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(120),
  phone: z
    .string()
    .transform((s) => s.replace(/\D/g, ""))
    .refine((s) => s.length === 10 || s.length === 11, "WhatsApp com DDD"),
  password: z
    .string()
    .min(8, "Mínimo de 8 caracteres")
    .max(72)
    .refine((s) => /[A-Za-z]/.test(s) && /\d/.test(s), "Use letras e números"),
  proofs,
});

export type AuthResult = { ok: true } | { ok: false; error: string; fields?: Record<string, string> };

export async function signup(input: unknown): Promise<AuthResult> {
  if (!rateLimit(`signup:${await ip()}`, 5, 60 * 60_000)) return { ok: false, error: "Muitas contas criadas daqui. Tente mais tarde." };
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[String(i.path[0])] ??= i.message;
    return { ok: false, error: "Confere os campos marcados.", fields };
  }
  const d = parsed.data;
  if (await findUserByEmail(d.email)) {
    return { ok: false, error: "Já existe uma conta com esse e-mail. Entre com sua senha.", fields: { email: "E-mail já cadastrado" } };
  }
  try {
    const user = await createUser({ name: d.name, email: d.email, phone: d.phone, ...(await hashPassword(d.password)) });
    if (d.proofs.length) await claimOrders(user.id, d.proofs);
    await startCustomerSession(user.id);
    revalidatePath("/conta");
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === "EMAIL_TAKEN") return { ok: false, error: "Já existe uma conta com esse e-mail.", fields: { email: "E-mail já cadastrado" } };
    console.error("signup", e);
    return { ok: false, error: "Não foi possível criar a conta agora." };
  }
}

const loginSchema = z.object({ email: z.string().trim().toLowerCase().max(120), password: z.string().max(72), proofs });

export async function login(input: unknown): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "E-mail ou senha incorretos." };
  const d = parsed.data;
  if (!rateLimit(`login:${await ip()}`, 10, 15 * 60_000) || !rateLimit(`login-mail:${d.email}`, 6, 15 * 60_000))
    return { ok: false, error: "Muitas tentativas. Espere 15 minutos." };
  const user = await findUserByEmail(d.email);
  const ok = user ? await verifyPassword(d.password, user.passHash, user.salt) : await dummyVerify(d.password);
  if (!user || !ok) return { ok: false, error: "E-mail ou senha incorretos." };
  if (d.proofs.length) await claimOrders(user.id, d.proofs);
  await startCustomerSession(user.id);
  revalidatePath("/conta");
  return { ok: true };
}

export async function logout() {
  await endCustomerSession();
  revalidatePath("/conta");
}

/** Vincula um pedido à conta logada (prova: token do link do pedido). */
export async function linkOrder(code: number, token: string) {
  const me = await currentCustomer();
  if (!me) return { ok: false as const };
  const p = proofs.safeParse([{ code, token }]);
  if (!p.success) return { ok: false as const };
  await claimOrders(me.id, p.data);
  revalidatePath("/conta");
  return { ok: true as const };
}

export async function updateProfile(input: unknown): Promise<AuthResult> {
  const me = await currentCustomer();
  if (!me) return { ok: false, error: "Entre na sua conta." };
  const d = signupSchema.pick({ name: true, phone: true }).safeParse(input);
  if (!d.success) return { ok: false, error: "Confere nome e WhatsApp." };
  await updateUser(me.id, d.data);
  revalidatePath("/conta");
  return { ok: true };
}

const addressSchema = z.object({
  label: z.string().trim().min(1).max(20),
  cep: z.string().transform((s) => s.replace(/\D/g, "")).refine((s) => s.length === 8, "CEP inválido"),
  number: z.string().trim().min(1, "Número").max(10),
  complement: z.string().trim().max(60).optional(),
  street: z.string().trim().max(120).optional(),
  district: z.string().trim().max(80).optional(),
});

export async function addAddress(input: unknown): Promise<AuthResult> {
  const me = await currentCustomer();
  if (!me) return { ok: false, error: "Entre na sua conta." };
  const d = addressSchema.safeParse(input);
  if (!d.success) return { ok: false, error: d.error.issues[0]?.message ?? "Endereço inválido." };
  const addr = await lookupCep(d.data.cep);
  if (!addr) return { ok: false, error: "CEP não encontrado." };
  const street = addr.street || d.data.street || "";
  if (!street) return { ok: false, error: "Digite a rua." };
  await saveAddress(me.id, {
    id: `${addr.cep}-${d.data.number}`.slice(0, 30),
    label: d.data.label,
    cep: addr.cep,
    street,
    number: d.data.number,
    complement: d.data.complement || undefined,
    district: addr.district || d.data.district || "",
    city: addr.city,
    uf: addr.uf,
  });
  revalidatePath("/conta");
  return { ok: true };
}

export async function deleteAddress(id: string) {
  const me = await currentCustomer();
  if (!me) return;
  await removeAddress(me.id, String(id).slice(0, 40));
  revalidatePath("/conta");
}
