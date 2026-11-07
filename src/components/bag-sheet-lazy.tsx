"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";

const BagSheet = dynamic(() => import("./bag-sheet").then((m) => m.BagSheet), { ssr: false });

/** Só baixa o código da sacola (e o Framer Motion) na primeira vez que ela abre. */
export function BagSheetLazy() {
  const open = useCart((s) => s.open);
  const [load, setLoad] = useState(false);
  useEffect(() => {
    if (open) setLoad(true);
  }, [open]);
  return load ? <BagSheet /> : null;
}
