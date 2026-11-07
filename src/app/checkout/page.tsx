import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

export default function Checkout() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-24 md:px-8">
      <h1 className="pb-8 pt-6 font-serif text-[clamp(2.8rem,6vw,5rem)] leading-none">Finalizar compra</h1>
      <CheckoutForm />
    </div>
  );
}
