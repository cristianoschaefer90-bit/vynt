import Image from "next/image";
import Link from "next/link";
import { liveCatalog } from "@/lib/catalog-server";
import { categories, HERO_SLUG } from "@/data/catalogo";
import { formatBRL } from "@/lib/money";
import { STORE } from "@/lib/config";
import { waLink } from "@/lib/whatsapp";
import { CountUp, Magnetic, MaskTitle, Reveal } from "@/components/motion";
import { Explode } from "@/components/home/explode";
import { BestSellers } from "@/components/home/best-sellers";
import { ProductCard } from "@/components/product-card";

export const revalidate = 60;

export default async function Home() {
  const all = await liveCatalog();
  const hero = all.find((p) => p.slug === HERO_SLUG) ?? all[0];
  const best = [...all].sort((a, b) => b.sold - a.sold).slice(0, 6);
  const sold = all.reduce((s, p) => s + p.sold, 0);
  const reviews = all.flatMap((p) => p.reviews);
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / Math.max(1, reviews.length);
  const fresh = [...all].sort((a, b) => Number(b.badge === "novo") - Number(a.badge === "novo") || a.sold - b.sold).slice(0, 4);

  return (
    <>
      {/* ───── Banner principal (foto de uso) ───── */}
      <section aria-labelledby="capa-titulo" className="relative">
        <div className="relative h-[calc(100svh-var(--barra)-32px)] min-h-[520px] max-h-[900px] overflow-hidden bg-tinta">
          <picture>
            <source media="(max-width: 767px)" srcSet="/lifestyle/hero-m.webp" />
            <Image
              src="/lifestyle/hero.webp"
              alt="Dois amigos sentados num muro de pedra numa rua de paralelepípedo, de Órbita Runner e Quadra 86"
              fill
              priority
              fetchPriority="high"
              sizes="100vw"
              className="object-cover object-[30%_60%]"
            />
          </picture>
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-tinta/75 via-tinta/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto max-w-[1440px] px-4 pb-8 md:px-8 md:pb-12">
              <p className="rotulo !text-papel/80">Edição nº 11 · Vale do Paranhana</p>
              <MaskTitle as="h1" immediate className="mt-3 max-w-4xl font-serif text-mega tracking-[-0.02em] text-papel">
                <span id="capa-titulo">Pediu agora, calça hoje.</span>
              </MaskTitle>
              <Reveal immediate delay={0.3} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Magnetic>
                  <Link href="/loja?ordem=novos" className="btn bg-papel text-tinta hover:bg-telha hover:text-white">
                    Ver lançamentos
                  </Link>
                </Magnetic>
                <Link href={`/p/${hero.slug}`} className="btn border border-papel/60 text-papel hover:bg-papel hover:text-tinta">
                  {hero.name} · {formatBRL(hero.priceCents)}
                </Link>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Coleções ───── */}
      <section aria-label="Coleções" className="mx-auto mt-4 grid max-w-[1440px] gap-4 px-4 md:mt-6 md:grid-cols-3 md:px-8">
        {[
          { slug: "casual", img: "/lifestyle/casual.webp", kicker: "Para o dia todo", alt: "Tênis Trama Low sobre uma cadeira de madeira ao lado de uma caneca de café" },
          { slug: "streetwear", img: "/lifestyle/streetwear.webp", kicker: "Cano, volume, camurça", alt: "Pessoa sentada numa escadaria com grafite, de Basalto High" },
          { slug: "corrida", img: "/lifestyle/corrida.webp", kicker: "Para o asfalto e o chão batido", alt: "Corredora numa estrada de chão à beira do rio, de Pulso 2" },
        ].map((c) => {
          const cat = categories.find((x) => x.slug === c.slug)!;
          const n = all.filter((p) => p.category === c.slug).length;
          return (
            <Link key={c.slug} href={`/loja/${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden bg-tinta md:aspect-[3/4]">
              <Image src={c.img} alt={c.alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-[1.4s] ease-expo group-hover:scale-[1.05]" />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-tinta/70 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-papel">
                <div>
                  <p className="rotulo !text-papel/80">{c.kicker}</p>
                  <h2 className="mt-1 font-serif text-5xl leading-none">{cat.name}</h2>
                </div>
                <span className="num shrink-0 text-sm underline-offset-4 group-hover:underline">{n} modelos →</span>
              </div>
            </Link>
          );
        })}
      </section>

      {/* ───── Lançamentos ───── */}
      <section aria-labelledby="lancamentos" className="mx-auto mt-24 max-w-[1440px] px-4 md:px-8">
        <div className="flex items-end justify-between gap-6 border-b border-tinta pb-3">
          <h2 id="lancamentos" className="font-serif text-titulo">
            Lançamentos
          </h2>
          <Link href="/loja?ordem=novos" className="link shrink-0 text-sm">
            Ver tudo
          </Link>
        </div>
        <ul className="-mx-4 mt-8 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
          {fresh.map((p, i) => (
            <li key={p.slug} className="w-[72vw] max-w-[320px] shrink-0 snap-start md:w-auto md:max-w-none">
              <ProductCard p={p} stock={p.stockBySku} priority={i < 2} sizes="(min-width: 768px) 25vw, 72vw" />
            </li>
          ))}
        </ul>
      </section>

      {/* ───── Escolha por modelo ───── */}
      <section aria-labelledby="modelo" className="mx-auto mt-24 max-w-[1440px] px-4 md:px-8">
        <h2 id="modelo" className="rotulo !text-tinta">
          Escolha por modelo
        </h2>
        <ul className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-6 md:px-0 lg:grid-cols-12 [&::-webkit-scrollbar]:hidden">
          {all.map((p) => (
            <li key={p.slug} className="w-28 shrink-0 md:w-auto">
              <Link href={`/p/${p.slug}`} className="group block text-center">
                <span className="relative block aspect-square overflow-hidden bg-papel-2">
                  <Image src={p.colors[0].thumb} alt="" fill sizes="120px" className="object-contain transition-transform duration-700 ease-expo group-hover:scale-110" />
                </span>
                <span className="mt-2 block text-xs leading-tight group-hover:underline">{p.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ───── Momento uau ───── */}
      <div className="mt-24 md:mt-32">
        <Explode priceLabel={formatBRL(hero.priceCents)} />
      </div>

      {/* ───── Mais vendidos ───── */}
      <BestSellers items={best} />

      {/* ───── Como funciona (lista editorial, não cards) ───── */}
      <section aria-labelledby="servico-titulo" className="mx-auto mt-28 max-w-[1440px] px-4 md:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="rotulo">Serviço</p>
            <MaskTitle className="mt-2 font-serif text-titulo">
              <span id="servico-titulo">Comprar aqui é mais rápido que ir até a loja.</span>
            </MaskTitle>
            <div className="relative mt-10 hidden aspect-[4/5] max-w-md overflow-hidden lg:block">
              <Image src="/editorial/entrega.webp" alt="Entregador passando uma caixa de tênis na porta de uma casa de madeira" fill sizes="30vw" className="object-cover" />
            </div>
          </div>
          <ol className="divide-y divide-linha border-y border-linha lg:col-span-7">
            {[
              { t: "Entrega hoje", d: `Motoboy próprio em ${STORE.city} (grátis), Igrejinha, Taquara e Parobé. Pedidos até 14h–16h saem no mesmo dia.` },
              { t: "Retirada em 1 hora", d: `Escolhe "retirar na loja" e passa quando quiser. ${STORE.pickupHours}.` },
              { t: "Troca de número na porta", d: `Não serviu? Em até ${STORE.freeExchangeDays} dias o motoboy leva o outro número e busca o seu. Sem formulário.` },
              { t: `Pix com ${STORE.pixDiscountPct}% ou ${STORE.maxInstallments}× sem juros`, d: "Pix com QR na hora, ou link de cartão no WhatsApp. Se preferir, fecha tudo pelo WhatsApp." },
            ].map((s, i) => (
              <li key={s.t} className="grid grid-cols-[3.5rem_1fr] gap-x-4 py-7 md:grid-cols-[6rem_1fr]">
                <span className="num font-serif text-4xl text-telha md:text-5xl">{i + 1}</span>
                <div>
                  <h3 className="text-xl font-medium">{s.t}</h3>
                  <p className="mt-2 max-w-prose text-tinta-2">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───── Prova social ───── */}
      <section aria-labelledby="prova-titulo" className="mx-auto mt-28 max-w-[1440px] px-4 md:px-8">
        <h2 id="prova-titulo" className="sr-only">
          Números da loja
        </h2>
        <dl className="grid grid-cols-2 gap-y-10 border-t border-tinta pt-8 md:grid-cols-4">
          <div>
            <dt className="rotulo">Pares entregues</dt>
            <dd className="mt-2 font-serif text-6xl md:text-7xl">
              <CountUp value={sold} />
            </dd>
          </div>
          <div>
            <dt className="rotulo">Nota média</dt>
            <dd className="mt-2 font-serif text-6xl md:text-7xl">
              <CountUp value={avg} decimals={1} />
            </dd>
          </div>
          <div>
            <dt className="rotulo">Cidades com motoboy</dt>
            <dd className="mt-2 font-serif text-6xl md:text-7xl">
              <CountUp value={8} />
            </dd>
          </div>
          <div>
            <dt className="rotulo">Dias para trocar</dt>
            <dd className="mt-2 font-serif text-6xl md:text-7xl">
              <CountUp value={STORE.freeExchangeDays} />
            </dd>
          </div>
        </dl>
        <div className="mt-14 flex flex-col items-start gap-6 border-t border-linha pt-10 md:flex-row md:items-center md:justify-between">
          <p className="max-w-xl font-serif text-4xl leading-tight">Ficou na dúvida do número? Manda a foto do seu tênis atual.</p>
          <Magnetic>
            <a className="btn btn-telha" href={waLink("Oi, Vynt! Me ajuda a escolher a numeração?")} target="_blank" rel="noopener noreferrer">
              Perguntar no WhatsApp
            </a>
          </Magnetic>
        </div>
      </section>
    </>
  );
}
