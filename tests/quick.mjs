// Busca + compra rápida pelo card
import { chromium } from "@playwright/test";
const base = process.env.BASE ?? "http://localhost:3100";
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto(base + "/", { waitUntil: "networkidle" });
await p.getByRole("button", { name: "Buscar" }).click();
await p.getByRole("textbox", { name: "Buscar" }).fill("corrida azul");
await p.getByRole("dialog", { name: "Buscar tênis" }).getByRole("link", { name: /Pulso 2/ }).waitFor();
console.log("✓ busca encontra Pulso 2");
await p.keyboard.press("Escape");
await p.goto(base + "/loja", { waitUntil: "networkidle" });
await p.getByRole("button", { name: /Comprar Trama Low/ }).click();
await p.getByRole("dialog", { name: /Escolha o número do Trama Low/ }).getByRole("button", { name: "Número 39" }).click();
await p.getByRole("dialog", { name: "Sacola" }).getByText("Trama Low").waitFor();
console.log("✓ compra rápida pelo card abre a sacola com o item");
await b.close();
