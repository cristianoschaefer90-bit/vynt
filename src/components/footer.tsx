"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { STORE } from "@/lib/config";
import { waLink } from "@/lib/whatsapp";

export function Footer() {
  const path = usePathname();
  if (path.startsWith("/admin") || path.startsWith("/checkout")) return null;
  return (
    <footer className="mt-24">
      <div className="bg-tinta text-papel">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-4 pb-10 pt-16 md:grid-cols-12 md:px-8">
        <div className="md:col-span-6">
          <p className="font-serif text-[clamp(3rem,9vw,7rem)] leading-[0.9]">Vynt</p>
          <p className="mt-4 max-w-sm text-sm text-papel/75">
            Tênis originais em {STORE.city}/{STORE.uf}. Entrega no mesmo dia no Vale do Paranhana e envio para todo o Brasil.
          </p>
        </div>
        <div className="space-y-3 text-sm md:col-span-3">
          <p className="rotulo !text-papel/60">Loja</p>
          <p>{STORE.pickupAddress}</p>
          <p className="text-papel/75">{STORE.pickupHours}</p>
        </div>
        <div className="space-y-3 text-sm md:col-span-3">
          <p className="rotulo !text-papel/60">Fala com a gente</p>
          <a className="link block w-fit" href={waLink("Oi, Vynt! Tenho uma dúvida.")} target="_blank" rel="noopener noreferrer">
            WhatsApp {STORE.whatsappDisplay}
          </a>
          <Link className="link block w-fit" href="/conta">
            Meus pedidos
          </Link>
          <Link className="link block w-fit" href="/trocas">
            Trocas e devoluções
          </Link>
        </div>
        <div className="border-t border-papel/15 pt-8 md:col-span-12 md:flex md:items-center md:justify-between md:gap-8">
          <p className="font-serif text-3xl">Lista VIP no WhatsApp</p>
          <p className="mt-2 max-w-md text-sm text-papel/75 md:mt-0">Lançamentos e reposição de numeração antes de todo mundo. Uma mensagem por semana, no máximo.</p>
          <a className="btn mt-4 bg-papel text-tinta hover:bg-telha hover:text-white md:mt-0" href={waLink("Oi, Vynt! Quero entrar na lista VIP de lançamentos.")} target="_blank" rel="noopener noreferrer">
            Entrar na lista
          </a>
        </div>
        <p className="text-xs text-papel/60 md:col-span-12">
          © {new Date().getFullYear()} Vynt.{" "}
          {STORE.demo && "Loja de demonstração: produtos, preços e avaliações são exemplos. Fotos ilustrativas."}
        </p>
      </div>
      </div>
    </footer>
  );
}
