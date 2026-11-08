import { STORE } from "@/lib/config";

const I = {
  entrega: <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7zM7 19a2 2 0 1 0 0-.01M17 19a2 2 0 1 0 0-.01" />,
  envio: <path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6zM8.5 12l2.5 2.5 4.5-5" />,
  pagamento: <path d="M3 6h18v12H3zM3 10h18M7 15h4" />,
  segura: <path d="M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3M12 15v2" />,
};

const ITEMS = [
  { k: "entrega", t: "Entrega hoje", d: `Motoboy em ${STORE.city} e região, pedidos até 16h` },
  { k: "envio", t: "Envio seguro", d: "Para todo o Brasil, com rastreio e troca grátis" },
  { k: "pagamento", t: "Pagamento facilitado", d: `${STORE.pixDiscountPct}% no Pix ou ${STORE.maxInstallments}× sem juros no cartão` },
  { k: "segura", t: "Compra segura", d: "Site protegido e tênis originais com nota" },
] as const;

/** Faixa de benefícios logo no início da página. */
export function Benefits() {
  return (
    <section aria-label="Benefícios" className="border-b border-linha">
      <ul className="mx-auto grid max-w-[1440px] grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((b, i) => (
          <li
            key={b.k}
            className={`flex items-start gap-3 px-4 py-5 md:px-8 ${i % 2 ? "border-l border-linha" : ""} ${i > 1 ? "border-t border-linha lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}
          >
            <svg aria-hidden viewBox="0 0 24 24" className="mt-0.5 size-6 shrink-0 text-telha" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {I[b.k]}
            </svg>
            <div className="min-w-0">
              <p className="text-sm font-medium md:text-base">{b.t}</p>
              <p className="mt-0.5 text-xs leading-snug text-tinta-3 md:text-sm">{b.d}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
