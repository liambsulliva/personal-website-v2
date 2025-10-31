import type { MiddlewareHandler } from "astro";
import bcrypt from "bcryptjs";

const PROTECTED_PREFIXES = ["/dashboard"];

export const onRequest: MiddlewareHandler = async (context, next) => {
  const url = new URL(context.request.url);
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => url.pathname === p || url.pathname.startsWith(p + "/"),
  );
  if (!isProtected) return next();

  const authHeader = context.request.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("basic ")) {
    return new Response("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Dashboard"' },
    });
  }

  const base64 = authHeader.slice(6).trim();
  let decoded: string;
  try {
    decoded = Buffer.from(base64, "base64").toString("utf8");
  } catch {
    return new Response("Invalid auth", { status: 400 });
  }

  const idx = decoded.indexOf(":");
  const username = idx === -1 ? "" : decoded.slice(0, idx);
  const password = idx === -1 ? "" : decoded.slice(idx + 1);

  const usrHash = import.meta.env.AUTH_USER_HASH;
  if (!usrHash) {
    return new Response("Server not configured", { status: 500 });
  }

  const usrOk = await bcrypt.compare(username, usrHash);
  if (!usrOk) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Dashboard"' },
    });
  }

  const passHash = import.meta.env.AUTH_PASSWORD_HASH;
  if (!passHash) {
    return new Response("Server not configured", { status: 500 });
  }

  const passOk = await bcrypt.compare(password, passHash);
  if (!passOk) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Dashboard"' },
    });
  }

  return next();
};
