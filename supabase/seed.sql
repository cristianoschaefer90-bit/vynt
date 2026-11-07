-- Vynt — dados de demonstração. TROCAR: todos os produtos, preços, estoques,
-- avaliações, cupons e tabela de motoboy são exemplos.

insert into public.categories (slug, name, tagline, sort) values
  ('casual',     'Casual',     'Para o dia inteiro, da aula ao rolê.', 1),
  ('streetwear', 'Streetwear', 'Cano, volume e couro. Feito para ser visto.', 2),
  ('corrida',    'Corrida',    'Amortecimento para o asfalto da RS-115.', 3);

with c as (select id, slug from public.categories)
insert into public.products (slug, name, category_id, short_description, story, care, price_cents, compare_at_cents, badge, featured, sold_count, images)
values
  ('vynt-orbita', 'Órbita Runner', (select id from c where slug='corrida'),
   'Entressola em espuma dupla, cabedal em mesh respirável.',
   'Desenhado para quem corre cedo na beira do Paranhana. A espuma dupla segura o impacto nos primeiros quilômetros e devolve energia no final.',
   'Lave à mão com sabão neutro. Seque à sombra, sem secadora. Tire a palmilha para arejar.',
   59990, 69990, 'mais_vendido', true, 184,
   array['/produtos/orbita-1.webp','/produtos/orbita-2.webp','/produtos/orbita-3.webp']),
  ('vynt-trama', 'Trama Low', (select id from c where slug='casual'),
   'Couro sintético premium e sola vulcanizada.',
   'O tênis branco que combina com tudo, com costura dupla na biqueira para durar mais que uma estação.',
   'Pano úmido no cabedal, escova macia na sola. Evite água sanitária.',
   38990, null, 'mais_vendido', false, 152,
   array['/produtos/trama-1.webp','/produtos/trama-2.webp','/produtos/trama-3.webp']),
  ('vynt-basalto', 'Basalto High', (select id from c where slug='streetwear'),
   'Cano alto em camurça com recortes sobrepostos.',
   'Inspirado nas pedras do vale: tons fechados, textura e volume. Cano alto com acolchoado no tornozelo.',
   'Escova de camurça a seco. Impermeabilizante antes do primeiro uso.',
   54990, null, 'novo', false, 61,
   array['/produtos/basalto-1.webp','/produtos/basalto-2.webp','/produtos/basalto-3.webp']),
  ('vynt-serra', 'Serra Trail', (select id from c where slug='corrida'),
   'Solado com cravos e biqueira reforçada.',
   'Para a trilha do Morro da Cruz e para a chuva de inverno. Cravos de 4 mm e cabedal que seca rápido.',
   'Retire o barro com escova. Seque com papel por dentro, longe do sol.',
   64990, null, 'novo', false, 38,
   array['/produtos/serra-1.webp','/produtos/serra-2.webp','/produtos/serra-3.webp']),
  ('vynt-pulso', 'Pulso 2', (select id from c where slug='corrida'),
   'Leve, 240 g, drop de 8 mm.',
   'Treino de ritmo e dia a dia. O Pulso 2 ganhou mais espuma no calcanhar e uma língua sem costura.',
   'Lave à mão. Não use secadora.',
   47990, null, null, false, 97,
   array['/produtos/pulso-1.webp','/produtos/pulso-2.webp','/produtos/pulso-3.webp']),
  ('vynt-quadra', 'Quadra 86', (select id from c where slug='casual'),
   'Silhueta retrô de quadra, camurça e couro.',
   'Linhas dos anos 80, palmilha atual. O tênis que segura um look inteiro.',
   'Camurça: escova a seco. Couro: pano úmido.',
   42990, null, 'mais_vendido', false, 131,
   array['/produtos/quadra-1.webp','/produtos/quadra-2.webp','/produtos/quadra-3.webp']),
  ('vynt-bloco', 'Bloco Chunky', (select id from c where slug='streetwear'),
   'Solado alto em camadas, 5 cm.',
   'Volume sem peso: o solado em camadas tem bolsões de ar para não cansar o pé.',
   'Escova macia e pano úmido. Guarde com enchimento de papel.',
   49990, null, null, false, 74,
   array['/produtos/bloco-1.webp','/produtos/bloco-2.webp','/produtos/bloco-3.webp']),
  ('vynt-varzea', 'Várzea Slip', (select id from c where slug='casual'),
   'Sem cadarço, elástico lateral, calça em 2 segundos.',
   'Para quem sai correndo de casa. Elástico lateral firme e palmilha removível.',
   'Lave à mão. Seque à sombra.',
   29990, 34990, null, false, 88,
   array['/produtos/varzea-1.webp','/produtos/varzea-2.webp','/produtos/varzea-3.webp']),
  ('vynt-neblina', 'Neblina Knit', (select id from c where slug='corrida'),
   'Cabedal em tricô sem costura, ajuste de meia.',
   'Leve como a neblina da manhã na serra. Tricô que se molda ao pé desde o primeiro uso.',
   'Máquina em ciclo delicado dentro de saco de lavagem. Seque à sombra.',
   44990, null, 'novo', false, 29,
   array['/produtos/neblina-1.webp','/produtos/neblina-2.webp','/produtos/neblina-3.webp']),
  ('vynt-asfalto', 'Asfalto Skate', (select id from c where slug='streetwear'),
   'Lona reforçada, sola de borracha aderente.',
   'Para a pista e para a rua. Lona dupla na área de atrito e solado em waffle.',
   'Escova com sabão neutro. Seque à sombra.',
   27990, null, null, false, 112,
   array['/produtos/asfalto-1.webp','/produtos/asfalto-2.webp','/produtos/asfalto-3.webp']),
  ('vynt-linha', 'Linha Court', (select id from c where slug='casual'),
   'Couro liso, perfil fino, minimalista.',
   'Uma linha só, do calcanhar à ponta. O tênis para quando a roupa fala mais alto.',
   'Pano úmido e hidratante de couro a cada mês.',
   35990, null, null, false, 56,
   array['/produtos/linha-1.webp','/produtos/linha-2.webp','/produtos/linha-3.webp']),
  ('vynt-ferro', 'Ferro Mid', (select id from c where slug='streetwear'),
   'Cano médio, couro e nobuck, solado tratorado.',
   'Pesado no visual, leve no pé. Cano médio com fecho em velcro sobre o cadarço.',
   'Nobuck: escova a seco. Couro: pano úmido.',
   57990, null, null, false, 43,
   array['/produtos/ferro-1.webp','/produtos/ferro-2.webp','/produtos/ferro-3.webp']);

-- Variações: cores por produto × numeração 34–44, estoque determinístico
with cores(slug, color, hex) as (values
  ('vynt-orbita','Osso','#E9E4DA'), ('vynt-orbita','Grafite','#2B2B2B'), ('vynt-orbita','Telha','#A63D2A'),
  ('vynt-trama','Branco','#F4F2EE'), ('vynt-trama','Preto','#151515'),
  ('vynt-basalto','Basalto','#3A3632'), ('vynt-basalto','Areia','#C9B79C'),
  ('vynt-serra','Musgo','#4A5240'), ('vynt-serra','Grafite','#2B2B2B'),
  ('vynt-pulso','Osso','#E9E4DA'), ('vynt-pulso','Azul-noite','#1F2A3A'), ('vynt-pulso','Telha','#A63D2A'),
  ('vynt-quadra','Creme','#EDE3CF'), ('vynt-quadra','Couro','#8C6A4F'),
  ('vynt-bloco','Osso','#E9E4DA'), ('vynt-bloco','Preto','#151515'),
  ('vynt-varzea','Preto','#151515'), ('vynt-varzea','Areia','#C9B79C'),
  ('vynt-neblina','Cinza','#9A9792'), ('vynt-neblina','Osso','#E9E4DA'),
  ('vynt-asfalto','Preto','#151515'), ('vynt-asfalto','Vinho','#5E1F22'),
  ('vynt-linha','Branco','#F4F2EE'), ('vynt-linha','Couro','#8C6A4F'),
  ('vynt-ferro','Café','#4A3426'), ('vynt-ferro','Preto','#151515')
)
insert into public.variants (product_id, color, color_hex, size, sku, stock)
select p.id, c.color, c.hex, s.size,
       upper(replace(p.slug,'vynt-','')) || '-' || upper(left(regexp_replace(c.color,'[^A-Za-z]','','g'),3)) || '-' || s.size,
       case when s.size in (34, 44) then (abs(hashtext(p.slug || c.color || s.size)) % 3)
            else 2 + (abs(hashtext(p.slug || c.color || s.size)) % 7) end
  from cores c
  join public.products p on p.slug = c.slug
  cross join generate_series(34, 44) as s(size);

-- Avaliações de exemplo (TROCAR por avaliações reais antes de publicar)
insert into public.reviews (product_id, author, city, rating, body, photo_url, approved)
select p.id, r.author, r.city, r.rating, r.body, r.photo, true
from (values
  ('vynt-orbita','Júlia M.','Igrejinha',5,'Chegou no mesmo dia, de tarde. Corri 8 km no domingo e nada de bolha.','/avaliacoes/orbita-julia.webp'),
  ('vynt-orbita','Rafael T.','Três Coroas',5,'Troquei do 41 pro 42 sem pagar nada, o motoboy levou e trouxe.',null),
  ('vynt-orbita','Bruna K.','Taquara',4,'Muito confortável. A cor telha é mais fechada que na foto.',null),
  ('vynt-trama','Lucas P.','Parobé',5,'Branco que não amarela fácil. Comprei o segundo.','/avaliacoes/trama-lucas.webp'),
  ('vynt-trama','Ana C.','Três Coroas',4,'Forma um pouco justa, pedi meio número acima.',null),
  ('vynt-quadra','Gabriel S.','Igrejinha',5,'Retirei na loja no intervalo do almoço. Igual da foto.',null),
  ('vynt-basalto','Maria E.','Taquara',5,'A camurça é muito boa. Usei com impermeabilizante e aguentou a chuva.',null),
  ('vynt-pulso','Henrique D.','Três Coroas',5,'Leve demais. Uso pra treino e pro trabalho.',null)
) as r(slug, author, city, rating, body, photo)
join public.products p on p.slug = r.slug;

-- Cupons de exemplo
insert into public.coupons (code, kind, value, min_subtotal_cents) values
  ('PRIMEIRO10', 'percent', 10, 0),
  ('VALE30', 'fixed', 3000, 30000);

-- Motoboy no Vale do Paranhana (TROCAR: valores e prazos reais)
insert into public.shipping_zones (city, label, price_cents, eta) values
  ('tres coroas', 'Três Coroas', 0,    'Hoje, para pedidos até 16h'),
  ('igrejinha',   'Igrejinha',   900,  'Hoje, para pedidos até 15h'),
  ('taquara',     'Taquara',     1400, 'Hoje, para pedidos até 14h'),
  ('parobe',      'Parobé',      1600, 'Hoje, para pedidos até 14h'),
  ('rolante',     'Rolante',     1600, 'Amanhã'),
  ('riozinho',    'Riozinho',    1600, 'Amanhã'),
  ('gramado',     'Gramado',     1900, 'Amanhã'),
  ('canela',      'Canela',      1900, 'Amanhã');
