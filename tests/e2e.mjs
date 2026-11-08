// Fluxo completo: produto → sacola → checkout Pix → pedido → admin muda status.
import { chromium } from "@playwright/test";
const base = process.env.BASE ?? "http://localhost:3100";
const out = process.argv[2] ?? "e2e";
const w = Number(process.argv[3] ?? 390);
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const page = await browser.newPage({ viewport: { width: w, height: w < 768 ? 844 : 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const step = async (name, fn) => {
  try {
    await fn();
    console.log("✓", name);
  } catch (e) {
    console.log("✗", name, e.message.split("\n")[0]);
    await page.screenshot({ path: `${out}-falha.png`, fullPage: true });
    throw e;
  }
};

let totalCheckout = "";
await step("abre produto", async () => {
  await page.goto(base + "/p/trama", { waitUntil: "networkidle" });
  await page.getByRole("heading", { level: 1, name: "Trama Low" }).waitFor();
});
await step("exige número antes de adicionar", async () => {
  await page.getByRole("button", { name: "Colocar na sacola" }).first().click();
  await page.getByText("Escolhe o número antes").waitFor();
});
await step("calcula frete por CEP", async () => {
  await page.getByLabel("Calcular entrega").fill("95660000");
  await page.getByRole("button", { name: "Calcular" }).click();
  await page.getByText("Motoboy Vynt").waitFor({ timeout: 15000 });
});
await step("adiciona nº 40 e abre a sacola", async () => {
  await page.locator('label:has(input[aria-label^="Número 40"])').first().click();
  await page.getByRole("button", { name: "Colocar na sacola" }).first().click();
  await page.getByRole("dialog", { name: "Sacola" }).waitFor();
  await page.screenshot({ path: `${out}-sacola.png` });
});
await step("troca numeração dentro da sacola", async () => {
  await page.getByRole("dialog").getByLabel("Numeração").selectOption({ label: "Nº 41" });
  await page.getByRole("dialog").getByLabel("Numeração").locator("option:checked").filter({ hasText: "41" }).waitFor({ state: "attached" });
});
await step("leve 2: desconto aparece com 2 pares", async () => {
  await page.getByRole("dialog").getByRole("button", { name: "Aumentar quantidade" }).click();
  await page.getByRole("dialog").getByText(/Leve 2 \(/).waitFor();
});
await step("aplica cupom", async () => {
  await page.getByRole("button", { name: "Tenho um cupom" }).click();
  await page.getByLabel("Código do cupom").fill("PRIMEIRO10");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await page.getByText("PRIMEIRO10").first().waitFor();
});
await step("vai para o checkout", async () => {
  await page.getByRole("link", { name: /Finalizar compra/ }).click();
  await page.waitForURL("**/checkout");
  await page.getByRole("heading", { name: "Finalizar compra" }).waitFor();
});
await step("valida campos vazios", async () => {
  await page.getByRole("button", { name: /Gerar Pix/ }).click();
  await page.getByText("Digite seu nome completo").waitFor();
});
await step("preenche e envia", async () => {
  await page.getByRole("textbox", { name: "Nome completo" }).fill("Cliente Teste");
  await page.getByRole("textbox", { name: "WhatsApp" }).fill("51999998888");
  await page.getByRole("textbox", { name: "CEP" }).fill("95660-000");
  await page.getByRole("textbox", { name: "Rua" }).waitFor({ timeout: 15000 });
  await page.getByRole("textbox", { name: "Rua" }).fill("Rua das Flores");
  await page.getByRole("textbox", { name: "Número", exact: true }).fill("120");
  await page.getByText("Motoboy Vynt").waitFor();
  await page.screenshot({ path: `${out}-checkout.png`, fullPage: true });
  totalCheckout = (await page.getByRole("button", { name: /Gerar Pix/ }).textContent()).split("·")[1].trim();
  await page.getByRole("button", { name: /Gerar Pix/ }).click();
  await page.waitForURL("**/pedido/**", { timeout: 20000 });
});
await step("pedido com Pix", async () => {
  await page.getByRole("heading", { name: "Falta só o Pix." }).waitFor();
  await page.getByText("Leve 2", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Copiar código Pix" }).waitFor();
  const shown = (await page.locator("#pix-titulo + p").textContent()).trim();
  if (shown.replace(/\s/g, "") !== totalCheckout.replace(/\s/g, "")) throw new Error(`total diferente: checkout ${totalCheckout} vs pedido ${shown}`);
  await page.screenshot({ path: `${out}-pedido.png`, fullPage: true });
});
const pedidoUrl = page.url();
await step("aparece em Minha conta", async () => {
  await page.goto(base + "/conta");
  await page.getByRole("link", { name: /#\d+/ }).first().waitFor();
});
await step("admin: login e muda status", async () => {
  await page.goto(base + "/admin");
  await page.getByLabel("Senha").fill(process.env.ADMIN_PASSWORD ?? "vynt-demo");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.getByText("Pedidos hoje").waitFor();
  const card = page.locator("li", { hasText: "Cliente Teste" }).first();
  await card.getByLabel("Status").selectOption("em_rota");
  await card.getByRole("button", { name: "Salvar" }).click();
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${out}-admin.png`, fullPage: true });
});
await step("status atualizado no pedido", async () => {
  await page.goto(pedidoUrl);
  await page.getByText("Saiu para entrega").waitFor();
  await page.locator('[aria-current="step"]', { hasText: "Saiu para entrega" }).waitFor();
});
console.log(errors.length ? "ERROS: " + errors.join(" | ") : "sem erros de página");
await browser.close();
