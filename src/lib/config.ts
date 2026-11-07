// Configuração da loja. Tudo que estiver com // TROCAR precisa do dado real antes de publicar.

export const STORE = {
  name: "Vynt",
  city: "Três Coroas",
  uf: "RS",
  whatsapp: "5551996793808",
  whatsappDisplay: "(51) 99679-3808",
  // TROCAR: endereço real da loja para retirada
  pickupAddress: "Rua Exemplo, 100 — Centro, Três Coroas/RS",
  pickupHours: "Seg a sex, 9h às 19h · Sáb, 9h às 13h", // TROCAR
  originCep: "95660000", // TROCAR: CEP exato de envio
  pixDiscountPct: 5,
  maxInstallments: 6,
  minInstallmentCents: 5000,
  freeExchangeDays: 30,
  demo: true, // TROCAR para false quando os dados forem reais (libera indexação)
} as const;

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vynt.vercel.app";

/** Pix: chave e nome do recebedor. Em demo, a chave é fictícia. */
export function pixConfig() {
  return {
    key: process.env.PIX_KEY ?? "pix-demo@vynt.com.br", // TROCAR via env PIX_KEY
    merchantName: (process.env.PIX_MERCHANT_NAME ?? "VYNT TENIS").slice(0, 25),
    merchantCity: (process.env.PIX_MERCHANT_CITY ?? "TRES COROAS").slice(0, 15),
  };
}
