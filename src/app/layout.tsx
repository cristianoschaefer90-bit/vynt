import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BagSheetLazy } from "@/components/bag-sheet-lazy";
import { SITE_URL, STORE } from "@/lib/config";
import "./globals.css";

const instrument = localFont({
  src: "../fonts/InstrumentSerif.woff2",
  variable: "--font-instrument",
  weight: "400",
  display: "swap",
  preload: true,
});
const inter = localFont({
  src: "../fonts/Inter.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

const description =
  "Tênis originais com curadoria de modelos em alta, entrega no mesmo dia em Três Coroas e região, retirada na loja, troca fácil de numeração sem burocracia e Pix com desconto.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Vynt | Loja em Três Coroas", template: "%s · Vynt" },
  description,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Vynt",
    title: "Vynt | Loja em Três Coroas",
    description,
    images: [{ url: "/editorial/rua.webp", width: 2200, height: 1228 }],
  },
  robots: STORE.demo ? { index: false, follow: false } : undefined,
};

export const viewport: Viewport = {
  themeColor: "#f5f3ef",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  name: "Vynt",
  url: SITE_URL,
  description,
  telephone: "+55 51 99679-3808",
  address: { "@type": "PostalAddress", addressLocality: "Três Coroas", addressRegion: "RS", addressCountry: "BR" },
  areaServed: ["Três Coroas", "Igrejinha", "Taquara", "Parobé", "Rolante", "Riozinho", "Gramado", "Canela"],
  paymentAccepted: ["Pix", "Cartão de crédito"],
  currenciesAccepted: "BRL",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${instrument.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      </head>
      <body className="min-h-dvh antialiased">
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-tinta focus:px-4 focus:py-3 focus:text-papel">
          Pular para o conteúdo
        </a>
        <Header />
        <main id="conteudo">{children}</main>
        <Footer />
        <BagSheetLazy />
      </body>
    </html>
  );
}
