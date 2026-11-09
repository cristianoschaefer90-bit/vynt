import "server-only";
import { cookies } from "next/headers";
import { createHmac, randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { getUser } from "./store";

const scrypt = promisify(_scrypt) as (pwd: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;
const COOKIE = "vynt_sessao";
const TTL = 60 * 60 * 24 * 30; // 30 dias
const PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function secret() {
  const s = process.env.SESSION_SECRET ?? process.env.ORDER_SECRET ?? process.env.ADMIN_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV !== "production") return "dev-session-secret";
  throw new Error("SESSION_SECRET ausente");
}

export async function hashPassword(pwd: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(pwd.normalize("NFKC"), salt, 32, PARAMS);
  return { passHash: hash.toString("base64"), salt: salt.toString("base64") };
}

export async function verifyPassword(pwd: string, passHash: string, salt: string) {
  const hash = await scrypt(pwd.normalize("NFKC"), Buffer.from(salt, "base64"), 32, PARAMS);
  const ref = Buffer.from(passHash, "base64");
  return ref.length === hash.length && timingSafeEqual(ref, hash);
}

/** Hash "isca" para gastar o mesmo tempo quando o e-mail não existe (evita descobrir contas). */
export async function dummyVerify(pwd: string) {
  await scrypt(pwd, Buffer.alloc(16), 32, PARAMS);
  return false;
}

const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("base64url");

export async function startCustomerSession(userId: string) {
  const exp = Math.floor(Date.now() / 1000) + TTL;
  const body = `${userId}.${exp}`;
  (await cookies()).set(COOKIE, `${body}.${sign(body)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL,
  });
}

export async function endCustomerSession() {
  (await cookies()).delete(COOKIE);
}

/** Cliente logado (ou null). */
export async function currentCustomer() {
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return null;
  const parts = v.split(".");
  if (parts.length !== 3) return null;
  const [id, exp, sig] = parts;
  const expect = sign(`${id}.${exp}`);
  const a = Buffer.from(sig), b = Buffer.from(expect);
  if (a.length !== b.length || !timingSafeEqual(a, b) || Number(exp) < Date.now() / 1000) return null;
  const u = await getUser(id);
  return u ? { id: u.id, name: u.name, email: u.email, phone: u.phone } : null;
}
