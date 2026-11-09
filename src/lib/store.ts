import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { products, productBySlug, variantBySku } from "@/data/catalogo";

// Armazenamento local em JSON (demo sem banco).
// Mesmo contrato que o Supabase vai cumprir depois (ver supabase/migrations).
// Em Vercel, /tmp é efêmero: pedidos somem a cada novo deploy/instância.

export type OrderStatus =
  | "aguardando_pagamento"
  | "pago"
  | "separando"
  | "em_rota"
  | "pronto_retirada"
  | "entregue"
  | "cancelado";

export interface OrderItem {
  sku: string;
  slug: string;
  name: string;
  color: string;
  size: number;
  unitCents: number;
  qty: number;
  thumb: string;
}

export interface Order {
  id: string;
  code: number;
  token: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  history: { status: OrderStatus; at: string }[];
  customer: { name: string; phone: string; email?: string };
  /** conta do cliente (quando comprou logado ou vinculou depois) */
  userId?: string;
  delivery: {
    method: "motoboy" | "correios_pac" | "correios_sedex" | "retirada";
    label: string;
    eta: string;
    address?: { cep: string; street: string; number: string; complement?: string; district: string; city: string; uf: string };
  };
  payment: "pix" | "cartao" | "whatsapp";
  items: OrderItem[];
  subtotalCents: number;
  couponCode?: string;
  couponCents: number;
  /** desconto "leve 2" */
  qtyCents?: number;
  pixCents: number;
  shippingCents: number;
  totalCents: number;
  notes?: string;
  tracking?: string;
}

export interface User {
  id: string;
  name: string;
  email: string; // minúsculo
  phone: string; // só dígitos
  passHash: string; // scrypt, base64
  salt: string;
  createdAt: string;
}

export interface Address {
  id: string;
  label: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  uf: string;
}

interface DB {
  seq: number;
  orders: Order[];
  users?: User[];
  addresses?: Record<string, Address[]>; // userId → endereços
  stock: Record<string, number>; // sku → estoque (sobrepõe o catálogo)
  products: Record<string, { priceCents?: number; active?: boolean }>;
}

const DIR = process.env.VYNT_DATA_DIR ?? (process.env.VERCEL ? "/tmp/vynt" : path.join(process.cwd(), ".data"));
const FILE = path.join(DIR, "db.json");

// Cache invalidado pelo mtime: rotas e server actions podem rodar em bundles separados.
let cache: { db: DB; mtime: number } | null = null;
let chain: Promise<unknown> = Promise.resolve();

async function load(): Promise<DB> {
  let mtime = 0;
  try {
    mtime = (await fs.stat(FILE)).mtimeMs;
  } catch {
    /* ainda não existe */
  }
  if (cache && cache.mtime === mtime) return cache.db;
  let db: DB;
  try {
    db = JSON.parse(await fs.readFile(FILE, "utf8")) as DB;
  } catch {
    db = { seq: 1000, orders: [], stock: {}, products: {} };
  }
  cache = { db, mtime };
  return db;
}

async function persist(db: DB) {
  await fs.mkdir(DIR, { recursive: true });
  const tmp = FILE + "." + process.pid + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(db));
  await fs.rename(tmp, FILE);
  cache = { db, mtime: (await fs.stat(FILE)).mtimeMs };
}

/** Serializa escritas (uma por vez) para estoque e pedidos não se atropelarem. */
function tx<T>(fn: (db: DB) => Promise<T> | T): Promise<T> {
  const run = chain.then(async () => {
    const db = await load();
    const out = await fn(db);
    await persist(db);
    return out;
  });
  chain = run.catch(() => undefined);
  return run;
}

export async function stockOf(sku: string) {
  const db = await load();
  if (sku in db.stock) return db.stock[sku];
  return variantBySku.get(sku)?.variant.stock ?? 0;
}

export async function stockMap() {
  const db = await load();
  const out: Record<string, number> = {};
  for (const p of products) for (const v of p.variants) out[v.sku] = db.stock[v.sku] ?? v.stock;
  return out;
}

export async function productOverrides() {
  return (await load()).products;
}

/** Preço e disponibilidade efetivos (catálogo + ajustes do admin). */
export async function effectiveProduct(slug: string) {
  const p = productBySlug.get(slug);
  if (!p) return null;
  const o = (await load()).products[slug] ?? {};
  return { ...p, priceCents: o.priceCents ?? p.priceCents, active: o.active ?? true };
}

export class StockError extends Error {
  constructor(public sku: string, public available: number) {
    super("OUT_OF_STOCK");
  }
}

export function createOrder(
  draft: Omit<Order, "id" | "code" | "token" | "createdAt" | "updatedAt" | "status" | "history">,
) {
  return tx((db) => {
    for (const it of draft.items) {
      const have = db.stock[it.sku] ?? variantBySku.get(it.sku)?.variant.stock ?? 0;
      if (have < it.qty) throw new StockError(it.sku, have);
    }
    for (const it of draft.items) {
      const have = db.stock[it.sku] ?? variantBySku.get(it.sku)!.variant.stock;
      db.stock[it.sku] = have - it.qty;
    }
    const now = new Date().toISOString();
    db.seq += 1;
    const order: Order = {
      ...draft,
      id: randomUUID(),
      code: db.seq,
      token: randomUUID().replace(/-/g, ""),
      createdAt: now,
      updatedAt: now,
      status: "aguardando_pagamento",
      history: [{ status: "aguardando_pagamento", at: now }],
    };
    db.orders.unshift(order);
    return order;
  });
}

export async function getOrder(code: number, token: string) {
  const db = await load();
  const o = db.orders.find((x) => x.code === code);
  if (!o) return null;
  const a = Buffer.from(o.token);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b) ? o : null;
}

export async function listOrders() {
  return (await load()).orders;
}

export function setOrderStatus(code: number, status: OrderStatus, tracking?: string) {
  return tx((db) => {
    const o = db.orders.find((x) => x.code === code);
    if (!o) throw new Error("NOT_FOUND");
    if (o.status !== status) {
      if (status === "cancelado" && o.status !== "cancelado") {
        for (const it of o.items) {
          db.stock[it.sku] = (db.stock[it.sku] ?? variantBySku.get(it.sku)?.variant.stock ?? 0) + it.qty;
        }
      }
      o.status = status;
      o.history.push({ status, at: new Date().toISOString() });
    }
    if (tracking !== undefined) o.tracking = tracking.slice(0, 40) || undefined;
    o.updatedAt = new Date().toISOString();
    return o;
  });
}

export function setStock(sku: string, qty: number) {
  return tx((db) => {
    if (!variantBySku.has(sku)) throw new Error("NOT_FOUND");
    db.stock[sku] = Math.max(0, Math.min(999, Math.floor(qty)));
  });
}

export function setProduct(slug: string, patch: { priceCents?: number; active?: boolean }) {
  return tx((db) => {
    if (!productBySlug.has(slug)) throw new Error("NOT_FOUND");
    db.products[slug] = { ...db.products[slug], ...patch };
  });
}


// ───────────── Contas de cliente ─────────────

export async function findUserByEmail(email: string) {
  return (await load()).users?.find((u) => u.email === email.trim().toLowerCase()) ?? null;
}

export async function getUser(id: string) {
  return (await load()).users?.find((u) => u.id === id) ?? null;
}

export function createUser(u: Omit<User, "id" | "createdAt">) {
  return tx((db) => {
    db.users ??= [];
    if (db.users.some((x) => x.email === u.email)) throw new Error("EMAIL_TAKEN");
    const user: User = { ...u, id: randomUUID(), createdAt: new Date().toISOString() };
    db.users.push(user);
    return user;
  });
}

export function updateUser(id: string, patch: Partial<Pick<User, "name" | "phone">>) {
  return tx((db) => {
    const u = db.users?.find((x) => x.id === id);
    if (!u) throw new Error("NOT_FOUND");
    Object.assign(u, patch);
    return u;
  });
}

export async function ordersOfUser(userId: string) {
  return (await load()).orders.filter((o) => o.userId === userId);
}

/** Vincula pedidos à conta. Só aceita quem prova posse do pedido (código + token secreto). */
export function claimOrders(userId: string, proofs: { code: number; token: string }[]) {
  return tx((db) => {
    let n = 0;
    for (const p of proofs.slice(0, 50)) {
      const o = db.orders.find((x) => x.code === p.code);
      if (!o || o.userId) continue;
      const a = Buffer.from(o.token), b = Buffer.from(String(p.token));
      if (a.length === b.length && timingSafeEqual(a, b)) {
        o.userId = userId;
        n++;
      }
    }
    return n;
  });
}

export async function addressesOf(userId: string) {
  return (await load()).addresses?.[userId] ?? [];
}

export function saveAddress(userId: string, a: Address) {
  return tx((db) => {
    db.addresses ??= {};
    const list = (db.addresses[userId] ?? []).filter((x) => x.id !== a.id);
    db.addresses[userId] = [a, ...list].slice(0, 6);
  });
}

export function removeAddress(userId: string, id: string) {
  return tx((db) => {
    if (db.addresses?.[userId]) db.addresses[userId] = db.addresses[userId].filter((x) => x.id !== id);
  });
}
