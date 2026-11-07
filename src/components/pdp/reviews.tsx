"use client";

import Image from "next/image";
import { useState } from "react";
import type { Review } from "@/data/catalogo";
import { waLink } from "@/lib/whatsapp";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" });

function Stars({ n, size = "text-base" }: { n: number; size?: string }) {
  return (
    <span className={`${size} tracking-[0.1em] text-telha`} aria-hidden>
      {"★★★★★".slice(0, Math.round(n))}
      <span className="text-linha">{"★★★★★".slice(Math.round(n))}</span>
    </span>
  );
}

export function Reviews({ reviews, productName }: { reviews: Review[]; productName: string }) {
  const [filter, setFilter] = useState<number | null>(null);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: reviews.filter((r) => r.rating === n).length }));
  const list = [...reviews]
    .filter((r) => (filter ? r.rating === filter : true))
    .sort((a, b) => Number(Boolean(b.photo)) - Number(Boolean(a.photo)) || b.date.localeCompare(a.date));

  return (
    <section aria-labelledby="avaliacoes" className="mt-24 grid gap-10 border-t border-tinta pt-8 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <h2 id="avaliacoes" className="rotulo !text-tinta">
          Avaliações
        </h2>
        {reviews.length ? (
          <>
            <p className="mt-4 flex items-baseline gap-3">
              <span className="num font-serif text-8xl leading-none">{avg.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</span>
              <span className="text-sm text-tinta-3">
                de 5 · {reviews.length} {reviews.length === 1 ? "avaliação" : "avaliações"}
              </span>
            </p>
            <span className="sr-only">Nota média {avg.toFixed(1)} de 5</span>
            <Stars n={avg} size="text-xl" />
            <ul className="mt-6 space-y-1.5">
              {dist.map((d) => (
                <li key={d.n}>
                  <button
                    type="button"
                    aria-pressed={filter === d.n}
                    disabled={!d.c}
                    onClick={() => setFilter((f) => (f === d.n ? null : d.n))}
                    className={`grid min-h-9 w-full grid-cols-[2.2rem_1fr_1.5rem] items-center gap-3 text-sm disabled:opacity-40 ${filter === d.n ? "font-medium" : ""}`}
                  >
                    <span className="num text-left">{d.n} ★</span>
                    <span className="h-1.5 bg-papel-2" role="presentation">
                      <span className="block h-full bg-tinta transition-[width] duration-700 ease-expo" style={{ width: `${(d.c / reviews.length) * 100}%` }} />
                    </span>
                    <span className="num text-right text-tinta-3">{d.c}</span>
                  </button>
                </li>
              ))}
            </ul>
            {filter && (
              <button type="button" className="mt-3 min-h-10 text-sm underline underline-offset-4" onClick={() => setFilter(null)}>
                Ver todas
              </button>
            )}
          </>
        ) : (
          <p className="mt-4 font-serif text-4xl leading-tight">Ainda sem avaliações. Comprou? Conta pra gente.</p>
        )}
        <a
          className="btn btn-linha mt-8"
          href={waLink(`Oi, Vynt! Quero avaliar o ${productName}.`)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Avaliar este tênis
        </a>
      </div>

      <ul className="divide-y divide-linha lg:col-span-8">
        {list.map((r) => (
          <li key={r.author + r.date} className="grid gap-4 py-6 sm:grid-cols-[1fr_auto]">
            <div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Stars n={r.rating} />
                <span className="sr-only">{r.rating} de 5</span>
                <span className="text-sm font-medium">{r.author}</span>
                <span className="text-sm text-tinta-3">
                  {r.city} · {dateFmt.format(new Date(r.date))}
                </span>
              </div>
              <p className="mt-3 max-w-prose text-lg leading-snug">{r.body}</p>
            </div>
            {r.photo && (
              <div className="relative size-28 bg-papel-2">
                <Image src={r.photo} alt={`Foto enviada por ${r.author}`} fill sizes="112px" className="object-cover" />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
