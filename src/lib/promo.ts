// Promoções da loja (iguais no navegador e no servidor). TROCAR conforme a política real.

/** Leve 2 ou mais pares e ganhe desconto no total dos pares. */
export const QTY_PROMO = { minQty: 2, pct: 10 } as const;

export function qtyDiscount(subtotalCents: number, qty: number) {
  return qty >= QTY_PROMO.minQty ? Math.floor((subtotalCents * QTY_PROMO.pct) / 100) : 0;
}

/** Corte do envio no mesmo dia em Três Coroas (horário de Brasília). */
export const SAME_DAY_CUTOFF = { hour: 16, minute: 0, days: [1, 2, 3, 4, 5, 6] as number[] }; // seg–sáb

/** Correios PAC grátis acima deste valor para RS e SC. Motoboy em Três Coroas é sempre grátis. */
export const FREE_SHIPPING_CENTS = 39900;
