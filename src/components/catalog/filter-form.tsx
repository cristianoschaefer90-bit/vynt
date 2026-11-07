"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { SIZES } from "@/data/catalogo";
import { COLOR_FAMILIES, PRICE_RANGES, SORTS, type Filters } from "@/lib/filters";

/** Formulário GET: funciona sem JS; com JS, aplica na hora sem recarregar. */
export function FilterForm({ f, total }: { f: Filters; total: number }) {
  const router = useRouter();
  const path = usePathname();
  const form = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const active = f.tamanho.length + f.cor.length + (f.preco ? 1 : 0);

  const submit = () => {
    const fd = new FormData(form.current!);
    const q = new URLSearchParams();
    for (const [k, v] of fd) if (v && !(k === "ordem" && v === "relevancia")) q.append(k, String(v));
    start(() => router.replace(`${path}${q.size ? `?${q}` : ""}`, { scroll: false }));
  };

  return (
    <form ref={form} method="get" onChange={submit} onSubmit={(e) => { e.preventDefault(); submit(); }} aria-busy={pending}>
      <div className="flex items-center justify-between gap-3 border-y border-linha py-3">
        <button
          type="button"
          className="min-h-11 text-sm lg:hidden"
          aria-expanded={open}
          aria-controls="filtros"
          onClick={() => setOpen((v) => !v)}
        >
          Filtrar{active ? ` (${active})` : ""}
        </button>
        <p className="num hidden text-sm text-tinta-3 lg:block" aria-live="polite">
          {total} {total === 1 ? "modelo" : "modelos"}
        </p>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-tinta-3">Ordenar</span>
          <select name="ordem" defaultValue={f.ordem} className="h-11 border-0 bg-transparent pr-1 text-sm font-medium">
            {SORTS.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div id="filtros" className={`${open ? "block" : "hidden"} space-y-8 py-6 lg:block`}>
        <fieldset>
          <legend className="rotulo mb-3">Numeração</legend>
          <div className="grid grid-cols-6 gap-1.5 lg:grid-cols-4">
            {SIZES.map((s) => (
              <label key={s} className="flex h-11 cursor-pointer items-center justify-center border border-linha bg-white text-sm has-[:checked]:border-tinta has-[:checked]:bg-tinta has-[:checked]:text-papel has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-telha">
                <input type="checkbox" name="tamanho" value={s} defaultChecked={f.tamanho.includes(s)} className="sr-only" />
                <span className="num">{s}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="rotulo mb-3">Cor</legend>
          <div className="space-y-1">
            {COLOR_FAMILIES.map((c) => (
              <label key={c.slug} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                <input type="checkbox" name="cor" value={c.slug} defaultChecked={f.cor.includes(c.slug)} className="size-4 accent-tinta" />
                <span aria-hidden className="size-4 rounded-full border border-linha" style={{ background: c.hex }} />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="rotulo mb-3">Preço</legend>
          <div className="space-y-1">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
              <input type="radio" name="preco" value="" defaultChecked={!f.preco} className="size-4 accent-tinta" />
              Qualquer preço
            </label>
            {PRICE_RANGES.map((p) => (
              <label key={p.slug} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                <input type="radio" name="preco" value={p.slug} defaultChecked={f.preco === p.slug} className="size-4 accent-tinta" />
                {p.name}
              </label>
            ))}
          </div>
        </fieldset>

        {active > 0 && (
          <button
            type="button"
            className="min-h-11 text-sm underline underline-offset-4"
            onClick={() => start(() => router.replace(f.ordem !== "relevancia" ? `${path}?ordem=${f.ordem}` : path, { scroll: false }))}
          >
            Limpar filtros
          </button>
        )}
        <noscript>
          <button type="submit" className="btn btn-tinta w-full">
            Aplicar
          </button>
        </noscript>
      </div>
    </form>
  );
}
