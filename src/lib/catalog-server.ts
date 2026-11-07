import "server-only";
import { products, type Product } from "@/data/catalogo";
import { productOverrides, stockMap } from "./store";

export type LiveProduct = Product & { priceCents: number; inStock: boolean; stockBySku: Record<string, number> };

export async function liveCatalog(): Promise<LiveProduct[]> {
  const [o, stock] = await Promise.all([productOverrides(), stockMap()]);
  return products
    .filter((p) => o[p.slug]?.active !== false)
    .map((p) => {
      const stockBySku = Object.fromEntries(p.variants.map((v) => [v.sku, stock[v.sku] ?? v.stock]));
      return {
        ...p,
        priceCents: o[p.slug]?.priceCents ?? p.priceCents,
        inStock: Object.values(stockBySku).some((n) => n > 0),
        stockBySku,
      };
    });
}

export const avgRating = (p: Product) =>
  p.reviews.length ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length : 0;
