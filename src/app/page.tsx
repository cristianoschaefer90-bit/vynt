import Image from "next/image";
import Link from "next/link";
import { liveCatalog } from "@/lib/catalog-server";
import { categories, HERO_SLUG } from "@/data/catalogo";
import { formatBRL, installments } from "@/lib/money";
import { STORE } from "@/lib/config";
import { waLink } from "@/lib/whatsapp";
import { CountUp, Magnetic, MaskTitle, Reveal } from "@/components/motion";
import { Explode } from "@/components/home/explode";
import { BestSellers } from "@/components/home/best-sellers";
import { HeroAdd } from "@/components/home/hero-add";

export const revalidate = 60;

export default async function Home() {
  const all = await liveCatalog();
  const hero = all.find((p) => p.slug === HERO_SLUG) ?? all[0];
  const best = [...all].sort((a, b) => b.sold - a.sold).slice(0, 6);
  const sold = all.reduce((s, p) => s + p.sold, 0);
  const reviews = all.flatMap((p) => p.reviews);
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / Math.max(1, reviews.length);
  const parc = installments(hero.priceCents, STORE.maxInstallments, STORE.minInstallmentCents);
  const pix = Math.round(hero.priceCents * (1 - STORE.pixDiscountPct / 100));

  return (
    <>
      {/* ───── Capa ───── */}
      <section aria-labelledby="capa-titulo" className="mx-auto max-w-[1440px] px-4 md:px-8">
        <div className="flex items-center justify-between border-b border-tinta py-3 text-[0.6875rem] uppercase tracking-[0.14em]">
          <span>Edição nº 11 · Novembro</span>
          <span className="hidden sm:inline">Vale do Paranhana, RS</span>
          <span>Entrega hoje até 16h</span>
        </div>

        <div className="grid gap-x-8 pt-8 lg:grid-cols-12 lg:pt-10">
          <div className="lg:col-span-7">
            <MaskTitle as="h1" immediate className="font-serif text-mega tracking-[-0.02em]">
              <span id="capa-titulo">Pediu agora, calça hoje.</span>
            </MaskTitle>
            <Reveal delay={0.25} className="mt-6 max-w-md text-lg text-tinta-2">
              <p>
                Tênis originais escolhidos a dedo, entregues por motoboy em {STORE.city}, Igrejinha e Taquara. Não serviu? A gente troca o número na sua porta.
              </p>
            </Reveal>
          </div>

          <div className="relative mt-10 lg:col-span-5 lg:mt-0">
            <Link href={`/p/${hero.slug}`} className="group relative block aspect-[4/5] overflow-hidden bg-papel-2">
              <Image
                src={hero.colors[0].images[0]}
                alt={`${hero.name} em ${hero.colors[0].name}, vista lateral`}
                fill
                priority
                fetchPriority="high"
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover transition-transform duration-[1.4s] ease-expo group-hover:scale-[1.03]"
              />
              <span className="absolute left-4 top-4 bg-papel px-2 py-1 text-[0.6875rem] uppercase tracking-[0.12em]">Capa</span>
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 border-t border-linha pt-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="rotulo">Produto da capa</p>
            <p className="mt-1 font-serif text-4xl">{hero.name}</p>
            <p className="mt-1 text-tinta-2">{hero.short}</p>
          </div>
          <div className="flex flex-col gap-4 lg:col-span-5">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <p className="num text-3xl">{formatBRL(hero.priceCents)}</p>
              {hero.compareAtCents && <p className="num text-tinta-3 line-through">{formatBRL(hero.compareAtCents)}</p>}
              <p className="num w-full text-sm text-tinta-2">
                {formatBRL(pix)} no Pix · ou {parc.n}× de {formatBRL(parc.each)} sem juros
              </p>
            </div>
            <HeroAdd product={hero} />
          </div>
        </div>
      </section>

      {/* ───── Momento uau ───── */}
      <div className="mt-20 md:mt-28">
        <Explode priceLabel={formatBRL(hero.priceCents)} />
      </div>

      {/* ───── Mais vendidos ───── */}
      <BestSellers items={best} />

      {/* ───── Editorial: a rua ───── */}
      <section aria-labelledby="rua-titulo" className="relative mt-16">
        <picture>
          <source media="(max-width: 767px)" srcSet="/editorial/rua-m.webp" />
          <Image
            src="/editorial/rua.webp"
            alt="Pessoa caminhando de Órbita numa rua de paralelepípedo, com morros e neblina ao fundo"
            width={2200}
            height={1228}
            sizes="100vw"
            className="h-[78svh] w-full object-cover md:h-auto md:max-h-[92svh]"
          />
        </picture>
        <div className="mx-auto grid max-w-[1440px] gap-6 px-4 pt-6 md:grid-cols-12 md:px-8">
          <p className="rotulo md:col-span-3">Foto ilustrativa</p>
          <MaskTitle className="font-serif text-titulo md:col-span-6">
            <span id="rua-titulo">Pediu às 14h. Às 16h40 já estava na rua.</span>
          </MaskTitle>
          <Reveal className="text-tinta-2 md:col-span-3">
            <p>Sem esperar semana de transportadora e sem viagem até Porto Alegre. O pedido sai da loja em {STORE.city} pelo motoboy.</p>
          </Reveal>
        </div>
      </section>

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

      {/* ───── Índice de categorias ───── */}
      <section aria-labelledby="indice-titulo" className="mx-auto mt-28 max-w-[1440px] px-4 md:px-8">
        <div className="flex items-end justify-between border-b border-tinta pb-3">
          <h2 id="indice-titulo" className="rotulo !text-tinta">
            Índice
          </h2>
          <span className="rotulo num">{all.length} modelos</span>
        </div>
        <ul>
          {categories.map((c, i) => {
            const items = all.filter((p) => p.category === c.slug);
            const cover = items[0];
            return (
              <li key={c.slug} className="border-b border-linha">
                <Link href={`/loja/${c.slug}`} className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 py-6 md:grid-cols-[4rem_1fr_1fr_auto] md:py-8">
                  <span className="num text-sm text-tinta-3">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-serif text-5xl transition-colors duration-500 group-hover:text-telha md:text-7xl">{c.name}</span>
                  <span className="hidden text-tinta-2 md:block">{c.tagline}</span>
                  <span className="flex items-center gap-4">
                    <span className="num text-sm text-tinta-3">{items.length}</span>
                    {cover && (
                      <span className="relative hidden size-20 overflow-hidden bg-papel-2 sm:block">
                        <Image src={cover.colors[0].thumb} alt="" fill sizes="80px" className="object-contain transition-transform duration-700 ease-expo group-hover:scale-110" />
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
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
