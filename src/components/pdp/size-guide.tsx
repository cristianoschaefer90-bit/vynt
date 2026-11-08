"use client";

import { useEffect, useRef, useState } from "react";

// Tabela de medidas (comprimento do pé em cm). TROCAR pela forma real de cada marca/modelo.
const TABLE = [
  [34, 22.5], [35, 23.2], [36, 23.9], [37, 24.6], [38, 25.3], [39, 26.0],
  [40, 26.7], [41, 27.4], [42, 28.1], [43, 28.8], [44, 29.5],
] as const;

export function SizeGuide() {
  const [open, setOpen] = useState(false);
  const [cm, setCm] = useState("");
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  const n = Number(cm.replace(",", "."));
  const suggestion = n >= 20 && n <= 32 ? (TABLE.find(([, c]) => c >= n - 0.05)?.[0] ?? 44) : null;

  return (
    <>
      <button type="button" className="text-tinta-3 underline underline-offset-4" onClick={() => setOpen(true)}>
        Guia de tamanhos
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === ref.current && setOpen(false)}
        className="m-auto w-[min(92vw,440px)] bg-papel p-0 text-tinta backdrop:bg-tinta/40"
        aria-labelledby="guia-titulo"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id="guia-titulo" className="font-serif text-3xl">
              Guia de tamanhos
            </h2>
            <button type="button" className="min-h-10 text-sm underline" onClick={() => setOpen(false)}>
              Fechar
            </button>
          </div>
          <p className="mt-2 text-sm text-tinta-2">Pise numa folha, marque o calcanhar e a ponta do dedo maior e meça em centímetros.</p>
          <label className="mt-4 block text-sm">
            Seu pé mede (cm)
            <input className="campo num mt-1.5" inputMode="decimal" placeholder="25,5" value={cm} onChange={(e) => setCm(e.target.value.slice(0, 5))} />
          </label>
          <p className="mt-2 min-h-6 text-sm" aria-live="polite">
            {suggestion && (
              <>
                Sugestão: <strong className="font-medium">nº {suggestion}</strong>. Se ficar entre dois, pegue o maior.
              </>
            )}
          </p>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-tinta text-left">
                <th className="py-2 font-medium">Número (BR)</th>
                <th className="py-2 text-right font-medium">Pé até (cm)</th>
              </tr>
            </thead>
            <tbody>
              {TABLE.map(([s, c]) => (
                <tr key={s} className={`border-b border-linha ${suggestion === s ? "bg-papel-2 font-medium" : ""}`}>
                  <td className="num py-1.5">{s}</td>
                  <td className="num py-1.5 text-right">{c.toFixed(1).replace(".", ",")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </dialog>
    </>
  );
}
