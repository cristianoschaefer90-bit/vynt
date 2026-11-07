import type { Metadata } from "next";
import { STORE } from "@/lib/config";
import { waLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Trocas e devoluções", alternates: { canonical: "/trocas" } };

// TROCAR: revisar a política com o dono da loja antes de publicar.
export default function Trocas() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 md:px-8">
      <h1 className="font-serif text-[clamp(2.8rem,7vw,5.5rem)] leading-none">Trocas e devoluções</h1>
      <div className="mt-10 space-y-8 text-lg leading-relaxed text-tinta-2">
        <section>
          <h2 className="text-xl font-medium text-tinta">Troca de número</h2>
          <p className="mt-2">
            Em até {STORE.freeExchangeDays} dias, sem custo. No Vale do Paranhana o motoboy leva o número novo e busca o outro na mesma viagem. Pelos Correios, mandamos a etiqueta de volta.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-medium text-tinta">Devolução</h2>
          <p className="mt-2">Comprou pela internet e desistiu? Você tem 7 dias corridos depois de receber para devolver, com o dinheiro de volta (art. 49 do Código de Defesa do Consumidor).</p>
        </section>
        <section>
          <h2 className="text-xl font-medium text-tinta">Como pedir</h2>
          <p className="mt-2">Manda o número do pedido no WhatsApp. O tênis precisa estar sem uso na rua, com a caixa.</p>
          <a className="btn btn-tinta mt-6" href={waLink("Oi, Vynt! Quero trocar o número do meu pedido #")} target="_blank" rel="noopener noreferrer">
            Pedir troca no WhatsApp
          </a>
        </section>
      </div>
    </div>
  );
}
