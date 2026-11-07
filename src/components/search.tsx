"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { categories, products } from "@/data/catalogo";
import { formatBRL } from "@/lib/money";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const INDEX = products.map((p) => ({
  p,
  text: norm([p.name, p.short, p.colors[0].name, categories.find((c) => c.slug === p.category)?.name].join(" ")),
}));

/** Busca instantânea no catálogo (nome, cor, categoria, descrição). */
export function Search() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const ov = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = ov;
    };
  }, [open]);

  const results = useMemo(() => {
    const terms = norm(q).split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return INDEX.filter((i) => terms.every((t) => i.text.includes(t))).map((i) => i.p).slice(0, 6);
  }, [q]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 px-2 text-sm hover:text-telha" aria-label="Buscar">
        <svg aria-hidden viewBox="0 0 20 20" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8.5" cy="8.5" r="6" />
          <path d="m13 13 5 5" />
        </svg>
        <span className="hidden lg:inline">Buscar</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Buscar tênis">
          <button type="button" tabIndex={-1} aria-label="Fechar busca" className="absolute inset-0 bg-tinta/40" onClick={() => setOpen(false)} />
          <div className="relative bg-papel px-4 pb-6 pt-4 md:px-8">
            <div className="mx-auto max-w-[1440px]">
              <form
                role="search"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (results[0]) window.location.href = `/p/${results[0].slug}`;
                }}
                className="flex items-center gap-3 border-b border-tinta"
              >
                <label htmlFor="busca" className="sr-only">
                  Buscar
                </label>
                <input
                  ref={input}
                  id="busca"
                  value={q}
                  onChange={(e) => setQ(e.target.value.slice(0, 60))}
                  placeholder="Corrida, branco, cano alto…"
                  className="min-h-16 w-full bg-transparent font-serif text-3xl outline-none placeholder:text-tinta-3/60 md:text-5xl"
                  autoComplete="off"
                />
                <button type="button" className="min-h-11 shrink-0 text-sm underline underline-offset-4" onClick={() => setOpen(false)}>
                  Fechar
                </button>
              </form>
              <div aria-live="polite" className="mt-4">
                {q && results.length === 0 && <p className="text-tinta-2">Nada com “{q}”. Tenta “corrida”, “preto” ou “couro”.</p>}
                {!q && (
                  <div className="flex flex-wrap gap-2 text-sm">
                    {["Corrida", "Branco", "Cano alto", "Couro", "Preto"].map((s) => (
                      <button key={s} type="button" className="min-h-10 border border-linha px-3 hover:border-tinta" onClick={() => setQ(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {results.map((p) => (
                    <li key={p.slug}>
                      <Link href={`/p/${p.slug}`} onClick={() => setOpen(false)} className="group block">
                        <div className="relative aspect-square bg-papel-2">
                          <Image src={p.colors[0].thumb} alt="" fill sizes="200px" className="object-contain" />
                        </div>
                        <p className="mt-2 text-sm font-medium group-hover:underline">{p.name}</p>
                        <p className="num text-sm text-tinta-3">{formatBRL(p.priceCents)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
