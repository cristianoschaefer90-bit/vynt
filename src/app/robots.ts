import type { MetadataRoute } from "next";
import { SITE_URL, STORE } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  if (STORE.demo) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/checkout", "/pedido", "/conta", "/api"] }, sitemap: `${SITE_URL}/sitemap.xml` };
}
