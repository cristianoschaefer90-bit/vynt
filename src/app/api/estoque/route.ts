import { NextResponse } from "next/server";
import { productOverrides, stockMap } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const [stock, overrides] = await Promise.all([stockMap(), productOverrides()]);
  const prices: Record<string, number> = {};
  const inactive: string[] = [];
  for (const [slug, o] of Object.entries(overrides)) {
    if (o.priceCents) prices[slug] = o.priceCents;
    if (o.active === false) inactive.push(slug);
  }
  return NextResponse.json({ stock, prices, inactive }, { headers: { "Cache-Control": "no-store" } });
}
