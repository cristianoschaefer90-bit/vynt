# Vynt — loja de tênis (Três Coroas/RS)

E-commerce editorial em Next.js 15 (App Router) + TypeScript + Tailwind v4 + GSAP.
**Demo:** produtos, preços, estoque, avaliações e chave Pix são exemplos (`STORE.demo = true`, sem indexação no Google).

## Rodar

```bash
npm install
npm run dev          # http://localhost:3000  ·  painel: /admin (senha em dev: vynt-demo)
npm run build && npm start
```

## O que funciona

| Tela | Rota |
| --- | --- |
| Home (capa + vista explodida no scroll + mais vendidos) | `/` |
| Categoria com filtros (número, cor, preço) e ordenação | `/loja`, `/loja/casual` … |
| Produto: galeria, numeração, frete por CEP, avaliações, "combina com" | `/p/orbita` … |
| Sacola lateral persistente (troca de número, cupom) | qualquer página |
| Checkout de 1 página: Pix com desconto, cartão por link, WhatsApp | `/checkout` |
| Pedido confirmado + status (atualiza sozinho) + QR Pix | `/pedido/[nº]?t=…` |
| Minha conta: pedidos, endereços, dados (salvos no aparelho) | `/conta` |
| Painel: pedidos/status, estoque por número, preço e "à venda" | `/admin` |

Segurança: preço, cupom, frete e estoque são **recalculados no servidor** (`src/app/actions/checkout.ts`); o navegador só manda SKU e quantidade. Painel com senha + cookie assinado (HMAC, httpOnly, SameSite=Strict), limite de tentativas, honeypot no checkout, cabeçalhos de segurança em `next.config.ts`.

## Como editar

| Quero mudar… | Arquivo |
| --- | --- |
| Produtos, descrições, preços base, avaliações | `src/data/catalogo.ts` |
| Fotos | `public/produtos/<slug>/1.webp` (lateral), `2.webp`, `3.webp`, `thumb.webp` — gere com `python3 scripts/process-photos.py <pasta-das-fotos> public` |
| WhatsApp, endereço, horário, % do Pix, parcelas, CEP de origem | `src/lib/config.ts` |
| Tabela do motoboy e estimativa dos Correios | `src/lib/shipping.ts` |
| Cupons | `src/lib/coupons.ts` |
| Cores e fontes | `src/app/globals.css` (`@theme`) |

Tudo que precisa do dado real está marcado com `// TROCAR`. Quando tudo for real, mude `demo: false` em `src/lib/config.ts` (libera indexação e o `aggregateRating` no schema).

## Variáveis de ambiente (`.env.example`)

- `ADMIN_PASSWORD` (8+ caracteres) e `ADMIN_SECRET` — obrigatórias em produção para o painel.
- `ORDER_SECRET` — assina o link do pedido.
- `PIX_KEY`, `PIX_MERCHANT_NAME`, `PIX_MERCHANT_CITY` — gera o QR Pix (BR Code) com o valor do pedido.
- `NEXT_PUBLIC_SITE_URL` — URL pública (SEO).

## Limites desta versão (sem banco)

- Pedidos e ajustes de estoque ficam em `.data/db.json` (local). **Na Vercel** isso é temporário (`/tmp`): o cliente sempre vê o pedido pelo link assinado, mas o painel só mostra o que caiu na mesma instância. Para produção, ligue o Supabase.
- Pix é **estático** (QR com valor); a baixa é manual no painel. Para confirmação automática, ligar Mercado Pago (Pix + cartão com webhook).
- Correios: valor **estimado** por região. Para cotação real, ligar Melhor Envio ou contrato Correios em `src/lib/shipping.ts`.

## Próximo passo: Supabase

`supabase/migrations/0001_schema.sql` já tem as tabelas (produtos, variações, estoque, pedidos, endereços, cupons, frete), **RLS em todas**, a função `place_order` (recalcula preço/cupom/estoque com lock e só roda com service role) e Realtime no status. `supabase/seed.sql` tem os dados de demo. A troca é feita em `src/lib/store.ts` (mesmo contrato).

## Testes

```bash
npm run build && ADMIN_PASSWORD=teste-admin-123 ADMIN_SECRET=xyz npm start -- -p 3100
ADMIN_PASSWORD=teste-admin-123 node tests/e2e.mjs /tmp/e2e 390   # fluxo completo
node tests/shots.mjs / /tmp/home 360,390,768,1024,1440           # prints + scroll lateral
```
