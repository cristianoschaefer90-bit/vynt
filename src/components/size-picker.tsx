"use client";

import { useId } from "react";
import type { Variant } from "@/data/catalogo";

export function SizePicker({
  variants,
  stock,
  value,
  onChange,
  error,
}: {
  variants: Variant[];
  stock: Record<string, number>;
  value: string | null;
  onChange: (sku: string) => void;
  error?: boolean;
}) {
  const id = useId();
  return (
    <fieldset aria-describedby={error ? `${id}-erro` : undefined}>
      <legend className="sr-only">Numeração</legend>
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-6">
        {variants.map((v) => {
          const n = stock[v.sku] ?? v.stock;
          const out = n <= 0;
          const sel = value === v.sku;
          return (
            <label
              key={v.sku}
              className={`relative flex h-12 cursor-pointer items-center justify-center border text-sm transition-colors duration-300 ${
                sel ? "border-tinta bg-tinta text-papel" : out ? "cursor-not-allowed border-linha text-tinta-3/60" : "border-linha bg-white hover:border-tinta"
              } has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-telha`}
            >
              <input
                type="radio"
                name={`${id}-tam`}
                value={v.sku}
                checked={sel}
                disabled={out}
                onChange={() => onChange(v.sku)}
                className="sr-only"
                aria-label={`Número ${v.size}${out ? ", esgotado" : n <= 2 ? `, últimos ${n}` : ""}`}
              />
              <span className={`num ${out ? "line-through" : ""}`}>{v.size}</span>
              {!out && n <= 2 && <span aria-hidden className="absolute right-1 top-1 size-1.5 rounded-full bg-telha" />}
            </label>
          );
        })}
      </div>
      {error && (
        <p id={`${id}-erro`} role="alert" className="mt-2 text-sm text-telha">
          Escolhe o número antes de colocar na sacola.
        </p>
      )}
    </fieldset>
  );
}
