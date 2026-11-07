import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "vynt_admin";
const TTL = 60 * 60 * 8; // 8 h

/** Senha do painel. Em produção é obrigatório definir ADMIN_PASSWORD e ADMIN_SECRET. */
export function adminConfig() {
  const dev = process.env.NODE_ENV !== "production";
  const password = process.env.ADMIN_PASSWORD ?? (dev ? "vynt-demo" : "");
  const secret = process.env.ADMIN_SECRET ?? (dev ? "dev-secret-troque" : "");
  return { password, secret, enabled: Boolean(password && secret && password.length >= 8), dev };
}

const sign = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest("base64url");

function safeEq(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkPassword(input: string) {
  const { password, enabled } = adminConfig();
  if (!enabled) return false;
  const h = (s: string) => createHmac("sha256", "cmp").update(s).digest();
  return timingSafeEqual(h(input), h(password));
}

export async function startSession() {
  const { secret } = adminConfig();
  const exp = Math.floor(Date.now() / 1000) + TTL;
  const value = `${exp}.${sign(String(exp), secret)}`;
  (await cookies()).set(COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: TTL,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  const { secret, enabled } = adminConfig();
  if (!enabled) return false;
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return false;
  const [exp, sig] = v.split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return safeEq(sig, sign(exp, secret));
}

export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("UNAUTHORIZED");
}
