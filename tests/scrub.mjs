// Prints de viewport em vários pontos do scroll: node tests/scrub.mjs <path> <out> <largura> <y1,y2,...>
import { chromium } from "@playwright/test";
const [path, out, w, ys] = process.argv.slice(2);
const base = process.env.BASE ?? "http://localhost:3100";
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const page = await browser.newPage({ viewport: { width: +w, height: +w < 768 ? 844 : 900 } });
await page.goto(base + path, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
for (const y of ys.split(",")) {
  await page.mouse.wheel(0, 0);
  await page.evaluate((v) => window.scrollTo(0, v), +y);
  await page.waitForTimeout(1300);
  await page.screenshot({ path: `${out}-${w}-${y}.png` });
}
console.log(await page.evaluate(() => document.documentElement.scrollHeight));
await browser.close();
