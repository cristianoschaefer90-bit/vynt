import type { Metadata } from "next";
import { Account } from "@/components/account/account";

export const metadata: Metadata = { title: "Minha conta", robots: { index: false } };

export default function Conta() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-6 md:px-8">
      <h1 className="font-serif text-[clamp(2.8rem,7vw,6rem)] leading-none">Minha conta</h1>
      <Account />
    </div>
  );
}
