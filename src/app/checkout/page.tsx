import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { currentCustomer } from "@/lib/customer-auth";
import { addressesOf } from "@/lib/store";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Checkout() {
  const me = await currentCustomer();
  const addresses = me ? await addressesOf(me.id) : [];
  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-24 md:px-8">
      <h1 className="pb-8 pt-6 font-serif text-[clamp(2.8rem,6vw,5rem)] leading-none">Finalizar compra</h1>
      <CheckoutForm customer={me} savedAddresses={addresses} />
    </div>
  );
}
