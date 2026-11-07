import type { Product } from "@/data/catalogo";
import { SIZES } from "@/data/catalogo";

export const COLOR_FAMILIES = [
  { slug: "claro", name: "Claros", hex: "#EEE9E0", match: ["Osso e telha", "Branco gelo", "Creme e verde", "Osso e couro"] },
  { slug: "escuro", name: "Escuros", hex: "#1A1A1A", match: ["Preto", "Preto e caramelo", "Basalto", "Azul-noite"] },
  { slug: "terroso", name: "Terrosos", hex: "#8C6A4F", match: ["Conhaque", "Café", "Musgo"] },
  { slug: "cinza", name: "Cinzas", hex: "#9A9792", match: ["Cinza mescla"] },
] as const;

export const PRICE_RANGES = [
  { slug: "ate-350", name: "Até R$ 350", min: 0, max: 35000 },
  { slug: "350-500", name: "R$ 350 a R$ 500", min: 35000, max: 50000 },
  { slug: "acima-500", name: "Acima de R$ 500", min: 50000, max: Infinity },
] as const;

export const SORTS = [
  { slug: "relevancia", name: "Curadoria" },
  { slug: "vendidos", name: "Mais vendidos" },
  { slug: "menor-preco", name: "Menor preço" },
  { slug: "maior-preco", name: "Maior preço" },
  { slug: "novos", name: "Novidades" },
] as const;

export interface Filters {
  tamanho: number[];
  cor: string[];
  preco: string | null;
  ordem: string;
}

const arr = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

export function parseFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const sizes = new Set<number>(SIZES);
  const colors = new Set<string>(COLOR_FAMILIES.map((c) => c.slug));
  return {
    tamanho: arr(sp.tamanho).map(Number).filter((n) => sizes.has(n)).slice(0, 11),
    cor: arr(sp.cor).filter((c) => colors.has(c)).slice(0, 4),
    preco: PRICE_RANGES.some((p) => p.slug === sp.preco) ? (sp.preco as string) : null,
    ordem: SORTS.some((s) => s.slug === sp.ordem) ? (sp.ordem as string) : "relevancia",
  };
}

export function apply<T extends Product & { priceCents: number; stockBySku: Record<string, number> }>(list: T[], f: Filters) {
  let out = list.filter((p) => {
    if (f.tamanho.length && !p.variants.some((v) => f.tamanho.includes(v.size) && (p.stockBySku[v.sku] ?? 0) > 0)) return false;
    if (f.cor.length) {
      const fam = COLOR_FAMILIES.filter((c) => f.cor.includes(c.slug)).flatMap((c) => c.match as readonly string[]);
      if (!p.colors.some((c) => fam.includes(c.name))) return false;
    }
    if (f.preco) {
      const r = PRICE_RANGES.find((x) => x.slug === f.preco)!;
      if (p.priceCents < r.min || p.priceCents >= r.max) return false;
    }
    return true;
  });
  const by = {
    vendidos: (a: T, b: T) => b.sold - a.sold,
    "menor-preco": (a: T, b: T) => a.priceCents - b.priceCents,
    "maior-preco": (a: T, b: T) => b.priceCents - a.priceCents,
    novos: (a: T, b: T) => Number(b.badge === "novo") - Number(a.badge === "novo"),
  } as Record<string, (a: T, b: T) => number>;
  if (by[f.ordem]) out = [...out].sort(by[f.ordem]);
  return out;
}
