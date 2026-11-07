"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cart, useCart, useHydrated } from "@/lib/cart";
import { categories } from "@/data/catalogo";

export function Header() {
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.qty, 0));
  const hydrated = useHydrated();
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setMenu(false), [path]);

  if (path.startsWith("/admin")) return null;
  const checkout = path.startsWith("/checkout");

  return (
    <header
      className={`sticky top-0 z-40 h-[var(--barra)] transition-[background-color,border-color] duration-500 ${
        scrolled || menu ? "border-b border-linha bg-papel/95 backdrop-blur-sm" : "border-b border-transparent bg-papel"
      }`}
    >
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-4 px-4 md:px-8">
        <Link href="/" className="font-serif text-[1.9rem] leading-none tracking-tight" aria-label="Vynt, página inicial">
          Vynt
        </Link>

        {!checkout && (
          <nav aria-label="Categorias" className="hidden items-center gap-8 text-sm md:flex">
            <Link href="/loja" className={path === "/loja" ? "link" : "hover:text-telha"}>
              Tudo
            </Link>
            {categories.map((c) => (
              <Link key={c.slug} href={`/loja/${c.slug}`} className={path === `/loja/${c.slug}` ? "link" : "hover:text-telha"}>
                {c.name}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-1">
          {!checkout && (
            <Link href="/conta" className="hidden min-h-11 items-center px-3 text-sm hover:text-telha sm:inline-flex">
              Minha conta
            </Link>
          )}
          {!checkout && (
            <button
              type="button"
              onClick={() => cart.open(true)}
              className="inline-flex min-h-11 items-center gap-2 px-3 text-sm"
              aria-label={`Sacola, ${hydrated ? count : 0} ${count === 1 ? "item" : "itens"}`}
            >
              Sacola
              <span className="num inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-tinta px-1.5 text-[0.75rem] text-papel">
                {hydrated ? count : 0}
              </span>
            </button>
          )}
          {!checkout && (
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center justify-center md:hidden"
              aria-expanded={menu}
              aria-controls="menu-celular"
              onClick={() => setMenu((v) => !v)}
            >
              <span className="sr-only">{menu ? "Fechar menu" : "Abrir menu"}</span>
              <span aria-hidden className="relative block h-3 w-5">
                <span className={`absolute left-0 h-px w-5 bg-tinta transition-transform duration-500 ease-expo ${menu ? "top-1.5 rotate-45" : "top-0"}`} />
                <span className={`absolute left-0 h-px w-5 bg-tinta transition-transform duration-500 ease-expo ${menu ? "top-1.5 -rotate-45" : "top-3"}`} />
              </span>
            </button>
          )}
        </div>
      </div>

      {menu && (
        <nav id="menu-celular" aria-label="Menu" className="border-b border-linha bg-papel px-4 pb-8 pt-4 md:hidden">
          <ul className="space-y-1">
            {[{ href: "/loja", name: "Tudo" }, ...categories.map((c) => ({ href: `/loja/${c.slug}`, name: c.name })), { href: "/conta", name: "Minha conta" }].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block py-2 font-serif text-4xl">
                  {l.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
