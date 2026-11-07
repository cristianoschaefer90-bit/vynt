const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const formatBRL = (cents: number) => brl.format(cents / 100);

/** Parcela sem juros respeitando parcela mínima. */
export function installments(totalCents: number, max: number, minCents: number) {
  const n = Math.max(1, Math.min(max, Math.floor(totalCents / minCents)));
  return { n, each: Math.ceil(totalCents / n) };
}
