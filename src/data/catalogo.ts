// Catálogo da Vynt — fonte única de produtos, cores, tamanhos e estoque.
// DEMO: todos os produtos, preços, estoques e avaliações são exemplos. // TROCAR
// Quando o Supabase for ligado, este arquivo vira o seed (supabase/seed.sql).

export type CategorySlug = "casual" | "streetwear" | "corrida";

export interface Category {
  slug: CategorySlug;
  name: string;
  tagline: string;
}

export interface Variant {
  sku: string;
  color: string;
  colorSlug: string;
  hex: string;
  size: number;
  stock: number;
}

export interface ProductColor {
  name: string;
  slug: string;
  hex: string;
  images: string[];
  thumb: string;
}

export interface Review {
  author: string;
  city: string;
  rating: 1 | 2 | 3 | 4 | 5;
  body: string;
  photo?: string;
  date: string; // ISO yyyy-mm-dd
}

export interface Product {
  slug: string;
  name: string;
  category: CategorySlug;
  short: string;
  story: string;
  care: string;
  priceCents: number;
  compareAtCents?: number;
  badge?: "novo" | "mais_vendido";
  sold: number;
  colors: ProductColor[];
  variants: Variant[];
  reviews: Review[];
  pairsWith: string[];
}

export const SIZES = [34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44] as const;

export const categories: Category[] = [
  { slug: "casual", name: "Casual", tagline: "Da aula ao rolê, sem trocar de tênis." },
  { slug: "streetwear", name: "Streetwear", tagline: "Cano, volume e camurça. Feito para ser visto." },
  { slug: "corrida", name: "Corrida", tagline: "Amortecimento para o asfalto da RS-115." },
];

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// estoque determinístico (demo) — pontas da grade com menos pares
function demoStock(key: string, size: number) {
  let h = 2166136261;
  for (const c of key + size) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const r = Math.abs(h) % 7;
  if (size === 34 || size === 44) return r % 3;
  return 1 + r;
}

interface Seed extends Omit<Product, "colors" | "variants"> {
  palette: { name: string; hex: string }[];
}

function build(seed: Seed): Product {
  const { palette, ...rest } = seed;
  const colors: ProductColor[] = palette.map((c) => {
    const slug = slugify(c.name);
    return {
      name: c.name,
      slug,
      hex: c.hex,
      thumb: `/produtos/${seed.slug}/thumb.webp`,
      images: [1, 2, 3].map((n) => `/produtos/${seed.slug}/${n}.webp`),
    };
  });
  const variants: Variant[] = colors.flatMap((c) =>
    SIZES.map((size) => ({
      sku: `${seed.slug.toUpperCase()}-${c.slug.slice(0, 3).toUpperCase()}-${size}`,
      color: c.name,
      colorSlug: c.slug,
      hex: c.hex,
      size,
      stock: demoStock(seed.slug + c.slug, size),
    })),
  );
  return { ...rest, colors, variants };
}

const seeds: Seed[] = [
  {
    slug: "orbita",
    name: "Órbita Runner",
    category: "corrida",
    short: "Espuma dupla de 38 mm, malha respirável e painel em sela.",
    story:
      "Desenhado para quem corre cedo na beira do Paranhana. A espuma dupla segura o impacto nos primeiros quilômetros e devolve energia no final, quando a perna já pesa.",
    care: "Lave à mão com sabão neutro. Seque à sombra, sem secadora. Tire a palmilha para arejar.",
    priceCents: 59990,
    compareAtCents: 69990,
    badge: "mais_vendido",
    sold: 184,
    palette: [
      { name: "Osso e telha", hex: "#E2DACB" },
    ],
    pairsWith: ["pulso", "neblina", "trama"],
    reviews: [
      { author: "Júlia M.", city: "Igrejinha", rating: 5, body: "Chegou no mesmo dia, de tarde. Corri 8 km no domingo e nada de bolha.", date: "2026-10-12" },
      { author: "Rafael T.", city: "Três Coroas", rating: 5, body: "Troquei do 41 pro 42 sem pagar nada. O motoboy levou um e trouxe o outro.", date: "2026-09-28" },
      { author: "Bruna K.", city: "Taquara", rating: 4, body: "Muito confortável. O painel telha é um pouco mais fechado do que na tela.", date: "2026-09-02" },
    ],
  },
  {
    slug: "trama",
    name: "Trama Low",
    category: "casual",
    short: "Couro liso, sola vulcanizada caramelo, costura dupla.",
    story:
      "O tênis claro que combina com tudo, com costura dupla na biqueira para durar mais que uma estação e palmilha que não achata no primeiro mês.",
    care: "Pano úmido no cabedal, escova macia na sola. Evite água sanitária.",
    priceCents: 38990,
    badge: "mais_vendido",
    sold: 152,
    palette: [
      { name: "Branco gelo", hex: "#F1EEE8" },
    ],
    pairsWith: ["linha", "quadra", "varzea"],
    reviews: [
      { author: "Lucas P.", city: "Parobé", rating: 5, body: "Claro que não amarela fácil. Já comprei o segundo.", date: "2026-10-20" },
      { author: "Ana C.", city: "Três Coroas", rating: 4, body: "Forma um pouco justa, pedi meio número acima e ficou certo.", date: "2026-08-15" },
    ],
  },
  {
    slug: "basalto",
    name: "Basalto High",
    category: "streetwear",
    short: "Cano alto em camurça com recortes sobrepostos.",
    story:
      "Tons fechados, textura e volume, como a pedra do vale depois da chuva. Cano alto com acolchoado no tornozelo para aguentar o dia inteiro.",
    care: "Escova de camurça a seco. Aplique impermeabilizante antes do primeiro uso.",
    priceCents: 54990,
    badge: "novo",
    sold: 61,
    palette: [
      { name: "Basalto", hex: "#3A3632" },
    ],
    pairsWith: ["ferro", "bloco", "asfalto"],
    reviews: [
      { author: "Maria E.", city: "Taquara", rating: 5, body: "A camurça é muito boa. Passei impermeabilizante e aguentou a chuva de outubro.", date: "2026-10-30" },
    ],
  },
  {
    slug: "serra",
    name: "Serra Trail",
    category: "corrida",
    short: "Solado com cravos e biqueira reforçada.",
    story:
      "Para a trilha do morro e para a chuva de inverno. Cravos de 4 mm, biqueira emborrachada e cabedal que seca rápido.",
    care: "Retire o barro com escova. Seque com papel por dentro, longe do sol.",
    priceCents: 64990,
    badge: "novo",
    sold: 38,
    palette: [
      { name: "Musgo", hex: "#4A5240" },
    ],
    pairsWith: ["orbita", "pulso", "ferro"],
    reviews: [],
  },
  {
    slug: "pulso",
    name: "Pulso 2",
    category: "corrida",
    short: "Leve, 240 g, drop de 8 mm.",
    story:
      "Treino de ritmo e dia a dia. A segunda versão ganhou mais espuma no calcanhar e uma língua sem costura que não machuca o peito do pé.",
    care: "Lave à mão. Não use secadora.",
    priceCents: 47990,
    sold: 97,
    palette: [
      { name: "Azul-noite", hex: "#1F2A3A" },
    ],
    pairsWith: ["orbita", "neblina", "serra"],
    reviews: [
      { author: "Henrique D.", city: "Três Coroas", rating: 5, body: "Leve demais. Uso para treinar e para trabalhar.", date: "2026-10-03" },
    ],
  },
  {
    slug: "quadra",
    name: "Quadra 86",
    category: "casual",
    short: "Silhueta retrô de quadra, couro creme e camurça verde.",
    story: "Linhas de quadra dos anos 80 com palmilha atual. O tênis que segura um look inteiro sem esforço.",
    care: "Camurça: escova a seco. Couro: pano úmido.",
    priceCents: 42990,
    badge: "mais_vendido",
    sold: 131,
    palette: [
      { name: "Creme e verde", hex: "#EDE3CF" },
    ],
    pairsWith: ["trama", "linha", "basalto"],
    reviews: [
      { author: "Gabriel S.", city: "Igrejinha", rating: 5, body: "Retirei na loja no intervalo do almoço. Igual ao da foto.", date: "2026-10-18" },
    ],
  },
  {
    slug: "bloco",
    name: "Bloco Chunky",
    category: "streetwear",
    short: "Solado em camadas de 5 cm, couro e telha.",
    story: "Volume sem peso: o solado em camadas tem bolsões de ar para não cansar o pé no fim do dia.",
    care: "Escova macia e pano úmido. Guarde com enchimento de papel.",
    priceCents: 49990,
    sold: 74,
    palette: [
      { name: "Osso e couro", hex: "#D9CCB8" },
    ],
    pairsWith: ["basalto", "ferro", "asfalto"],
    reviews: [],
  },
  {
    slug: "varzea",
    name: "Várzea Slip",
    category: "casual",
    short: "Sem cadarço, elástico lateral, calça em 2 segundos.",
    story: "Para quem sai correndo de casa. Elástico lateral firme e palmilha removível.",
    care: "Lave à mão. Seque à sombra.",
    priceCents: 29990,
    compareAtCents: 34990,
    sold: 88,
    palette: [
      { name: "Preto", hex: "#1A1A1A" },
    ],
    pairsWith: ["trama", "linha", "quadra"],
    reviews: [],
  },
  {
    slug: "neblina",
    name: "Neblina Knit",
    category: "corrida",
    short: "Cabedal em tricô sem costura, ajuste de meia.",
    story: "Leve como a cerração da manhã na serra. O tricô se molda ao pé desde o primeiro uso.",
    care: "Máquina em ciclo delicado dentro de saco de lavagem. Seque à sombra.",
    priceCents: 44990,
    badge: "novo",
    sold: 29,
    palette: [
      { name: "Cinza mescla", hex: "#9A9792" },
    ],
    pairsWith: ["orbita", "pulso", "varzea"],
    reviews: [],
  },
  {
    slug: "asfalto",
    name: "Asfalto Skate",
    category: "streetwear",
    short: "Lona reforçada, camurça na biqueira, sola caramelo.",
    story: "Para a pista e para a rua. Lona dupla na área de atrito e solado em waffle que gruda na lixa.",
    care: "Escova com sabão neutro. Seque à sombra.",
    priceCents: 27990,
    sold: 112,
    palette: [
      { name: "Preto e caramelo", hex: "#1A1A1A" },
    ],
    pairsWith: ["bloco", "basalto", "quadra"],
    reviews: [],
  },
  {
    slug: "linha",
    name: "Linha Court",
    category: "casual",
    short: "Couro conhaque, perfil fino, uma costura só.",
    story: "Uma linha só, do calcanhar à ponta. O tênis para quando a roupa fala mais alto.",
    care: "Pano úmido e hidratante de couro uma vez por mês.",
    priceCents: 35990,
    sold: 56,
    palette: [
      { name: "Conhaque", hex: "#8C6A4F" },
    ],
    pairsWith: ["trama", "quadra", "varzea"],
    reviews: [],
  },
  {
    slug: "ferro",
    name: "Ferro Boot",
    category: "streetwear",
    short: "Cano alto em nobuck, solado tratorado para o inverno.",
    story: "Pesado no visual, leve no pé. Cano alto com acolchoado duplo e solado tratorado para o inverno do vale.",
    care: "Nobuck: escova a seco. Couro: pano úmido.",
    priceCents: 57990,
    sold: 43,
    palette: [
      { name: "Café", hex: "#4A3426" },
    ],
    pairsWith: ["basalto", "serra", "bloco"],
    reviews: [],
  },
];

export const products: Product[] = seeds.map(build);

export const productBySlug = new Map(products.map((p) => [p.slug, p]));

export const variantBySku = new Map(
  products.flatMap((p) => p.variants.map((v) => [v.sku, { product: p, variant: v }] as const)),
);

export const HERO_SLUG = "orbita";
