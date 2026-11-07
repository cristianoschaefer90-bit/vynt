"use client";

import { useSyncExternalStore } from "react";

// Sacola e dados do cliente guardados no aparelho (localStorage), com eventos entre abas.

export interface CartLine {
  sku: string;
  qty: number;
}
export interface SavedAddress {
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
export interface SavedOrder {
  code: number;
  token: string;
  url?: string;
  totalCents: number;
  createdAt: string;
  items: number;
}
interface State {
  lines: CartLine[];
  coupon: string | null;
  open: boolean;
  orders: SavedOrder[];
  addresses: SavedAddress[];
  profile: { name: string; phone: string; email: string };
}

const KEY = "vynt:v1";
const EMPTY: State = { lines: [], coupon: null, open: false, orders: [], addresses: [], profile: { name: "", phone: "", email: "" } };

let state: State = EMPTY;
let hydrated = false;
const subs = new Set<() => void>();

function read(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const v = JSON.parse(raw) as Partial<State>;
    return {
      ...EMPTY,
      ...v,
      open: false,
      lines: Array.isArray(v.lines) ? v.lines.filter((l) => typeof l?.sku === "string" && l.qty > 0).slice(0, 20) : [],
    };
  } catch {
    return EMPTY;
  }
}

function write() {
  try {
    const { open: _open, ...rest } = state;
    void _open;
    localStorage.setItem(KEY, JSON.stringify(rest));
  } catch {
    /* modo privado / cota cheia: segue só em memória */
  }
}

function emit() {
  subs.forEach((f) => f());
}

function ensure() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  state = read();
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      state = { ...read(), open: state.open };
      emit();
    }
  });
}

function set(fn: (s: State) => State) {
  ensure();
  state = fn(state);
  write();
  emit();
}

export const cart = {
  add(sku: string, qty = 1) {
    set((s) => {
      const ex = s.lines.find((l) => l.sku === sku);
      const lines = ex
        ? s.lines.map((l) => (l.sku === sku ? { ...l, qty: Math.min(10, l.qty + qty) } : l))
        : [...s.lines, { sku, qty }];
      return { ...s, lines, open: true };
    });
  },
  setQty(sku: string, qty: number) {
    set((s) => ({
      ...s,
      lines: qty <= 0 ? s.lines.filter((l) => l.sku !== sku) : s.lines.map((l) => (l.sku === sku ? { ...l, qty: Math.min(10, qty) } : l)),
    }));
  },
  swap(oldSku: string, newSku: string) {
    set((s) => {
      const old = s.lines.find((l) => l.sku === oldSku);
      if (!old) return s;
      const rest = s.lines.filter((l) => l.sku !== oldSku);
      const ex = rest.find((l) => l.sku === newSku);
      return { ...s, lines: ex ? rest.map((l) => (l.sku === newSku ? { ...l, qty: Math.min(10, l.qty + old.qty) } : l)) : [...rest, { sku: newSku, qty: old.qty }] };
    });
  },
  clear() {
    set((s) => ({ ...s, lines: [], coupon: null }));
  },
  setCoupon(code: string | null) {
    set((s) => ({ ...s, coupon: code }));
  },
  open(v: boolean) {
    set((s) => ({ ...s, open: v }));
  },
  saveOrder(o: SavedOrder) {
    set((s) => ({ ...s, orders: [o, ...s.orders.filter((x) => x.code !== o.code)].slice(0, 30) }));
  },
  saveProfile(p: State["profile"]) {
    set((s) => ({ ...s, profile: p }));
  },
  saveAddress(a: SavedAddress) {
    set((s) => ({ ...s, addresses: [a, ...s.addresses.filter((x) => x.id !== a.id)].slice(0, 6) }));
  },
  removeAddress(id: string) {
    set((s) => ({ ...s, addresses: s.addresses.filter((x) => x.id !== id) }));
  },
};

const subscribe = (f: () => void) => {
  ensure();
  subs.add(f);
  return () => subs.delete(f);
};
const getSnapshot = () => {
  ensure();
  return state;
};
const getServer = () => EMPTY;

export function useCart<T>(select: (s: State) => T): T {
  return select(useSyncExternalStore(subscribe, getSnapshot, getServer));
}

/** true só depois de montar no navegador (evita piscar contagem errada no SSR). */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
