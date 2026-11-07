import type { MetadataRoute } from "next";
import { categories, products } from "@/data/catalogo";
import { SITE_URL } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, priority: 1 },
    { url: `${SITE_URL}/loja`, priority: 0.9 },
    ...categories.map((c) => ({ url: `${SITE_URL}/loja/${c.slug}`, priority: 0.8 })),
    ...products.map((p) => ({ url: `${SITE_URL}/p/${p.slug}`, priority: 0.7 })),
    { url: `${SITE_URL}/trocas`, priority: 0.3 },
  ];
}
