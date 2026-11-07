// Cupons. TROCAR pelos cupons reais (ou migrar para a tabela `coupons` do Supabase).
export interface Coupon {
  code: string;
  kind: "percent" | "fixed";
  value: number; // percent (1–90) ou centavos
  minSubtotalCents: number;
  label: string;
}

const COUPONS: Coupon[] = [
  { code: "PRIMEIRO10", kind: "percent", value: 10, minSubtotalCents: 0, label: "10% na primeira compra" },
  { code: "VALE30", kind: "fixed", value: 3000, minSubtotalCents: 30000, label: "R$ 30 em compras acima de R$ 300" },
];

export function findCoupon(raw: string | null | undefined): Coupon | null {
  const code = (raw ?? "").trim().toUpperCase();
  if (!code) return null;
  return COUPONS.find((c) => c.code === code) ?? null;
}

export function couponDiscount(c: Coupon, subtotalCents: number) {
  if (subtotalCents < c.minSubtotalCents) return 0;
  return c.kind === "percent"
    ? Math.floor((subtotalCents * Math.min(c.value, 90)) / 100)
    : Math.min(c.value, subtotalCents);
}
