// Prints por largura: node tests/shots.mjs <url-path> <out-prefix> [larguras]
import { chromium } from "@playwright/test";
const [path = "/", out = "shot", widths = "390,1440"] = process.argv.slice(2);
const base = process.env.BASE ?? "http://localhost:3100";
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
for (const w of widths.split(",").map(Number)) {
  const page = await browser.newPage({ viewport: { width: w, height: w < 768 ? 844 : 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(base + path, { waitUntil: "networkidle" });
  // rola até o fim para disparar as animações de entrada
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h + 2000; y += 500) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(1500);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}-${w}.png`, fullPage: true });
  console.log(w, "overflowX:", overflow, errors.length ? "ERR " + errors.slice(0, 3).join(" | ") : "ok");
  await page.close();
}
await browser.close();
