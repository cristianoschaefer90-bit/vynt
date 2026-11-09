// Conta do cliente: cria conta no checkout → pedido aparece → entra em outro "aparelho" e vê o pedido.
import { chromium } from "@playwright/test";
const base = process.env.BASE ?? "http://localhost:3100";
const email = `teste${Date.now()}@exemplo.com`;
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const ok = (m) => console.log("✓", m);

// aparelho 1: compra criando conta
const c1 = await b.newContext({ viewport: { width: 390, height: 844 } });
const p = await c1.newPage();
await p.goto(base + "/p/quadra", { waitUntil: "networkidle" });
await p.locator('label:has(input[aria-label^="Número 39"])').first().click();
await p.getByRole("button", { name: "Comprar agora" }).click();
await p.waitForURL("**/checkout");
await p.getByRole("textbox", { name: "Nome completo" }).fill("Maria Conta");
await p.getByRole("textbox", { name: "WhatsApp" }).fill("51988887777");
await p.getByRole("textbox", { name: /E-mail/ }).fill(email);
await p.getByRole("radio", { name: "Retirar na loja" }).click();
await p.getByLabel(/Criar conta/).check();
await p.getByLabel("Crie uma senha").fill("abc");
await p.getByRole("button", { name: /Gerar Pix/ }).click();
await p.getByText("Mínimo de 8 caracteres, com letras e números").first().waitFor();
ok("valida senha fraca");
await p.getByLabel("Crie uma senha").fill("senhaforte1");
await p.getByRole("button", { name: /Gerar Pix/ }).click();
await p.waitForURL("**/pedido/**");
const code = p.url().match(/pedido\/(\d+)/)[1];
ok(`pedido #${code} criado com conta`);
await p.goto(base + "/conta", { waitUntil: "networkidle" });
await p.getByRole("heading", { name: /Oi, Maria/ }).waitFor();
await p.getByRole("link", { name: new RegExp(`Pedido #${code}`) }).waitFor();
ok("Minha conta mostra o pedido");
await p.getByRole("button", { name: "Sair da conta" }).click();
await p.getByRole("tab", { name: "Entrar" }).waitFor();
ok("sai da conta");

// aparelho 2: só login
const c2 = await b.newContext({ viewport: { width: 1440, height: 900 } });
const q = await c2.newPage();
await q.goto(base + "/conta", { waitUntil: "networkidle" });
await q.getByRole("textbox", { name: "E-mail" }).fill(email);
await q.locator("input[name=password]").fill("errada123");
await q.getByRole("button", { name: "Entrar" }).click();
await q.getByText("E-mail ou senha incorretos.").waitFor();
ok("recusa senha errada");
await q.locator("input[name=password]").fill("senhaforte1");
await q.getByRole("button", { name: "Entrar" }).click();
await q.getByRole("link", { name: new RegExp(`Pedido #${code}`) }).waitFor();
ok("outro aparelho: login mostra o pedido");
await q.screenshot({ path: (process.argv[2] ?? "/tmp/conta") + "-logado.png", fullPage: true });

// endereço
await q.goto(base + "/conta?aba=enderecos");
await q.getByRole("textbox", { name: "CEP", exact: true }).fill("95660000");
await q.getByRole("textbox", { name: /Rua/ }).fill("Rua Teste");
await q.getByRole("textbox", { name: "Número", exact: true }).fill("50");
await q.getByRole("button", { name: "Salvar endereço" }).click();
await q.getByText("Rua Teste, 50").waitFor();
ok("salva endereço na conta");

// checkout logado vem preenchido
await q.goto(base + "/p/linha", { waitUntil: "networkidle" });
await q.locator('label:has(input[aria-label^="Número 40"])').first().click();
await q.getByRole("button", { name: "Comprar agora" }).click();
await q.waitForURL("**/checkout");
await q.getByText(`Comprando como ${email}`).waitFor();
const nome = await q.getByRole("textbox", { name: "Nome completo" }).inputValue();
if (nome !== "Maria Conta") throw new Error("checkout não preencheu nome: " + nome);
ok("checkout logado vem preenchido");
await b.close();
