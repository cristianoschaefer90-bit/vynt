import "server-only";
import { STORE } from "./config";

export type DeliveryMethod = "motoboy" | "correios_pac" | "correios_sedex" | "retirada";

export interface ShippingOption {
  method: DeliveryMethod;
  label: string;
  priceCents: number;
  eta: string;
  note?: string;
}

export interface Address {
  cep: string;
  street: string;
  district: string;
  city: string;
  uf: string;
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

// Motoboy no Vale do Paranhana e arredores. TROCAR: valores e horários reais.
const MOTOBOY: Record<string, { priceCents: number; eta: string }> = {
  "tres coroas": { priceCents: 0, eta: "Hoje, para pedidos até 16h" },
  igrejinha: { priceCents: 900, eta: "Hoje, para pedidos até 15h" },
  taquara: { priceCents: 1400, eta: "Hoje, para pedidos até 14h" },
  parobe: { priceCents: 1600, eta: "Hoje, para pedidos até 14h" },
  rolante: { priceCents: 1600, eta: "Amanhã até 12h" },
  riozinho: { priceCents: 1600, eta: "Amanhã até 12h" },
  gramado: { priceCents: 1900, eta: "Amanhã até 18h" },
  canela: { priceCents: 1900, eta: "Amanhã até 18h" },
};

// Estimativa de Correios por região de destino saindo do RS (1 par, caixa 33×22×13, 1,2 kg).
// TROCAR: ligar a cotação real (Melhor Envio / contrato Correios) em quoteCorreios().
const REGION: Record<string, { pac: [number, number]; sedex: [number, number] }> = {
  RS: { pac: [2490, 5], sedex: [3490, 2] },
  SC: { pac: [2990, 6], sedex: [4290, 2] },
  PR: { pac: [3290, 6], sedex: [4790, 3] },
  SUDESTE: { pac: [3890, 8], sedex: [5990, 3] },
  CENTRO: { pac: [4490, 10], sedex: [7290, 4] },
  NORDESTE: { pac: [5290, 12], sedex: [8990, 5] },
  NORTE: { pac: [5990, 14], sedex: [9990, 6] },
};
const UF_REGION: Record<string, keyof typeof REGION> = {
  RS: "RS", SC: "SC", PR: "PR",
  SP: "SUDESTE", RJ: "SUDESTE", MG: "SUDESTE", ES: "SUDESTE",
  DF: "CENTRO", GO: "CENTRO", MT: "CENTRO", MS: "CENTRO",
  BA: "NORDESTE", SE: "NORDESTE", AL: "NORDESTE", PE: "NORDESTE", PB: "NORDESTE", RN: "NORDESTE", CE: "NORDESTE", PI: "NORDESTE", MA: "NORDESTE",
  PA: "NORTE", AP: "NORTE", AM: "NORTE", RR: "NORTE", RO: "NORTE", AC: "NORTE", TO: "NORTE",
};

export const FREE_SHIPPING_CENTS = 39900; // frete Correios PAC grátis acima disso (RS e SC) — TROCAR

export function cleanCep(cep: string) {
  const d = cep.replace(/\D/g, "");
  return d.length === 8 ? d : null;
}

const cache = new Map<string, { at: number; addr: Address | null }>();

export async function lookupCep(cepRaw: string): Promise<Address | null> {
  const cep = cleanCep(cepRaw);
  if (!cep) return null;
  const hit = cache.get(cep);
  if (hit && Date.now() - hit.at < 1000 * 60 * 60 * 12) return hit.addr;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) throw new Error(String(res.status));
    const j = (await res.json()) as Record<string, string | boolean>;
    const addr: Address | null = j.erro
      ? null
      : {
          cep,
          street: String(j.logradouro ?? ""),
          district: String(j.bairro ?? ""),
          city: String(j.localidade ?? ""),
          uf: String(j.uf ?? ""),
        };
    cache.set(cep, { at: Date.now(), addr });
    return addr;
  } catch {
    // ViaCEP fora do ar: CEPs de Três Coroas ainda funcionam pelo prefixo
    if (cep.startsWith("95660")) {
      return { cep, street: "", district: "", city: "Três Coroas", uf: "RS" };
    }
    return null;
  }
}

export function optionsFor(addr: Address, subtotalCents: number): ShippingOption[] {
  const opts: ShippingOption[] = [];
  const moto = addr.uf === "RS" ? MOTOBOY[norm(addr.city)] : undefined;
  if (moto) {
    opts.push({
      method: "motoboy",
      label: "Motoboy Vynt",
      priceCents: moto.priceCents,
      eta: moto.eta,
      note: "Troca de numeração na porta, sem custo",
    });
  }
  const region = REGION[UF_REGION[addr.uf] ?? "SUDESTE"];
  const pacFree = subtotalCents >= FREE_SHIPPING_CENTS && (addr.uf === "RS" || addr.uf === "SC");
  opts.push({
    method: "correios_pac",
    label: "Correios PAC",
    priceCents: pacFree ? 0 : region.pac[0],
    eta: `Até ${region.pac[1]} dias úteis`,
    note: "Valor estimado",
  });
  opts.push({
    method: "correios_sedex",
    label: "Correios SEDEX",
    priceCents: region.sedex[0],
    eta: `Até ${region.sedex[1]} dias úteis`,
    note: "Valor estimado",
  });
  return opts;
}

export const PICKUP: ShippingOption = {
  method: "retirada",
  label: "Retirar na loja",
  priceCents: 0,
  eta: "Pronto em 1 hora",
  note: STORE.pickupAddress,
};
